const { getMessaging, isFirebaseEnabled } = require("../config/firebase");

class PushService {
  /**
   * Send push notification to device
   * @param {string} fcmToken - Firebase Cloud Messaging token
   * @param {string} title - Notification title
   * @param {string} body - Notification body
   * @param {object} data - Additional data payload
   * @returns {Promise}
   */
  async sendPushNotification(fcmToken, title, body, data = {}) {
    if (!isFirebaseEnabled()) {
      console.log("Push notification skipped (Firebase not configured)");
      return { success: false, message: "Firebase not configured" };
    }

    try {
      const message = {
        notification: {
          title: title,
          body: body,
        },
        data: {
          ...data,
          clickAction: "FLUTTER_NOTIFICATION_CLICK",
        },
        token: fcmToken,
      };

      const response = await getMessaging().send(message);

      console.log(`Push notification sent: ${response}`);

      return {
        success: true,
        messageId: response,
      };
    } catch (error) {
      console.error("Push notification failed:", error);
      throw error;
    }
  }

  /**
   * Send push notification to multiple devices
   * @param {string[]} fcmTokens - Array of FCM tokens
   * @param {string} title - Notification title
   * @param {string} body - Notification body
   * @param {object} data - Additional data payload
   * @returns {Promise}
   */
  async sendMulticastNotification(fcmTokens, title, body, data = {}) {
    if (!isFirebaseEnabled()) {
      console.log("Multicast notification skipped (Firebase not configured)");
      return { success: false, message: "Firebase not configured" };
    }

    try {
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

      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount,
        responses: response.responses,
      };
    } catch (error) {
      console.error("Multicast notification failed:", error);
      throw error;
    }
  }

  /**
   * Send booking notification
   */
  async sendBookingNotification(fcmToken, bookingData) {
    const title = "🎉 Booking Confirmed";
    const body = `Your booking for ${bookingData.vehicleName} has been confirmed!`;

    return await this.sendPushNotification(fcmToken, title, body, {
      type: "booking",
      bookingId: bookingData.bookingId,
      screen: "BookingDetails",
    });
  }

  /**
   * Send payment notification
   */
  async sendPaymentNotification(fcmToken, paymentData) {
    const title = "Payment Successful";
    const body = `Payment of ${paymentData.amount} VND received`;

    return await this.sendPushNotification(fcmToken, title, body, {
      type: "payment",
      transactionId: paymentData.transactionId,
      screen: "PaymentReceipt",
    });
  }

  /**
   * Send review notification
   */
  async sendReviewNotification(fcmToken, reviewData) {
    const title = "New Review";
    const body = `You received a ${reviewData.rating}-star review`;

    return await this.sendPushNotification(fcmToken, title, body, {
      type: "review",
      reviewId: reviewData.reviewId,
      screen: "Reviews",
    });
  }
}

module.exports = new PushService();
