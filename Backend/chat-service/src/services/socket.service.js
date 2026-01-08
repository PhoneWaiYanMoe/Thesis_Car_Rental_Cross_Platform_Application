const { getRedisClient } = require("../config/redis");
const { getIO } = require("../config/socket");

class SocketService {
  // online status management
  async setUserOnline(userId) {
    try {
      const redis = getRedisClient();
      const timeout = parseInt(process.env.ONLINE_STATUS_TIMEOUT) || 300;

      await redis.setEx(
        `user:online:${userId}`,
        timeout,
        Date.now().toString()
      );

      console.log(`User ${userId} is now online`);
    } catch (error) {
      console.error("Set user online error:", error);
    }
  }

  async setUserOffline(userId) {
    try {
      const redis = getRedisClient();
      await redis.del(`user:online:${userId}`);

      console.log(`User ${userId} is now offline`);
    } catch (error) {
      console.error("Set user offline error:", error);
    }
  }

  async isUserOnline(userId) {
    try {
      const redis = getRedisClient();
      const exists = await redis.exists(`user:online:${userId}`);
      return exists === 1;
    } catch (error) {
      console.error("Check online status error:", error);
      return false;
    }
  }

  async getLastSeen(userId) {
    try {
      const redis = getRedisClient();
      const timestamp = await redis.get(`user:online:${userId}`);
      return timestamp ? new Date(parseInt(timestamp)) : null;
    } catch (error) {
      console.error("Get last seen error:", error);
      return null;
    }
  }

  // typing indicators
  async setUserTyping(conversationId, userId) {
    try {
      const redis = getRedisClient();
      const timeout = parseInt(process.env.TYPING_TIMEOUT) || 3;

      await redis.setEx(
        `typing:${conversationId}:${userId}`,
        timeout,
        Date.now().toString()
      );

      console.log(`⌨️  User ${userId} is typing in ${conversationId}`);
    } catch (error) {
      console.error("Set typing error:", error);
    }
  }

  async setUserStoppedTyping(conversationId, userId) {
    try {
      const redis = getRedisClient();
      await redis.del(`typing:${conversationId}:${userId}`);

      console.log(`User ${userId} stopped typing in ${conversationId}`);
    } catch (error) {
      console.error("Stop typing error:", error);
    }
  }

  async isUserTyping(conversationId, userId) {
    try {
      const redis = getRedisClient();
      const exists = await redis.exists(`typing:${conversationId}:${userId}`);
      return exists === 1;
    } catch (error) {
      console.error("Check typing error:", error);
      return false;
    }
  }

  // socket room management
  getUserRoom(userId) {
    return `user:${userId}`;
  }

  getConversationRoom(conversationId) {
    return `conversation:${conversationId}`;
  }

  // emit events
  emitToUser(userId, event, data) {
    try {
      const io = getIO();
      io.to(this.getUserRoom(userId)).emit(event, data);
    } catch (error) {
      console.error("Emit to user error:", error);
    }
  }

  emitToConversation(conversationId, event, data) {
    try {
      const io = getIO();
      io.to(this.getConversationRoom(conversationId)).emit(event, data);
    } catch (error) {
      console.error("Emit to conversation error:", error);
    }
  }

  emitToConversationExcept(conversationId, excludeSocketId, event, data) {
    try {
      const io = getIO();
      io.to(this.getConversationRoom(conversationId))
        .except(excludeSocketId)
        .emit(event, data);
    } catch (error) {
      console.error("Emit to conversation except error:", error);
    }
  }
}

module.exports = new SocketService();
