// Backend/payment-service/src/controllers/webhook_controller.js
// ✅ UPDATED: Integrated automatic booking status updates after payment

const pool = require("../config/database");
const bookingGrpcClient = require("../grpc/booking_grpc_client");
const paymentService = require("../services/payment_service");

class WebhookController {
  // ==================== STRIPE WEBHOOK ====================

  async handleStripeWebhook(req, res, next) {
    try {
      const event = req.webhookEvent; // Set by verification middleware

      console.log(`📨 Stripe webhook: ${event.type}`);

      // Check for duplicate events
      const existingEvent = await pool.query(
        "SELECT event_id FROM webhook_events WHERE event_id = $1",
        [event.id]
      );

      if (existingEvent.rows.length > 0) {
        console.log(`⚠️  Duplicate Stripe event: ${event.id}`);
        return res.json({ received: true });
      }

      // Store event
      await pool.query(
        `INSERT INTO webhook_events (event_id, provider, type, payload, processed)
         VALUES ($1, $2, $3, $4, $5)`,
        [event.id, "stripe", event.type, JSON.stringify(event.data), false]
      );

      // Handle different event types
      switch (event.type) {
        case "payment_intent.succeeded":
          await this.handlePaymentSuccess(event.data.object, "stripe");
          break;

        case "payment_intent.payment_failed":
          await this.handlePaymentFailed(event.data.object);
          break;

        case "charge.refunded":
          await this.handleRefundCompleted(event.data.object);
          break;
      }

      // Mark as processed
      await pool.query(
        "UPDATE webhook_events SET processed = true, processed_at = NOW() WHERE event_id = $1",
        [event.id]
      );

      res.json({ received: true });
    } catch (error) {
      console.error("❌ Stripe webhook error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  }

  // ==================== PAYPAL WEBHOOK ====================

  async handlePayPalWebhook(req, res, next) {
    console.log("📨 PayPal webhook received");
    // PayPal webhook implementation
    res.json({ received: true });
  }

  // ==================== VNPAY RETURN ====================

  async handleVNPayReturn(req, res, next) {
    try {
      const result = req.webhookEvent; // Set by verification middleware

      if (!result.valid) {
        console.log("❌ VNPay invalid signature");
        return res.redirect(`${process.env.FRONTEND_URL}/payment/failed`);
      }

      if (result.success) {
        // Find transaction by orderId (which is the intent_id in VNPay)
        const txResult = await pool.query(
          `SELECT transaction_id, booking_id, type 
           FROM transactions 
           WHERE intent_id = $1`,
          [result.orderId]
        );

        if (txResult.rows.length === 0) {
          console.error(
            "❌ Transaction not found for VNPay order:",
            result.orderId
          );
          return res.redirect(`${process.env.FRONTEND_URL}/payment/failed`);
        }

        const transaction = txResult.rows[0];

        // Update transaction status
        await pool.query(
          `UPDATE transactions
           SET status = 'succeeded',
               provider_transaction_id = $1,
               completed_at = NOW(),
               updated_at = NOW()
           WHERE transaction_id = $2`,
          [result.transactionNo, transaction.transaction_id]
        );

        console.log(`✅ VNPay payment success: ${result.orderId}`);

        // ✅ TRIGGER BOOKING STATUS UPDATE
        await this.updateBookingAfterPayment(
          transaction.booking_id,
          transaction.transaction_id,
          transaction.type
        );

        res.redirect(
          `${process.env.FRONTEND_URL}/payment/success?bookingId=${transaction.booking_id}`
        );
      } else {
        console.log("❌ VNPay payment failed:", result.responseCode);
        res.redirect(`${process.env.FRONTEND_URL}/payment/failed`);
      }
    } catch (error) {
      console.error("❌ VNPay return error:", error);
      res.redirect(`${process.env.FRONTEND_URL}/payment/failed`);
    }
  }

  // ==================== PAYMENT SUCCESS HANDLER ====================

  async handlePaymentSuccess(paymentIntent, provider = "stripe") {
    try {
      const { id, metadata } = paymentIntent;
      const { bookingId, type } = metadata;

      console.log(`💳 Processing payment success: ${bookingId} (${type})`);

      // Update transaction status
      await pool.query(
        `UPDATE transactions
         SET status = 'succeeded',
             provider_transaction_id = $1,
             completed_at = NOW(),
             updated_at = NOW()
         WHERE booking_id = $2 AND type = $3 AND status = 'pending'`,
        [id, bookingId, type]
      );

      // ✅ TRIGGER BOOKING STATUS UPDATE VIA GRPC
      const txResult = await pool.query(
        `SELECT transaction_id FROM transactions 
         WHERE booking_id = $1 AND type = $2 AND status = 'succeeded'
         ORDER BY completed_at DESC LIMIT 1`,
        [bookingId, type]
      );

      if (txResult.rows.length > 0) {
        const transactionId = txResult.rows[0].transaction_id;
        await this.updateBookingAfterPayment(bookingId, transactionId, type);
      }

      console.log(`✅ Payment success handled: ${bookingId} (${type})`);
    } catch (error) {
      console.error("❌ handlePaymentSuccess error:", error);
      throw error;
    }
  }

  // ✅ NEW: Update booking status after successful payment
  async updateBookingAfterPayment(bookingId, transactionId, paymentType) {
    try {
      console.log(
        `🔄 Updating booking ${bookingId} after ${paymentType} payment...`
      );

      if (paymentType === "deposit") {
        // Update booking: status = "pending" (waiting for owner approval)
        await bookingGrpcClient.updateBookingAfterDepositPayment(
          bookingId,
          transactionId
        );
        console.log(
          `✅ Booking ${bookingId}: status updated to "pending" (deposit paid)`
        );
      } else if (paymentType === "final_payment") {
        // Update booking: final_payment_paid = true (remains in "booking" status)
        await bookingGrpcClient.updateBookingAfterFinalPayment(
          bookingId,
          transactionId
        );
        console.log(
          `✅ Booking ${bookingId}: marked as fully paid (final payment)`
        );
      }
    } catch (error) {
      console.error(
        `❌ Failed to update booking ${bookingId} after payment:`,
        error
      );
      // Don't throw - payment is successful, booking update failure is non-critical
    }
  }

  // ==================== PAYMENT FAILED HANDLER ====================

  async handlePaymentFailed(paymentIntent) {
    try {
      const { id, metadata, last_payment_error } = paymentIntent;
      const { bookingId, type } = metadata;

      console.log(`❌ Payment failed: ${bookingId} (${type})`);

      await pool.query(
        `UPDATE transactions
         SET status = 'failed',
             error_message = $1,
             updated_at = NOW()
         WHERE booking_id = $2 AND type = $3 AND status = 'pending'`,
        [last_payment_error?.message || "Payment failed", bookingId, type]
      );

      console.log(`❌ Payment failed recorded: ${bookingId} (${type})`);
    } catch (error) {
      console.error("❌ handlePaymentFailed error:", error);
      throw error;
    }
  }

  // ==================== REFUND HANDLER ====================

  async handleRefundCompleted(charge) {
    console.log(`✅ Refund completed: ${charge.id}`);

    // Update refund status in database
    await pool.query(
      `UPDATE refunds 
       SET status = 'succeeded',
           completed_at = NOW()
       WHERE provider_refund_id = $1`,
      [charge.refund]
    );
  }
}

module.exports = new WebhookController();
