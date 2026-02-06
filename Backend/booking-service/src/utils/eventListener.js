// Backend/booking-service/src/utils/eventListener.js
// Listen for events from other services and update booking state accordingly

const { getChannel } = require("../config/rabbitmq");
const pool = require("../config/database");

class EventListener {
  constructor() {
    this.handlers = new Map();
    this.setupHandlers();
  }

  /**
   * Setup event handlers for different event types
   */
  setupHandlers() {
    // Payment events
    this.handlers.set(
      "payment.deposit_completed",
      this.handleDepositCompleted.bind(this),
    );
    this.handlers.set(
      "payment.final_completed",
      this.handleFinalPaymentCompleted.bind(this),
    );
    this.handlers.set(
      "payment.refund_completed",
      this.handleRefundCompleted.bind(this),
    );

    // Review events
    this.handlers.set("review.created", this.handleReviewCreated.bind(this));

    // Vehicle events
    this.handlers.set(
      "vehicle.status_changed",
      this.handleVehicleStatusChanged.bind(this),
    );
    this.handlers.set(
      "vehicle.deactivation_approved",
      this.handleVehicleDeactivated.bind(this),
    );

    // User events (optional - if needed)
    this.handlers.set(
      "user.license_uploaded",
      this.handleLicenseUploaded.bind(this),
    );
  }

  /**
   * Start listening to events
   */
  async startListening() {
    const channel = getChannel();

    if (!channel) {
      console.error(
        "❌ RabbitMQ channel not available, cannot start event listener",
      );
      return;
    }

    try {
      const queueName = "booking-service-events";

      // Assert queue
      await channel.assertQueue(queueName, { durable: true });

      // Bind to events we care about
      const eventsToListen = Array.from(this.handlers.keys());

      for (const eventType of eventsToListen) {
        await channel.bindQueue(queueName, "wiz.events", eventType);
        console.log(`✅ Listening for event: ${eventType}`);
      }

      // Start consuming
      channel.consume(
        queueName,
        async (msg) => {
          if (msg) {
            try {
              const event = JSON.parse(msg.content.toString());
              await this.handleEvent(event);
              channel.ack(msg);
            } catch (error) {
              console.error("❌ Error processing event:", error);
              channel.nack(msg, false, false); // Don't requeue
            }
          }
        },
        { noAck: false },
      );

      console.log(`✅ Event listener started on queue: ${queueName}`);
    } catch (error) {
      console.error("❌ Failed to start event listener:", error);
    }
  }

  /**
   * Route event to appropriate handler
   */
  async handleEvent(event) {
    const { eventType, data, eventId } = event;

    console.log(`📨 Received event: ${eventType} (ID: ${eventId})`);

    const handler = this.handlers.get(eventType);

    if (handler) {
      try {
        await handler(data);
        console.log(`✅ Event handled: ${eventType}`);
      } catch (error) {
        console.error(`❌ Error handling event ${eventType}:`, error);
        throw error;
      }
    } else {
      console.log(`⚠️  No handler for event: ${eventType}`);
    }
  }

  // ==================== EVENT HANDLERS ====================

  /**
   * Handle payment.deposit_completed
   * Update booking status from pending_payment to pending
   */
  async handleDepositCompleted(data) {
    const { bookingId, transactionId, amount } = data;

    console.log(`💰 Processing deposit completion for booking: ${bookingId}`);

    const result = await pool.query(
      `UPDATE bookings
       SET deposit_paid = true,
           deposit_transaction_id = $1,
           status = CASE 
             WHEN status = 'pending_payment' THEN 'pending'
             ELSE status
           END,
           updated_at = NOW()
       WHERE booking_id = $2
       AND deposit_paid = false
       RETURNING booking_id, status`,
      [transactionId, bookingId],
    );

    if (result.rows.length > 0) {
      console.log(
        `✅ Booking ${bookingId} updated: deposit paid, status → ${result.rows[0].status}`,
      );
    } else {
      console.warn(
        `⚠️  Booking ${bookingId} not found or deposit already paid`,
      );
    }
  }

