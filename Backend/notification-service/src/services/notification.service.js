const emailService = require("./email.service");
const pushService = require("./push.service");

class NotificationService {
  /**
   * Send notification through multiple channels
   * @param {string} type - Notification type
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {object} data - Additional data
   * @param {string[]} channels - Channels to send (email, push)
   */
  async sendNotification(type, title, message, data = {}, channels = ["push"]) {
    const results = [];

    for (const channel of channels) {
      try {
        if (channel === "email") {
          await this.sendEmailNotification(type, title, message, data);
          results.push({ channel: "email", success: true });
        } else if (channel === "push") {
          await this.sendPushNotification(title, message, data);
          results.push({ channel: "push", success: true });
        }
      } catch (error) {
        console.error(`${channel} notification failed:`, error.message);
        results.push({ channel, success: false, error: error.message });
      }
    }

    return results;
  }

  // send email notifications
  async sendEmailNotification(type, title, message, data) {
    const userEmail = data.email;

    if (!userEmail) {
      throw new Error("User email not provided");
    }

    // choose appropriate email template based on type
    switch (type) {
      case "booking":
        if (data.bookingData) {
          await emailService.sendBookingConfirmation(
            userEmail,
            data.bookingData
          );
        }
        break;
      case "payment":
        if (data.paymentData) {
          await emailService.sendPaymentReceipt(userEmail, data.paymentData);
        }
        break;
      default:
        await emailService.sendNotificationEmail(
          userEmail,
          title,
          message,
          data.actionUrl
        );
    }
  }

  // send push notifications
  async sendPushNotification(title, message, data) {
    const fcmToken = data.fcmToken;

    if (!fcmToken) {
      throw new Error("FCM token not provided");
    }

    await pushService.sendPushNotification(fcmToken, title, message, data);
  }
}

module.exports = new NotificationService();
