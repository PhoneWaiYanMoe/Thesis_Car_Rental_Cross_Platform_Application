// Backend/payment-service/src/controllers/webhook_controller.js
// ✅ COMPLETE FIX: Proper webhook handling with booking status updates

const pool = require("../config/database");
const bookingGrpcClient = require("../grpc/booking_grpc_client");

const MOCK_MODE = process.env.MOCK_PAYMENT === "true";

class WebhookController {
  // ==================== STRIPE WEBHOOK ====================

  async handleStripeWebhook(req, res, next) {
    try {
      const event = req.webhookEvent; // Set by verification middleware

      console.log(`📨 Stripe webhook received: ${event.type}`);
      console.log(`   Event ID: ${event.id}`);

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
          console.log(`✅ Stripe payment succeeded: ${event.data.object.id}`);
          await this.handlePaymentSuccess(event.data.object, "stripe");
          break;

        case "payment_intent.payment_failed":
          console.log(`❌ Stripe payment failed: ${event.data.object.id}`);
          await this.handlePaymentFailed(event.data.object);
          break;

        case "payment_intent.canceled":
          console.log(`🚫 Stripe payment canceled: ${event.data.object.id}`);
          await this.handlePaymentCanceled(event.data.object);
          break;

        case "charge.refunded":
          console.log(`💰 Stripe refund processed: ${event.data.object.id}`);
          await this.handleRefundCompleted(event.data.object);
          break;

        default:
          console.log(`ℹ️  Unhandled Stripe event type: ${event.type}`);
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
    res.json({ received: true });
  }

  // ==================== VNPAY RETURN ====================

  async handleVNPayReturn(req, res, next) {
    try {
      let result;

      if (MOCK_MODE) {
        console.log(
          "🎭 [MOCK] VNPay return received (skipping signature check)"
        );

        const { vnp_TxnRef, vnp_ResponseCode, vnp_TransactionNo } = req.query;

        result = {
          valid: true,
          success: vnp_ResponseCode === "00",
          orderId: vnp_TxnRef,
          transactionNo: vnp_TransactionNo || `mock_txn_${Date.now()}`,
          responseCode: vnp_ResponseCode,
        };
      } else {
        result = req.webhookEvent;

        if (!result.valid) {
          console.log("❌ VNPay invalid signature");
          return res.redirect(`${process.env.FRONTEND_URL}/payment/failed`);
        }
      }

      if (result.success) {
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

        await pool.query(
          `UPDATE transactions
           SET status = 'succeeded',
               provider_transaction_id = $1,
               completed_at = NOW(),
               updated_at = NOW()
           WHERE transaction_id = $2`,
          [result.transactionNo, transaction.transaction_id]
        );

        const mode = MOCK_MODE ? "[MOCK]" : "";
        console.log(`✅ ${mode} VNPay payment success: ${result.orderId}`);

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

      console.log(`💳 Processing payment success webhook`);
      console.log(`   Payment Intent ID: ${id}`);
      console.log(`   Metadata:`, metadata);

      // ✅ FIX: Find transaction by provider intent_id (not metadata)
      const txResult = await pool.query(
        `SELECT transaction_id, booking_id, type 
         FROM transactions 
         WHERE intent_id = $1 AND status = 'pending'
         ORDER BY created_at DESC 
         LIMIT 1`,
        [id]
      );

      if (txResult.rows.length === 0) {
        console.error(`❌ No pending transaction found for intent: ${id}`);

        // Try to find ANY transaction with this intent_id for debugging
        const debugResult = await pool.query(
          `SELECT transaction_id, booking_id, type, status 
           FROM transactions 
           WHERE intent_id = $1`,
          [id]
        );

        if (debugResult.rows.length > 0) {
          console.log(
            `⚠️  Found transaction but status is: ${debugResult.rows[0].status}`
          );
        } else {
          console.log(`⚠️  No transaction found at all with intent_id: ${id}`);
        }

        return;
      }

      const transaction = txResult.rows[0];
      const { transaction_id, booking_id, type } = transaction;

      console.log(`✅ Found transaction: ${transaction_id}`);
      console.log(`   Booking: ${booking_id}`);
      console.log(`   Type: ${type}`);

      // Update transaction status
      await pool.query(
        `UPDATE transactions
         SET status = 'succeeded',
             provider_transaction_id = $1,
             completed_at = NOW(),
             updated_at = NOW()
         WHERE transaction_id = $2`,
        [id, transaction_id]
      );

      console.log(`✅ Transaction ${transaction_id} marked as succeeded`);

      // ✅ CRITICAL: Update booking status via gRPC
      await this.updateBookingAfterPayment(booking_id, transaction_id, type);

      console.log(
        `✅ Payment success handled completely for booking ${booking_id}`
      );
    } catch (error) {
      console.error("❌ handlePaymentSuccess error:", error);
      throw error;
    }
  }

  // ✅ CRITICAL: Update booking status after successful payment
  async updateBookingAfterPayment(bookingId, transactionId, paymentType) {
    try {
      console.log(
        `🔄 Updating booking ${bookingId} after ${paymentType} payment...`
      );

      if (paymentType === "deposit") {
        // ✅ Update booking: pending_payment → pending (waiting for owner approval)
        await bookingGrpcClient.updateBookingAfterDepositPayment(
          bookingId,
          transactionId
        );
        console.log(
          `✅ Booking ${bookingId}: status updated to "pending" (deposit paid, waiting for owner)`
        );
      } else if (paymentType === "final_payment") {
        // ✅ Update booking: mark as fully paid (but status remains 'booking')
        await bookingGrpcClient.updateBookingAfterFinalPayment(
          bookingId,
          transactionId
        );
        console.log(
          `✅ Booking ${bookingId}: marked as fully paid (final payment complete)`
        );
      }
    } catch (error) {
      console.error(
        `❌ Failed to update booking ${bookingId} after payment:`,
        error
      );
      console.error(
        `   This is a CRITICAL error - payment succeeded but booking not updated!`
      );
      // ✅ Don't throw - we still want to acknowledge the webhook
      // But log it prominently so it can be fixed manually
    }
  }

  // ==================== PAYMENT FAILED HANDLER ====================

  async handlePaymentFailed(paymentIntent) {
    try {
      const { id, last_payment_error } = paymentIntent;

      console.log(`❌ Payment failed for intent: ${id}`);
      console.log(
        `   Error: ${last_payment_error?.message || "Unknown error"}`
      );

      await pool.query(
        `UPDATE transactions
         SET status = 'failed',
             error_message = $1,
             updated_at = NOW()
         WHERE intent_id = $2 AND status = 'pending'`,
        [last_payment_error?.message || "Payment failed", id]
      );

      console.log(`✅ Payment failure recorded`);
    } catch (error) {
      console.error("❌ handlePaymentFailed error:", error);
    }
  }

  // ==================== PAYMENT CANCELED HANDLER ====================

  async handlePaymentCanceled(paymentIntent) {
    try {
      const { id } = paymentIntent;

      console.log(`🚫 Payment canceled for intent: ${id}`);

      await pool.query(
        `UPDATE transactions
         SET status = 'cancelled',
             updated_at = NOW()
         WHERE intent_id = $1 AND status = 'pending'`,
        [id]
      );

      console.log(`✅ Payment cancellation recorded`);
    } catch (error) {
      console.error("❌ handlePaymentCanceled error:", error);
    }
  }

  // ==================== REFUND HANDLER ====================

  async handleRefundCompleted(charge) {
    try {
      console.log(`✅ Refund completed: ${charge.id}`);

      await pool.query(
        `UPDATE refunds 
         SET status = 'succeeded',
             completed_at = NOW()
         WHERE provider_refund_id = $1`,
        [charge.refund]
      );

      console.log(`✅ Refund status updated in database`);
    } catch (error) {
      console.error("❌ handleRefundCompleted error:", error);
    }
  }
}

module.exports = new WebhookController();