  /**
   * Handle payment.final_completed
   * Mark final payment as completed
   */
  async handleFinalPaymentCompleted(data) {
    const { bookingId, transactionId, amount } = data;

    console.log(
      `💰 Processing final payment completion for booking: ${bookingId}`,
    );

    const result = await pool.query(
      `UPDATE bookings
       SET final_payment_paid = true,
           final_payment_transaction_id = $1,
           remaining_payment = 0,
           updated_at = NOW()
       WHERE booking_id = $2
       AND final_payment_paid = false
       RETURNING booking_id, status`,
      [transactionId, bookingId],
    );

    if (result.rows.length > 0) {
      console.log(`✅ Booking ${bookingId} updated: final payment completed`);
    } else {
      console.warn(
        `⚠️  Booking ${bookingId} not found or final payment already completed`,
      );
    }
  }

  /**
   * Handle payment.refund_completed
   * Update refund status
   */
  async handleRefundCompleted(data) {
    const { bookingId, refundId, amount } = data;

    console.log(`💸 Processing refund completion for booking: ${bookingId}`);

    await pool.query(
      `UPDATE bookings
       SET refund_status = 'completed',
           updated_at = NOW()
       WHERE booking_id = $1`,
      [bookingId],
    );

    console.log(`✅ Booking ${bookingId} refund marked as completed`);
  }

  /**
   * Handle review.created
   * Mark booking as reviewed
   */
  async handleReviewCreated(data) {
    const { bookingId, reviewType } = data; // reviewType: 'vehicle' or 'owner'

    console.log(`⭐ Processing review creation for booking: ${bookingId}`);

    const field =
      reviewType === "vehicle" ? "vehicle_reviewed" : "owner_reviewed";

    await pool.query(
      `UPDATE bookings
       SET ${field} = true,
           updated_at = NOW()
       WHERE booking_id = $1`,
      [bookingId],
    );

    console.log(`✅ Booking ${bookingId} marked as reviewed (${reviewType})`);
  }

  /**
   * Handle vehicle.status_changed
   * Cancel future bookings if vehicle is deactivated
   */
  async handleVehicleStatusChanged(data) {
    const { vehicleId, newStatus, oldStatus } = data;

    console.log(
      `🚗 Vehicle ${vehicleId} status changed: ${oldStatus} → ${newStatus}`,
    );

    // If vehicle is deactivated, cancel all pending/future bookings
    if (newStatus === "inactive" || newStatus === "suspended") {
      const now = new Date();

      const result = await pool.query(
        `UPDATE bookings
         SET status = 'cancelled',
             cancellation_reason = 'Vehicle deactivated by owner',
             cancellation_date = NOW(),
             refund_amount = deposit_amount + CASE WHEN final_payment_paid THEN remaining_payment ELSE 0 END,
             refund_status = 'processing',
             updated_at = NOW()
         WHERE vehicle_id = $1
         AND status IN ('pending_payment', 'pending', 'booking')
         AND start_date > $2
         RETURNING booking_id, customer_id`,
        [vehicleId, now],
      );

      if (result.rows.length > 0) {
        console.log(
          `✅ Cancelled ${result.rows.length} future bookings for vehicle ${vehicleId}`,
        );

        // TODO: Emit events to notify customers and process refunds
      } else {
        console.log(
          `ℹ️  No future bookings to cancel for vehicle ${vehicleId}`,
        );
      }
    }
  }

  /**
   * Handle vehicle.deactivation_approved
   * Same as status change to inactive
   */
  async handleVehicleDeactivated(data) {
    await this.handleVehicleStatusChanged({
      vehicleId: data.vehicleId,
      newStatus: "inactive",
      oldStatus: "active",
    });
  }

  /**
   * Handle user.license_uploaded
   * Optional - can be used to notify about verification status
   */
  async handleLicenseUploaded(data) {
    const { userId } = data;
    console.log(
      `📝 User ${userId} uploaded license - no action needed in booking service`,
    );
    // Booking service doesn't need to do anything special
    // Verification is handled by GET /verification/me endpoint
  }
}

// Create singleton instance
const eventListener = new EventListener();

module.exports = eventListener;
