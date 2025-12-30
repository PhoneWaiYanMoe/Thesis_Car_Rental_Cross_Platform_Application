const emailService = require("./email.service");
const pushService = require("./push.service");
const userServiceClient = require("./userService.client");

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

  // send email notification
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

  // send push notification to user's devices
  async sendPushNotification(title, message, data) {
    const userId = data.userId;

    if (!userId) {
      console.log("Push notification skipped: userId not provided");
      return;
    }

    // get user's devices from user-service
    const devices = await userServiceClient.getUserDevices(userId);

    if (!devices || devices.length === 0) {
      console.log(`No devices found for user ${userId}`);
      return;
    }

    console.log(
      `Sending push to ${devices.length} device(s) for user ${userId}`
    );

    // send to all devices
    const result = await pushService.sendMulticastNotification(
      devices,
      title,
      message,
      data
    );

    // handle invalid tokens
    if (result.invalidDevices && result.invalidDevices.length > 0) {
      console.log(
        `Cleaning up ${result.invalidDevices.length} invalid device(s)`
      );

      for (const deviceId of result.invalidDevices) {
        await userServiceClient.deleteDevice(deviceId);
      }
    }
  }
}

module.exports = new NotificationService();
