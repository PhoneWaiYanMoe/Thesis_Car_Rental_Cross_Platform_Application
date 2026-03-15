const Conversation = require("../models/Conversation");
const ConversationParticipant = require("../models/ConversationParticipant");
const Message = require("../models/Message");
const { v4: uuidv4 } = require("uuid");
const { Op } = require("sequelize");

class ConversationService {
  async createConversation(bookingId, customerId, ownerId, vehicleId) {
    try {
      // ✅ Check if conversation already exists between these two users
      const existingConversation = await Conversation.findOne({
        where: {
          [Op.or]: [
            { customerId, ownerId },
            { customerId: ownerId, ownerId: customerId },
          ],
        },
      });

      if (existingConversation) {
        console.log(
          `Conversation already exists: ${existingConversation.id} for users ${customerId} and ${ownerId}`,
        );
        // Update vehicleId if it's different (for new booking)
        if (existingConversation.vehicleId !== vehicleId) {
          await existingConversation.update({ vehicleId });
        }
        return existingConversation;
      }

      // create new conversation only if none exists between these users
      const conversation = await Conversation.create({
        id: uuidv4(),
        bookingId,
        customerId,
        ownerId,
        vehicleId,
        status: "active",
      });

      // create participants
      await ConversationParticipant.bulkCreate([
        {
          id: uuidv4(),
          conversationId: conversation.id,
          userId: customerId,
          role: "customer",
          unreadCount: 0,
        },
        {
          id: uuidv4(),
          conversationId: conversation.id,
          userId: ownerId,
          role: "owner",
          unreadCount: 0,
        },
      ]);

      console.log(
        `New conversation created: ${conversation.id} for booking ${bookingId}`,
      );
      return conversation;
    } catch (error) {
      console.error("Create conversation error:", error);
      throw error;
    }
  }

  async getUserConversations(userId, filters = {}) {
    try {
      const { status = "active", search = "", page = 1, limit = 20 } = filters;
      const offset = (page - 1) * limit;

      // find conversations where user is participant
      const participants = await ConversationParticipant.findAll({
        where: { userId },
        attributes: ["conversationId", "unreadCount"],
      });

      const conversationIds = participants.map((p) => p.conversationId);

      if (conversationIds.length === 0) {
        return {
          conversations: [],
          totalUnreadCount: 0,
          pagination: { total: 0, page, limit, totalPages: 0 },
        };
      }

      // build where clause
      const where = {
        id: conversationIds,
        ...(status !== "all" && { status }),
      };

      // get conversations with details
      const { count, rows } = await Conversation.findAndCountAll({
        where,
        order: [["lastMessageAt", "DESC NULLS LAST"]],
        limit,
        offset,
      });

      // calculate total unread count
      const totalUnreadCount = participants.reduce(
        (sum, p) => sum + p.unreadCount,
        0,
      );

      // format conversations (will be enhanced with user/vehicle details in real integration)
      const conversations = rows.map((conv) => {
        const participant = participants.find(
          (p) => p.conversationId === conv.id,
        );

        return {
          id: conv.id,
          bookingId: conv.bookingId,
          vehicleId: conv.vehicleId,
          otherUserId:
            userId === conv.customerId ? conv.ownerId : conv.customerId,
          lastMessage: conv.lastMessageContent
            ? {
                content: conv.lastMessageContent,
                senderId: conv.lastMessageSenderId,
                timestamp: conv.lastMessageAt,
              }
            : null,
          unreadCount: participant ? participant.unreadCount : 0,
          lastMessageAt: conv.lastMessageAt,
          status: conv.status,
          createdAt: conv.createdAt,
        };
      });

      return {
        conversations,
        totalUnreadCount,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
        },
      };
    } catch (error) {
      console.error("Get conversations error:", error);
      throw error;
    }
  }

  async getConversationById(conversationId, userId) {
    try {
      const conversation = await Conversation.findByPk(conversationId);

      if (!conversation) {
        throw new Error("Conversation not found");
      }

      // verify user is participant
      const participant = await ConversationParticipant.findOne({
        where: { conversationId, userId },
      });

      if (!participant) {
        throw new Error("Not authorized to access this conversation");
      }

      return conversation;
    } catch (error) {
      throw error;
    }
  }

  async blockConversation(conversationId, userId, reason) {
    try {
      const conversation = await this.getConversationById(
        conversationId,
        userId,
      );

      await conversation.update({ status: "blocked" });

      return { success: true, message: "Conversation blocked" };
    } catch (error) {
      throw error;
    }
  }

  async updateLastMessage(conversationId, messageContent, senderId) {
    try {
      await Conversation.update(
        {
          lastMessageAt: new Date(),
          lastMessageContent: messageContent,
          lastMessageSenderId: senderId,
        },
        { where: { id: conversationId } },
      );
    } catch (error) {
      console.error("Update last message error:", error);
    }
  }

  async incrementUnreadCount(conversationId, userId) {
    try {
      const participant = await ConversationParticipant.findOne({
        where: { conversationId, userId },
      });

      if (participant) {
        await participant.update({
          unreadCount: participant.unreadCount + 1,
        });
      }
    } catch (error) {
      console.error("Increment unread error:", error);
    }
  }

  async resetUnreadCount(conversationId, userId) {
    try {
      const participant = await ConversationParticipant.findOne({
        where: { conversationId, userId },
      });

      if (participant) {
        await participant.update({
          unreadCount: 0,
          lastReadAt: new Date(),
        });
      }
    } catch (error) {
      console.error("Reset unread error:", error);
    }
  }

  async getTotalUnreadCount(userId) {
    try {
      const participants = await ConversationParticipant.findAll({
        where: { userId },
        attributes: ["conversationId", "unreadCount"],
      });

      const total = participants.reduce((sum, p) => sum + p.unreadCount, 0);

      return {
        totalUnreadCount: total,
        conversationCounts: participants.map((p) => ({
          conversationId: p.conversationId,
          unreadCount: p.unreadCount,
        })),
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new ConversationService();
