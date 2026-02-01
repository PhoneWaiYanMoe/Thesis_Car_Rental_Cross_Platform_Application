const messageService = require("../services/message.service");

class MessageController {
  async getMessages(req, res) {
    try {
      const { id } = req.params;
      const filters = {
        page: req.query.page || 1,
        limit: req.query.limit || 50,
        before: req.query.before,
      };

      const result = await messageService.getMessages(id, req.user.id, filters);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async sendMessage(req, res) {
    try {
      const { id } = req.params;
      const { messageType, content, mediaFileId } = req.body;

      if (!messageType) {
        return res.status(400).json({
          success: false,
          message: "messageType is required",
        });
      }

      if (messageType === "text" && !content) {
        return res.status(400).json({
          success: false,
          message: "content is required for text messages",
        });
      }

      if (messageType !== "text" && !mediaFileId) {
        return res.status(400).json({
          success: false,
          message: "mediaFileId is required for media messages",
        });
      }

      const message = await messageService.sendMessage(id, req.user.id, {
        messageType,
        content,
        mediaFileId,
      });

      res.status(201).json({
        success: true,
        message,
      });
    } catch (error) {
      console.error("Send message error:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      await messageService.markMessageAsRead(id, req.user.id);

      res.status(200).json({
        success: true,
        message: "Message marked as read",
      });
    } catch (error) {
      console.error("Mark as read error:", error);
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  async markAllAsRead(req, res) {
    try {
      const { id } = req.params;
      const result = await messageService.markAllAsRead(id, req.user.id);

      res.status(200).json({
        success: true,
        message: "All messages marked as read",
        ...result,
      });
    } catch (error) {
      console.error("Mark all as read error:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async deleteMessage(req, res) {
    try {
      const { id } = req.params;
      await messageService.deleteMessage(id, req.user.id);

      res.status(200).json({
        success: true,
        message: "Message deleted",
      });
    } catch (error) {
      console.error("Delete message error:", error);
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new MessageController();
