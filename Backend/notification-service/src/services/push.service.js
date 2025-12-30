const { getMessaging, isFirebaseEnabled } = require("../config/firebase");

class PushService {
  /**
   * Send push notification to multiple devices with invalid token handling
   * @param {Array} devices - Array of devices [{id, fcmToken, platform}]
   * @param {string} title - Notification title
   * @param {string} body - Notification body
   * @param {object} data - Additional data payload
   * @returns {Promise}
   */
  async sendMulticastNotification(devices, title, body, data = {}) {
    if (!isFirebaseEnabled()) {
      console.log("Multicast notification skipped (Firebase not configured)");
      return {
        success: false,
        message: "Firebase not configured",
        invalidDevices: [],
      };
    }

    if (!devices || devices.length === 0) {
      console.log("No devices to send notification to");
      return {
        success: true,
        successCount: 0,
        failureCount: 0,
        invalidDevices: [],
      };
    }

    try {
      const fcmTokens = devices.map((d) => d.fcmToken);

      const message = {
        notification: {
          title: title,
          body: body,
        },
        data: {
          ...data,
          clickAction: "FLUTTER_NOTIFICATION_CLICK",
        },
        tokens: fcmTokens,
      };

      const response = await getMessaging().sendMulticast(message);

      console.log(
        `Multicast sent - Success: ${response.successCount}, Failure: ${response.failureCount}`
      );

      // detect invalid tokens
      const invalidDevices = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const errorCode = resp.error?.code;

          // check for invalid/unregistered tokens
          if (
            errorCode === "messaging/invalid-registration-token" ||
            errorCode === "messaging/registration-token-not-registered"
          ) {
            invalidDevices.push(devices[idx].id);
            console.log(
              `Invalid token detected for device: ${devices[idx].id}`
            );
          }
        }
      });

      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount,
        invalidDevices: invalidDevices, // return invalid device IDs
        responses: response.responses,
      };
    } catch (error) {
      console.error("Multicast notification failed:", error);
      throw error;
    }
  }
}

module.exports = new PushService();
