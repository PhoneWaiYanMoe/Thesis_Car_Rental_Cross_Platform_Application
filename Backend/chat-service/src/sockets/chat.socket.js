const messageService = require("../services/message.service");
const socketService = require("../services/socket.service");
const conversationService = require("../services/conversation.service");

const setupChatSocket = (io) => {
  io.on("connection", async (socket) => {
    console.log(`Socket connected: ${socket.id} (User: ${socket.userId})`);

    // set user online
    await socketService.setUserOnline(socket.userId);

    // join user's personal room
    socket.join(socketService.getUserRoom(socket.userId));

    // emit to user's contacts that they're online
    socket.broadcast.emit("user_online", {
      userId: socket.userId,
      isOnline: true,
      timestamp: new Date(),
    });

    // JOIN CONVERSATION
    socket.on("join_conversation", async (data) => {
      try {
        const { conversationId } = data;

        // verify user is participant
        const conversation = await conversationService.getConversationById(
          conversationId,
          socket.userId,
        );

        // join conversation room
        socket.join(socketService.getConversationRoom(conversationId));

        console.log(
          `User ${socket.userId} joined conversation ${conversationId}`,
        );

        socket.emit("joined_conversation", {
          success: true,
          conversationId,
          message: "Joined conversation successfully",
        });
      } catch (error) {
        console.error("Join conversation error:", error);
        socket.emit("error", { message: error.message });
      }
    });

    // LEAVE CONVERSATION
    socket.on("leave_conversation", async (data) => {
      try {
        const { conversationId } = data;

        socket.leave(socketService.getConversationRoom(conversationId));

        console.log(
          `User ${socket.userId} left conversation ${conversationId}`,
        );

        socket.emit("left_conversation", {
          success: true,
          conversationId,
        });
      } catch (error) {
        console.error("Leave conversation error:", error);
      }
    });

    // SEND MESSAGE
    socket.on("send_message", async (data) => {
      try {
        const { conversationId, messageType, content, mediaFileId } = data;

        // send message
        const message = await messageService.sendMessage(
          conversationId,
          socket.userId,
          { messageType, content, mediaFileId },
        );

        // get conversation to send updated data
        const conversation = await conversationService.getConversationById(
          conversationId,
          socket.userId,
        );

        // emit to conversation room
        socketService.emitToConversation(conversationId, "new_message", {
          message: {
            id: message.id,
            conversationId: message.conversationId,
            senderId: message.senderId,
            messageType: message.messageType,
            content: message.content,
            mediaFileId: message.mediaFileId,
            isRead: message.isRead,
            createdAt: message.createdAt,
          },
        });

        // ✅ Emit conversation updated event to both users so it moves to top
        socketService.emitToUser(socket.userId, "conversation_updated", {
          conversationId,
          lastMessageAt: conversation.lastMessageAt,
          lastMessageContent: conversation.lastMessageContent,
        });

        // update unread count for receiver
        const receiverId = message.receiverId;
        const unreadData =
          await conversationService.getTotalUnreadCount(receiverId);

        socketService.emitToUser(receiverId, "unread_count_updated", {
          conversationId,
          totalUnreadCount: unreadData.totalUnreadCount,
        });

        // ✅ Also notify receiver that conversation was updated
        socketService.emitToUser(receiverId, "conversation_updated", {
          conversationId,
          lastMessageAt: conversation.lastMessageAt,
          lastMessageContent: conversation.lastMessageContent,
        });

        console.log(`Message sent: ${message.id}`);
      } catch (error) {
        console.error("Send message error:", error);
        socket.emit("error", { message: error.message });
      }
    });

    // TYPING START
    socket.on("typing_start", async (data) => {
      try {
        const { conversationId } = data;

        // set typing in Redis
        await socketService.setUserTyping(conversationId, socket.userId);

        // emit to others in conversation
        socketService.emitToConversationExcept(
          conversationId,
          socket.id,
          "user_typing",
          {
            conversationId,
            userId: socket.userId,
            isTyping: true,
          },
        );

        console.log(
          `User ${socket.userId} started typing in ${conversationId}`,
        );
      } catch (error) {
        console.error("Typing start error:", error);
      }
    });

    // TYPING STOP
    socket.on("typing_stop", async (data) => {
      try {
        const { conversationId } = data;

        // remove typing from Redis
        await socketService.setUserStoppedTyping(conversationId, socket.userId);

        // emit to others in conversation
        socketService.emitToConversationExcept(
          conversationId,
          socket.id,
          "user_typing",
          {
            conversationId,
            userId: socket.userId,
            isTyping: false,
          },
        );

        console.log(
          `User ${socket.userId} stopped typing in ${conversationId}`,
        );
      } catch (error) {
        console.error("Typing stop error:", error);
      }
    });

    // MARK AS READ
    socket.on("mark_as_read", async (data) => {
      try {
        const { messageId } = data;

        const message = await messageService.markMessageAsRead(
          messageId,
          socket.userId,
        );

        // emit to sender that message was read
        socketService.emitToUser(message.senderId, "message_read", {
          messageId: message.id,
          conversationId: message.conversationId,
          readAt: message.readAt,
          readBy: socket.userId,
        });

        console.log(`Message ${messageId} marked as read`);
      } catch (error) {
        console.error("Mark as read error:", error);
        socket.emit("error", { message: error.message });
      }
    });

    // DISCONNECT
    socket.on("disconnect", async () => {
      console.log(`Socket disconnected: ${socket.id} (User: ${socket.userId})`);

      // set user offline
      await socketService.setUserOffline(socket.userId);

      // get last seen
      const lastSeen = new Date();

      // emit to user's contacts that they're offline
      socket.broadcast.emit("user_offline", {
        userId: socket.userId,
        isOnline: false,
        lastSeen,
      });
    });
  });
};

module.exports = setupChatSocket;
