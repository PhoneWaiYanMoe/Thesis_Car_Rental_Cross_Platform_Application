const Notification = require("../models/Notification");
const NotificationPreference = require("../models/NotificationPreference");
const emailService = require("./email.service");
const pushService = require("./push.service");
const { v4: uuidv4 } = require("uuid");
const { Op } = require("sequelize");

class NotificationService {
  /**
   * Create and send notification
   * @param {string} userId - User ID
   * @param {string} type - Notification type
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {object} data - Additional data
   * @param {string[]} channels - Channels to send (email, push, in_app)
   */
  async createAndSendNotification(
    userId,
    type,
    title,
    message,
    data = {},
    channels = ["in_app"]
  ) {
    try {
      // Check user preferences
      const preferences = await this.getUserPreferences(userId);

      const results = [];

      // Send through each channel
      for (const channel of channels) {
        if (this.shouldSendNotification(preferences, type, channel)) {
          const notification = await Notification.create({
            id: uuidv4(),
            userId,
            type,
            channel,
            title,
            message,
            data,
            status: "pending",
          });

          try {
            if (channel === "email") {
              await this.sendEmailNotification(notification, data);
            } else if (channel === "push") {
              await this.sendPushNotificationToUser(notification, preferences);
            } else if (channel === "in_app") {
              // In-app notifications are just stored in DB
              await notification.update({ status: "sent", sentAt: new Date() });
            }

            results.push({
              channel,
              success: true,
              notificationId: notification.id,
            });
          } catch (error) {
            await notification.update({
              status: "failed",
              errorMessage: error.message,
              retryCount: notification.retryCount + 1,
            });
            results.push({ channel, success: false, error: error.message });
          }
        }
      }

      return results;
    } catch (error) {
      console.error("Create notification error:", error);
      throw error;
    }
  }

  /**
   * Send email notification
   */
  async sendEmailNotification(notification, additionalData) {
    const userEmail = additionalData.email;

    if (!userEmail) {
      throw new Error("User email not provided");
    }

    // Choose appropriate email template based on type
    switch (notification.type) {
      case "booking":
        if (additionalData.bookingData) {
          await emailService.sendBookingConfirmation(
            userEmail,
            additionalData.bookingData
          );
        }
        break;
      case "payment":
        if (additionalData.paymentData) {
          await emailService.sendPaymentReceipt(
            userEmail,
            additionalData.paymentData
          );
        }
        break;
      default:
        await emailService.sendNotificationEmail(
          userEmail,
          notification.title,
          notification.message,
          additionalData.actionUrl
        );
    }

    await notification.update({ status: "sent", sentAt: new Date() });
  }

  /**
   * Send push notification
   */
  async sendPushNotificationToUser(notification, preferences) {
    const fcmToken = preferences.fcmToken;

    if (!fcmToken) {
      throw new Error("FCM token not found for user");
    }

    await pushService.sendPushNotification(
      fcmToken,
      notification.title,
      notification.message,
      notification.data
    );

    await notification.update({ status: "sent", sentAt: new Date() });
  }

  /**
   * Get user preferences (create default if not exists)
   */
  async getUserPreferences(userId) {
    let preferences = await NotificationPreference.findOne({
      where: { userId },
    });

    if (!preferences) {
      preferences = await NotificationPreference.create({ userId });
    }

    return preferences;
  }

  /**
   * Check if should send notification based on preferences
   */
  shouldSendNotification(preferences, type, channel) {
    const channelMap = {
      email: "email",
      push: "push",
      in_app: "inApp",
    };

    const channelKey = channelMap[channel];

    if (!preferences.preferences[channelKey]) {
      return false;
    }

    return preferences.preferences[channelKey][type] !== false;
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId, filters = {}) {
    const where = { userId, channel: "in_app" };

    if (filters.status) {
      if (filters.status === "unread") {
        where.isRead = false;
      } else if (filters.status === "read") {
        where.isRead = true;
      }
    }

    if (filters.type && filters.type !== "all") {
      where.type = filters.type;
    }

    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const offset = (page - 1) * limit;

    const { count, rows } = await Notification.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    const unreadCount = await Notification.count({
      where: { userId, channel: "in_app", isRead: false },
    });

    return {
      notifications: rows,
      unreadCount,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId, userId) {
    const notification = await Notification.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new Error("Notification not found");
    }

    await notification.update({
      isRead: true,
      status: "read",
      readAt: new Date(),
    });

    return notification;
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId) {
    await Notification.update(
      { isRead: true, status: "read", readAt: new Date() },
      { where: { userId, isRead: false, channel: "in_app" } }
    );

    return { success: true };
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId, userId) {
    const notification = await Notification.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new Error("Notification not found");
    }

    await notification.destroy();
    return { success: true };
  }

  /**
   * Update user preferences
   */
  async updatePreferences(userId, newPreferences) {
    let preferences = await NotificationPreference.findOne({
      where: { userId },
    });

    if (!preferences) {
      preferences = await NotificationPreference.create({
        userId,
        preferences: newPreferences,
      });
    } else {
      // Merge preferences
      const merged = {
        email: { ...preferences.preferences.email, ...newPreferences.email },
        push: { ...preferences.preferences.push, ...newPreferences.push },
        inApp: { ...preferences.preferences.inApp, ...newPreferences.inApp },
      };

      await preferences.update({ preferences: merged });
    }

    return preferences;
  }

  /**
   * Update FCM token
   */
  async updateFCMToken(userId, fcmToken) {
    let preferences = await NotificationPreference.findOne({
      where: { userId },
    });

    if (!preferences) {
      preferences = await NotificationPreference.create({ userId, fcmToken });
    } else {
      await preferences.update({ fcmToken });
    }

    return preferences;
  }

  /**
   * Retry failed notifications
   */
  async retryFailedNotifications() {
    const maxRetries = parseInt(process.env.MAX_RETRY_ATTEMPTS) || 3;

    const failedNotifications = await Notification.findAll({
      where: {
        status: "failed",
        retryCount: { [Op.lt]: maxRetries },
      },
      limit: 50,
    });

    console.log(
      `Found ${failedNotifications.length} failed notifications to retry`
    );

    for (const notification of failedNotifications) {
      try {
        const preferences = await this.getUserPreferences(notification.userId);

        if (notification.channel === "email") {
          await this.sendEmailNotification(notification, notification.data);
        } else if (notification.channel === "push") {
          await this.sendPushNotificationToUser(notification, preferences);
        }
      } catch (error) {
        await notification.update({
          retryCount: notification.retryCount + 1,
          errorMessage: error.message,
        });
      }
    }
  }
}

module.exports = new NotificationService();
