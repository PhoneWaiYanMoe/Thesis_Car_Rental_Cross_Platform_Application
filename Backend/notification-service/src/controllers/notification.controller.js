const notificationService = require("../services/notification.service");

class NotificationController {
  async getNotifications(req, res) {
    try {
      const filters = {
        status: req.query.status || "all",
        type: req.query.type || "all",
        page: req.query.page || 1,
        limit: req.query.limit || 20,
      };

      const result = await notificationService.getUserNotifications(
        req.user.id,
        filters
      );

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      await notificationService.markAsRead(id, req.user.id);

      res.status(200).json({
        success: true,
        message: "Notification marked as read",
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
      await notificationService.markAllAsRead(req.user.id);

      res.status(200).json({
        success: true,
        message: "All notifications marked as read",
      });
    } catch (error) {
      console.error("Mark all as read error:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async deleteNotification(req, res) {
    try {
      const { id } = req.params;
      await notificationService.deleteNotification(id, req.user.id);

      res.status(200).json({
        success: true,
        message: "Notification deleted",
      });
    } catch (error) {
      console.error("Delete notification error:", error);
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getPreferences(req, res) {
    try {
      const preferences = await notificationService.getUserPreferences(
        req.user.id
      );

      res.status(200).json({
        success: true,
        preferences: preferences.preferences,
      });
    } catch (error) {
      console.error("Get preferences error:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async updatePreferences(req, res) {
    try {
      const newPreferences = req.body;
      const preferences = await notificationService.updatePreferences(
        req.user.id,
        newPreferences
      );

      res.status(200).json({
        success: true,
        message: "Preferences updated",
        preferences: preferences.preferences,
      });
    } catch (error) {
      console.error("Update preferences error:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async updateFCMToken(req, res) {
    try {
      const { fcmToken } = req.body;

      if (!fcmToken) {
        return res.status(400).json({
          success: false,
          message: "FCM token is required",
        });
      }

      await notificationService.updateFCMToken(req.user.id, fcmToken);

      res.status(200).json({
        success: true,
        message: "FCM token updated",
      });
    } catch (error) {
      console.error("Update FCM token error:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new NotificationController();
