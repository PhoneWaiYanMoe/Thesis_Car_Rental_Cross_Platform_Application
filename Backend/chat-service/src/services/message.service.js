const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const ConversationParticipant = require("../models/ConversationParticipant");
const conversationService = require("./conversation.service");
const { v4: uuidv4 } = require("uuid");
const { Op } = require("sequelize");

class MessageService {
  async sendMessage(conversationId, senderId, messageData) {
    try {
      const { messageType, content, mediaFileId } = messageData;

      // get conversation
      const conversation = await Conversation.findByPk(conversationId);
      if (!conversation) {
        throw new Error("Conversation not found");
      }

      // check if conversation is active
      if (conversation.status === "blocked") {
        throw new Error("Cannot send message to blocked conversation");
      }

      // determine receiver
      const receiverId =
        senderId === conversation.customerId
          ? conversation.ownerId
          : conversation.customerId;

      // verify sender is participant
      const participant = await ConversationParticipant.findOne({
        where: { conversationId, userId: senderId },
      });

      if (!participant) {
        throw new Error("Not authorized to send message");
      }

      // create message
      const message = await Message.create({
        id: uuidv4(),
        conversationId,
        senderId,
        receiverId,
        messageType,
        content: messageType === "text" ? content : null,
        mediaFileId: messageType !== "text" ? mediaFileId : null,
        isRead: false,
      });

      // update conversation last message
      const lastMessageContent =
        messageType === "text" ? content : `[${messageType}]`;

      await conversationService.updateLastMessage(
        conversationId,
        lastMessageContent,
        senderId
      );

      // increment unread count for receiver
      await conversationService.incrementUnreadCount(
        conversationId,
        receiverId
      );

      console.log(
        `Message sent: ${message.id} in conversation ${conversationId}`
      );

      return message;
    } catch (error) {
      console.error("Send message error:", error);
      throw error;
    }
  }

  async getMessages(conversationId, userId, filters = {}) {
    try {
      const { page = 1, limit = 50, before } = filters;
      const offset = (page - 1) * limit;

      // verify user is participant
      const participant = await ConversationParticipant.findOne({
        where: { conversationId, userId },
      });

      if (!participant) {
        throw new Error("Not authorized to view messages");
      }

      // build where clause
      const where = {
        conversationId,
        isDeleted: false,
        ...(before && { createdAt: { [Op.lt]: new Date(before) } }),
      };

      // get messages
      const { count, rows } = await Message.findAndCountAll({
        where,
        order: [["createdAt", "DESC"]],
        limit,
        offset,
      });

      return {
        messages: rows.reverse(), // reverse to show oldest first
        pagination: {
          total: count,
          page,
          limit,
          hasMore: count > page * limit,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async markMessageAsRead(messageId, userId) {
    try {
      const message = await Message.findByPk(messageId);

      if (!message) {
        throw new Error("Message not found");
      }

      // only receiver can mark as read
      if (message.receiverId !== userId) {
        throw new Error("Not authorized to mark this message as read");
      }

      if (!message.isRead) {
        await message.update({
          isRead: true,
          readAt: new Date(),
        });

        // decrement unread count
        const participant = await ConversationParticipant.findOne({
          where: { conversationId: message.conversationId, userId },
        });

        if (participant && participant.unreadCount > 0) {
          await participant.update({
            unreadCount: participant.unreadCount - 1,
          });
        }
      }

      return message;
    } catch (error) {
      throw error;
    }
  }

  async markAllAsRead(conversationId, userId) {
    try {
      // verify participant
      const participant = await ConversationParticipant.findOne({
        where: { conversationId, userId },
      });

      if (!participant) {
        throw new Error("Not authorized");
      }

      // update all unread messages
      const result = await Message.update(
        { isRead: true, readAt: new Date() },
        {
          where: {
            conversationId,
            receiverId: userId,
            isRead: false,
          },
        }
      );

      // reset unread count
      await conversationService.resetUnreadCount(conversationId, userId);

      return { markedCount: result[0] };
    } catch (error) {
      throw error;
    }
  }

  async deleteMessage(messageId, userId) {
    try {
      const message = await Message.findByPk(messageId);

      if (!message) {
        throw new Error("Message not found");
      }

      // only sender can delete
      if (message.senderId !== userId) {
        throw new Error("Not authorized to delete this message");
      }

      await message.update({
        isDeleted: true,
        deletedAt: new Date(),
      });

      return { success: true };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new MessageService();
