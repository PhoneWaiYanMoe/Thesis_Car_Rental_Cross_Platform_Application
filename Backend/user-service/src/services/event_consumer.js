// Backend/user-service/src/services/event_consumer.js
const { getChannel } = require("../config/rabbitmq");
const pool = require("../config/database");

class EventConsumer {
  constructor() {
    this.queue = "user-service-events";
    this.exchange = "wiz.events";
  }

  /**
   * Start consuming events from RabbitMQ
   */
  async startConsuming() {
    const channel = getChannel();

    if (!channel) {
      console.warn("⚠️ RabbitMQ channel not available for event consumption");
      return;
    }

    try {
      // Assert queue
      await channel.assertQueue(this.queue, { durable: true });

      // Bind to all relevant routing keys
      const routingKeys = [
        "request.user_license_verification_approved",
        "request.user_license_verification_denied",
        "request.owner_verification_approved",
        "request.owner_verification_denied",
        "request.user_account_deletion_approved",
        "booking.created",
        "booking.completed",
        "booking.cancelled",
        "payment.deposit_completed",
        "payment.final_completed",
        "review.created",
      ];

      for (const routingKey of routingKeys) {
        await channel.bindQueue(this.queue, this.exchange, routingKey);
      }

      console.log(`✅ Event consumer bound to ${routingKeys.length} events`);

      // Start consuming
      channel.consume(
        this.queue,
        async (msg) => {
          if (!msg) return;

          try {
            const event = JSON.parse(msg.content.toString());
            console.log(`📥 Received event: ${event.eventType}`);

            await this.handleEvent(event);

            // Acknowledge message
            channel.ack(msg);
          } catch (error) {
            console.error("❌ Error processing event:", error);
            // Reject and requeue on error
            channel.nack(msg, false, true);
          }
        },
        { noAck: false },
      );

      console.log("✅ User service event consumer started");
    } catch (error) {
      console.error("❌ Failed to start event consumer:", error);
    }
  }

  /**
   * Route events to appropriate handlers
   */
  async handleEvent(event) {
    const { eventType, data } = event;

    switch (eventType) {
      case "request.user_license_verification_approved":
        await this.handleLicenseVerificationApproved(data);
        break;

      case "request.user_license_verification_denied":
        await this.handleLicenseVerificationDenied(data);
        break;

      case "request.owner_verification_approved":
        await this.handleOwnerVerificationApproved(data);
        break;

      case "request.owner_verification_denied":
        await this.handleOwnerVerificationDenied(data);
        break;

      case "request.user_account_deletion_approved":
        await this.handleAccountDeletionApproved(data);
        break;

      case "booking.created":
        await this.handleBookingCreated(data);
        break;

      case "booking.completed":
        await this.handleBookingCompleted(data);
        break;

      case "booking.cancelled":
        await this.handleBookingCancelled(data);
        break;

      case "payment.deposit_completed":
      case "payment.final_completed":
        await this.handlePaymentCompleted(data);
        break;

      case "review.created":
        await this.handleReviewCreated(data);
        break;

      default:
        console.log(`ℹ️ Unhandled event type: ${eventType}`);
    }
  }

  // ==================== LICENSE VERIFICATION ====================

  async handleLicenseVerificationApproved(data) {
    const { userId } = data;

    await pool.query(
      `UPDATE users 
       SET license_status = 'verified', updated_at = NOW() 
       WHERE user_id = $1`,
      [userId],
    );

    console.log(`✅ License verified for user: ${userId}`);
  }

  async handleLicenseVerificationDenied(data) {
    const { userId } = data;

    await pool.query(
      `UPDATE users 
       SET license_status = 'rejected', updated_at = NOW() 
       WHERE user_id = $1`,
      [userId],
    );

    console.log(`❌ License rejected for user: ${userId}`);
  }

  // ==================== OWNER VERIFICATION ====================

  async handleOwnerVerificationApproved(data) {
    const { userId } = data;

    await pool.query(
      `UPDATE users 
       SET owner_status = 'verified', updated_at = NOW() 
       WHERE user_id = $1 AND role = 'owner'`,
      [userId],
    );

    console.log(`✅ Owner verified: ${userId}`);
  }

  async handleOwnerVerificationDenied(data) {
    const { userId } = data;

    await pool.query(
      `UPDATE users 
       SET owner_status = 'rejected', updated_at = NOW() 
       WHERE user_id = $1 AND role = 'owner'`,
      [userId],
    );

    console.log(`❌ Owner verification rejected: ${userId}`);
  }

  // ==================== ACCOUNT DELETION ====================

  async handleAccountDeletionApproved(data) {
    const { userId } = data;

    // Anonymize user data but keep user_id for referential integrity
    await pool.query(
      `UPDATE users 
       SET 
         status = 'deleted',
         email = CONCAT('deleted_', user_id, '@deleted.local'),
         password_hash = NULL,
         full_name = 'Deleted User',
         phone = NULL,
         avatar_url = NULL,
         license_url = NULL,
         is_verified = FALSE,
         updated_at = NOW()
       WHERE user_id = $1`,
      [userId],
    );

    console.log(`🗑️ Account deleted: ${userId}`);
  }

