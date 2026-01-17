// Backend/booking-service/src/utils/eventPublisher.js
const { getChannel } = require("../config/rabbitmq");
const { v4: uuidv4 } = require("uuid");

class EventPublisher {
  /**
   * Publish an event to RabbitMQ
   * @param {string} eventType - Event routing key (e.g., "booking.created")
   * @param {object} data - Event payload
   */
  async publishEvent(eventType, data) {
    const channel = getChannel();

    if (!channel) {
      console.error(
        "❌ RabbitMQ channel not available, event not published:",
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
          source: "booking-service",
          version: "1.0",
        },
      };

      const published = channel.publish(
        "wiz.events",
        eventType,
        Buffer.from(JSON.stringify(event)),
        { persistent: true }
      );

      if (published) {
        console.log(`✅ Event published: ${eventType} (ID: ${event.eventId})`);
        return true;
      } else {
        console.error(`❌ Failed to publish event: ${eventType}`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Error publishing event ${eventType}:`, error);
      return false;
    }
  }

  // ==================== BOOKING EVENTS ====================

  /**
   * Publish booking created event
   * @param {object} booking - Booking data from database
   * @param {object} vehicleInfo - Vehicle info from vehicle service
   * @param {object} customerInfo - Customer info from user service
   */
  async bookingCreated(booking, vehicleInfo, customerInfo) {
    await this.publishEvent("booking.created", {
      bookingId: booking.booking_id,
      customerId: booking.customer_id,
      vehicleId: booking.vehicle_id,
      customerEmail: customerInfo.email,
      customerName: customerInfo.full_name,
      vehicleName: vehicleInfo.name,
      startDate: new Date(booking.start_date).toLocaleString("en-US", {
        timeZone: "Asia/Ho_Chi_Minh",
        dateStyle: "medium",
        timeStyle: "short",
      }),
      endDate: new Date(booking.end_date).toLocaleString("en-US", {
        timeZone: "Asia/Ho_Chi_Minh",
        dateStyle: "medium",
        timeStyle: "short",
      }),
      totalAmount: booking.total_amount.toLocaleString("vi-VN"),
    });
  }

  /**
   * Publish booking accepted by owner event
   * @param {object} booking - Booking data
   * @param {object} vehicleInfo - Vehicle info
   * @param {object} customerInfo - Customer info
   */
  async bookingAcceptedByOwner(booking, vehicleInfo, customerInfo) {
    await this.publishEvent("booking.accepted_by_owner", {
      bookingId: booking.booking_id,
      customerId: booking.customer_id,
      customerEmail: customerInfo.email,
      customerName: customerInfo.full_name,
      vehicleName: vehicleInfo.name,
      startDate: new Date(booking.start_date).toLocaleString("en-US", {
        timeZone: "Asia/Ho_Chi_Minh",
        dateStyle: "medium",
        timeStyle: "short",
      }),
      endDate: new Date(booking.end_date).toLocaleString("en-US", {
        timeZone: "Asia/Ho_Chi_Minh",
        dateStyle: "medium",
        timeStyle: "short",
      }),
      totalAmount: booking.total_amount.toLocaleString("vi-VN"),
    });
  }

  /**
   * Publish booking rejected by owner event
   * @param {object} booking - Booking data
   * @param {object} vehicleInfo - Vehicle info
   * @param {object} customerInfo - Customer info
   * @param {string} reason - Rejection reason
   */
  async bookingRejectedByOwner(booking, vehicleInfo, customerInfo, reason) {
    await this.publishEvent("booking.rejected_by_owner", {
      bookingId: booking.booking_id,
      customerId: booking.customer_id,
      customerEmail: customerInfo.email,
      customerName: customerInfo.full_name,
      vehicleName: vehicleInfo.name,
      reason: reason || "No reason provided",
    });
  }

  /**
   * Publish booking completed event
   * @param {object} booking - Booking data
   * @param {object} customerInfo - Customer info
   */
  async bookingCompleted(booking, customerInfo) {
    await this.publishEvent("booking.completed", {
      bookingId: booking.booking_id,
      customerId: booking.customer_id,
      customerEmail: customerInfo.email,
      customerName: customerInfo.full_name,
    });
  }

  /**
   * Publish booking cancelled event
   * @param {object} booking - Booking data
   * @param {object} customerInfo - Customer info (optional)
   * @param {object} ownerInfo - Owner info (optional)
   */
  async bookingCancelled(booking, customerInfo, ownerInfo) {
    await this.publishEvent("booking.cancelled", {
      bookingId: booking.booking_id,
      customerEmail: customerInfo ? customerInfo.email : null,
      ownerEmail: ownerInfo ? ownerInfo.email : null,
      cancellationReason: booking.cancellation_reason || "No reason provided",
    });
  }

  /**
   * Publish contract signed event
   * @param {object} booking - Booking data
   * @param {object} vehicleInfo - Vehicle info
   * @param {object} customerInfo - Customer info
   * @param {object} ownerInfo - Owner info
   */
  async contractSigned(booking, vehicleInfo, customerInfo, ownerInfo) {
    await this.publishEvent("contract.signed", {
      bookingId: booking.booking_id,
      customerName: customerInfo.full_name,
      ownerEmail: ownerInfo.email,
      vehicleName: vehicleInfo.name,
    });
  }

  /**
   * Publish pickup confirmed event
   * @param {object} booking - Booking data
   * @param {object} vehicleInfo - Vehicle info
   * @param {object} customerInfo - Customer info
   * @param {object} ownerInfo - Owner info
   */
  async pickupConfirmed(booking, vehicleInfo, customerInfo, ownerInfo) {
    await this.publishEvent("booking.pickup_confirmed", {
      bookingId: booking.booking_id,
      customerName: customerInfo.full_name,
      ownerEmail: ownerInfo.email,
      vehicleName: vehicleInfo.name,
    });
  }
}

module.exports = new EventPublisher();
