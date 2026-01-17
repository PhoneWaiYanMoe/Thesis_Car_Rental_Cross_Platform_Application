// Backend/user-service/src/services/event_publisher.js
const { getChannel } = require("../config/rabbitmq");
const { v4: uuidv4 } = require("uuid");

class EventPublisher {
  /**
   * Publish event to RabbitMQ
   * @param {string} eventType - Event type (e.g., 'user.registered')
   * @param {object} data - Event data
   * @param {object} metadata - Optional metadata
   */
  async publishEvent(eventType, data, metadata = {}) {
    const channel = getChannel();

    if (!channel) {
      console.warn(
        "⚠️ RabbitMQ channel not available, event not published:",
        eventType
      );
      return false;
    }

    try {
      const event = {
        eventId: uuidv4(),
        eventType: eventType,
        timestamp: new Date().toISOString(),
        data: data,
        metadata: {
          source: "user-service",
          version: "1.0",
          ...metadata,
        },
      };

      const exchange = "wiz.events";

      channel.publish(exchange, eventType, Buffer.from(JSON.stringify(event)), {
        persistent: true,
      });

      console.log(`📤 Event published: ${eventType}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to publish event ${eventType}:`, error.message);
      return false;
    }
  }

  // ==================== USER EVENTS ====================

  /**
   * Publish user registered event (sends OTP email)
   */
  async publishUserRegistered(email, otp, userId) {
    return this.publishEvent("user.registered", {
      userId: userId,
      email: email,
      otp: otp,
    });
  }

  /**
   * Publish password reset requested event (sends OTP email)
   */
  async publishPasswordResetRequested(email, otp) {
    return this.publishEvent("user.password_reset_requested", {
      email: email,
      otp: otp,
    });
  }

  /**
   * Publish password changed event (sends confirmation email)
   */
  async publishPasswordChanged(email) {
    return this.publishEvent("user.password_changed", {
      email: email,
    });
  }

  /**
   * Publish license uploaded event
   */
  async publishLicenseUploaded(email, userId) {
    return this.publishEvent("user.license_uploaded", {
      email: email,
      userId: userId,
    });
  }

  /**
   * Publish user status changed event
   */
  async publishUserStatusChanged(email, userId, newStatus, oldStatus) {
    return this.publishEvent("user.status_changed", {
      email: email,
      userId: userId,
      newStatus: newStatus,
      oldStatus: oldStatus,
    });
  }
}

module.exports = new EventPublisher();