  // ==================== BOOKING STATISTICS ====================

  async handleBookingCreated(data) {
    const { customerId, ownerId } = data;

    // Increment customer booking count
    await pool.query(
      `INSERT INTO user_statistics (user_id, total_bookings_as_customer, active_bookings_as_customer)
       VALUES ($1, 1, 1)
       ON CONFLICT (user_id) 
       DO UPDATE SET 
         total_bookings_as_customer = user_statistics.total_bookings_as_customer + 1,
         active_bookings_as_customer = user_statistics.active_bookings_as_customer + 1,
         last_booking_date = NOW(),
         updated_at = NOW()`,
      [customerId],
    );

    // Increment owner rental count
    if (ownerId) {
      await pool.query(
        `INSERT INTO user_statistics (user_id, total_rentals_as_owner, active_rentals_as_owner)
         VALUES ($1, 1, 1)
         ON CONFLICT (user_id) 
         DO UPDATE SET 
           total_rentals_as_owner = user_statistics.total_rentals_as_owner + 1,
           active_rentals_as_owner = user_statistics.active_rentals_as_owner + 1,
           last_rental_date = NOW(),
           updated_at = NOW()`,
        [ownerId],
      );
    }

    console.log(`📊 Booking statistics updated for customer: ${customerId}`);
  }

  async handleBookingCompleted(data) {
    const { customerId, ownerId } = data;

    // Update customer statistics
    await pool.query(
      `UPDATE user_statistics 
       SET 
         completed_bookings_as_customer = completed_bookings_as_customer + 1,
         active_bookings_as_customer = GREATEST(active_bookings_as_customer - 1, 0),
         updated_at = NOW()
       WHERE user_id = $1`,
      [customerId],
    );

    // Update owner statistics
    if (ownerId) {
      await pool.query(
        `UPDATE user_statistics 
         SET 
           completed_rentals_as_owner = completed_rentals_as_owner + 1,
           active_rentals_as_owner = GREATEST(active_rentals_as_owner - 1, 0),
           updated_at = NOW()
         WHERE user_id = $1`,
        [ownerId],
      );
    }

    console.log(`📊 Booking completed statistics updated`);
  }

  async handleBookingCancelled(data) {
    const { customerId, ownerId } = data;

    // Update customer statistics
    await pool.query(
      `UPDATE user_statistics 
       SET 
         cancelled_bookings_as_customer = cancelled_bookings_as_customer + 1,
         active_bookings_as_customer = GREATEST(active_bookings_as_customer - 1, 0),
         updated_at = NOW()
       WHERE user_id = $1`,
      [customerId],
    );

    // Update owner statistics
    if (ownerId) {
      await pool.query(
        `UPDATE user_statistics 
         SET 
           cancelled_rentals_as_owner = cancelled_rentals_as_owner + 1,
           active_rentals_as_owner = GREATEST(active_rentals_as_owner - 1, 0),
           updated_at = NOW()
         WHERE user_id = $1`,
        [ownerId],
      );
    }

    console.log(`📊 Booking cancelled statistics updated`);
  }

  // ==================== PAYMENT STATISTICS ====================

  async handlePaymentCompleted(data) {
    const { customerId, ownerId, amount } = data;

    if (customerId && amount) {
      await pool.query(
        `UPDATE user_statistics 
         SET 
           total_spent = total_spent + $2,
           updated_at = NOW()
         WHERE user_id = $1`,
        [customerId, amount],
      );
    }

    if (ownerId && amount) {
      await pool.query(
        `UPDATE user_statistics 
         SET 
           total_earned = total_earned + $2,
           updated_at = NOW()
         WHERE user_id = $1`,
        [ownerId, amount],
      );
    }

    console.log(`💰 Payment statistics updated`);
  }

  // ==================== REVIEW STATISTICS ====================

  async handleReviewCreated(data) {
    const { reviewerId, revieweeId, rating, reviewType } = data;

    if (reviewType === "customer") {
      // Customer was reviewed
      await pool.query(
        `UPDATE user_statistics 
         SET 
           total_reviews_as_customer = total_reviews_as_customer + 1,
           average_rating_as_customer = (
             (average_rating_as_customer * (total_reviews_as_customer - 1) + $2) / total_reviews_as_customer
           ),
           updated_at = NOW()
         WHERE user_id = $1`,
        [revieweeId, rating],
      );
    } else if (reviewType === "owner") {
      // Owner was reviewed
      await pool.query(
        `UPDATE user_statistics 
         SET 
           total_reviews_as_owner = total_reviews_as_owner + 1,
           average_rating_as_owner = (
             (average_rating_as_owner * (total_reviews_as_owner - 1) + $2) / total_reviews_as_owner
           ),
           updated_at = NOW()
         WHERE user_id = $1`,
        [revieweeId, rating],
      );
    }

    console.log(`⭐ Review statistics updated for user: ${revieweeId}`);
  }
}

module.exports = new EventConsumer();
