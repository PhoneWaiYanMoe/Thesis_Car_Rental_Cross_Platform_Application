const conversationService = require("../services/conversation.service");

class ConversationController {
  async getConversations(req, res) {
    try {
      const filters = {
        status: req.query.status || "active",
        search: req.query.search || "",
        page: req.query.page || 1,
        limit: req.query.limit || 20,
      };

      const result = await conversationService.getUserConversations(
        req.user.userId,
        filters
      );

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error("Get conversations error:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getConversationById(req, res) {
    try {
      const { id } = req.params;
      const conversation = await conversationService.getConversationById(
        id,
        req.user.userId
      );

      res.status(200).json({
        success: true,
        conversation,
      });
    } catch (error) {
      console.error("Get conversation error:", error);
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  async blockConversation(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      await conversationService.blockConversation(id, req.user.userId, reason);

      res.status(200).json({
        success: true,
        message: "Conversation blocked",
      });
    } catch (error) {
      console.error("Block conversation error:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getTotalUnreadCount(req, res) {
    try {
      const result = await conversationService.getTotalUnreadCount(req.user.userId);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error("Get unread count error:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new ConversationController();
