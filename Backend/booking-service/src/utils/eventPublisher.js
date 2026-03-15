// Backend/booking-service/src/utils/eventPublisher.js
// Enhanced version with all required events

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
        eventType,
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
        { persistent: true },
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
      depositAmount: booking.deposit_amount,
      status: booking.status,
    });
  }

  /**
   * Publish booking accepted by owner event
   */
  async bookingAcceptedByOwner(booking, vehicleInfo, customerInfo) {
    await this.publishEvent("booking.accepted_by_owner", {
      bookingId: booking.booking_id,
      customerId: booking.customer_id,
      ownerId: booking.owner_id,
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
   * Publish booking rejected by owner event
   */
  async bookingRejectedByOwner(booking, vehicleInfo, customerInfo, reason) {
    await this.publishEvent("booking.rejected_by_owner", {
      bookingId: booking.booking_id,
      customerId: booking.customer_id,
      customerEmail: customerInfo.email,
      customerName: customerInfo.full_name,
      vehicleName: vehicleInfo.name,
      reason: reason || "No reason provided",
      refundAmount: booking.refund_amount || 0,
    });
  }

  // /**
  //  * Publish booking completed event
  //  */
  // async bookingCompleted(booking, customerInfo) {
  //   await this.publishEvent("booking.completed", {
  //     bookingId: booking.booking_id,
  //     customerId: booking.customer_id,
  //     vehicleId: booking.vehicle_id,
  //     customerEmail: customerInfo.email,
  //     customerName: customerInfo.full_name,
  //     totalAmount: booking.total_amount,
  //     completedAt: new Date().toISOString(),
  //   });
  // }

  /**
   * Publish booking completed event
   */
  async bookingCompleted(booking, vehicleInfo, customerInfo) {
    await this.publishEvent("booking.completed", {
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
      depositAmount: booking.deposit_amount.toLocaleString("vi-VN"),

      status: booking.status,

      completedAt: booking.return_confirmed_at
        ? new Date(booking.return_confirmed_at).toLocaleString("en-US", {
            timeZone: "Asia/Ho_Chi_Minh",
            dateStyle: "medium",
            timeStyle: "short",
          })
        : null,
    });
  }

  /**
   * Publish booking cancelled event
   */
  async bookingCancelled(booking, customerInfo, ownerInfo) {
    await this.publishEvent("booking.cancelled", {
      bookingId: booking.booking_id,
      customerId: booking.customer_id,
      vehicleId: booking.vehicle_id,
      customerEmail: customerInfo ? customerInfo.email : null,
      ownerEmail: ownerInfo ? ownerInfo.email : null,
      cancellationReason: booking.cancellation_reason || "No reason provided",
      refundAmount: booking.refund_amount || 0,
      cancelledAt: booking.cancellation_date || new Date(),
    });
  }

  /**
   * Publish contract signed event
   */
  async contractSigned(booking, vehicleInfo, customerInfo, ownerInfo) {
    await this.publishEvent("contract.signed", {
      bookingId: booking.booking_id,
      customerId: booking.customer_id,
      customerName: customerInfo.full_name,
      ownerEmail: ownerInfo.email,
      vehicleName: vehicleInfo.name,
      signedContractUrl: booking.signed_contract_url,
      signedAt: booking.contract_signed_at,
    });
  }

  /**
   * Publish pickup confirmed event
   */
  async pickupConfirmed(booking, vehicleInfo, customerInfo, ownerInfo) {
    await this.publishEvent("booking.pickup_confirmed", {
      bookingId: booking.booking_id,
      customerId: booking.customer_id,
      vehicleId: booking.vehicle_id,
      customerName: customerInfo.full_name,
      ownerEmail: ownerInfo.email,
      vehicleName: vehicleInfo.name,
      pickupAt: booking.pickup_confirmed_at,
      odometerReading: booking.pickup_odometer_reading,
    });
  }

  // ==================== NEW EVENTS (PREVIOUSLY MISSING) ====================

  /**
   * Publish deposit paid event
   * This is emitted from booking service when deposit payment is confirmed
   */
  async depositPaid(booking, customerInfo, transactionId) {
    await this.publishEvent("booking.deposit_paid", {
      bookingId: booking.booking_id,
      customerId: booking.customer_id,
      vehicleId: booking.vehicle_id,
      customerEmail: customerInfo.email,
      depositAmount: booking.deposit_amount,
      transactionId: transactionId,
      newStatus: "pending", // Status after deposit
      paidAt: new Date().toISOString(),
    });
  }

  /**
   * Publish final payment paid event
   */
  async finalPaymentPaid(booking, customerInfo, transactionId) {
    await this.publishEvent("booking.final_payment_paid", {
      bookingId: booking.booking_id,
      customerId: booking.customer_id,
      vehicleId: booking.vehicle_id,
      customerEmail: customerInfo.email,
      finalPaymentAmount: booking.remaining_payment,
      transactionId: transactionId,
      paidAt: new Date().toISOString(),
    });
  }

  /**
   * Publish generic booking status changed event
   * Useful for other services to track booking lifecycle
   */
  async bookingStatusChanged(booking, oldStatus, newStatus, reason = null) {
    await this.publishEvent("booking.status_changed", {
      bookingId: booking.booking_id,
      customerId: booking.customer_id,
      vehicleId: booking.vehicle_id,
      oldStatus: oldStatus,
      newStatus: newStatus,
      reason: reason,
      changedAt: new Date().toISOString(),
    });
  }

  /**
   * Publish return submitted event (customer submitted return)
   */
  async returnSubmitted(booking, customerInfo) {
    await this.publishEvent("booking.return_submitted", {
      bookingId: booking.booking_id,
      customerId: booking.customer_id,
      vehicleId: booking.vehicle_id,
      customerEmail: customerInfo.email,
      returnOdometerReading: booking.return_odometer_reading,
      submittedAt: booking.return_confirmed_at,
    });
  }

  /**
   * Publish dispute opened event
   */
  async disputeOpened(booking, ownerInfo, customerInfo) {
    await this.publishEvent("booking.dispute_opened", {
      bookingId: booking.booking_id,
      customerId: booking.customer_id,
      vehicleId: booking.vehicle_id,
      ownerEmail: ownerInfo.email,
      customerEmail: customerInfo.email,
      disputeReason: booking.dispute_reason,
      damagesReported: booking.damages_reported,
      openedAt: booking.dispute_opened_at,
    });
  }

  /**
   * Publish payment expiry event (for auto-cancelled bookings)
   */
  async paymentExpired(booking, customerInfo) {
    await this.publishEvent("booking.payment_expired", {
      bookingId: booking.booking_id,
      customerId: booking.customer_id,
      customerEmail: customerInfo.email,
      expiredAt: booking.payment_expiry,
      cancelledAt: new Date().toISOString(),
    });
  }

  /**
   * Publish no-show event
   */
  async noShow(booking, customerInfo) {
    await this.publishEvent("booking.no_show", {
      bookingId: booking.booking_id,
      customerId: booking.customer_id,
      vehicleId: booking.vehicle_id,
      customerEmail: customerInfo.email,
      startDate: booking.start_date,
      noShowCheckedAt: booking.no_show_checked_at,
    });
  }
}

module.exports = new EventPublisher();
