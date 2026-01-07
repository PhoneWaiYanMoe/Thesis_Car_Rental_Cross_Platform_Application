// Backend/payment-service/src/controllers/webhook_controller.js
// ✅ COMPLETE FIX: Better error handling and logging

const pool = require("../config/database");
const bookingGrpcClient = require("../grpc/booking_grpc_client");

const MOCK_MODE = process.env.MOCK_PAYMENT === "true";

class WebhookController {
  // ==================== STRIPE WEBHOOK ====================

  async handleStripeWebhook(req, res, next) {
    try {
      const event = req.webhookEvent; // Set by verification middleware

      console.log(`\n========================================`);
      console.log(`📨 STRIPE WEBHOOK RECEIVED`);
      console.log(`========================================`);
      console.log(`   Event Type: ${event.type}`);
      console.log(`   Event ID: ${event.id}`);
      console.log(`   Livemode: ${event.livemode}`);
      console.log(`========================================\n`);

      // Check for duplicate events
      const existingEvent = await pool.query(
        "SELECT event_id FROM webhook_events WHERE event_id = $1",
        [event.id]
      );

      if (existingEvent.rows.length > 0) {
        console.log(
          `⚠️  Duplicate Stripe event: ${event.id} - already processed`
        );
        return res.json({ received: true, duplicate: true });
      }

      // Store event
      await pool.query(
        `INSERT INTO webhook_events (event_id, provider, type, payload, processed)
         VALUES ($1, $2, $3, $4, $5)`,
        [event.id, "stripe", event.type, JSON.stringify(event.data), false]
      );

      console.log(`✅ Webhook event stored in database`);

      // Handle different event types
      switch (event.type) {
        case "payment_intent.succeeded":
          console.log(`\n💳 PAYMENT SUCCESS DETECTED`);
          console.log(`   Payment Intent ID: ${event.data.object.id}`);
          await this.handlePaymentSuccess(event.data.object, "stripe");
          break;

        case "payment_intent.payment_failed":
          console.log(`\n❌ PAYMENT FAILED DETECTED`);
          console.log(`   Payment Intent ID: ${event.data.object.id}`);
          await this.handlePaymentFailed(event.data.object);
          break;

        case "payment_intent.canceled":
          console.log(`\n🚫 PAYMENT CANCELED DETECTED`);
          console.log(`   Payment Intent ID: ${event.data.object.id}`);
          await this.handlePaymentCanceled(event.data.object);
          break;

        case "charge.refunded":
          console.log(`\n💰 REFUND DETECTED`);
          console.log(`   Charge ID: ${event.data.object.id}`);
          await this.handleRefundCompleted(event.data.object);
          break;

        case "payment_intent.created":
          console.log(`\nℹ️  PAYMENT INTENT CREATED (no action needed)`);
          break;

        default:
          console.log(`\nℹ️  Unhandled Stripe event type: ${event.type}`);
      }

      // Mark as processed
      await pool.query(
        "UPDATE webhook_events SET processed = true, processed_at = NOW() WHERE event_id = $1",
        [event.id]
      );

      console.log(`\n✅ Webhook processing complete\n`);

      res.json({ received: true, event_type: event.type });
    } catch (error) {
      console.error("\n❌ ========================================");
      console.error("❌ STRIPE WEBHOOK ERROR");
      console.error("❌ ========================================");
      console.error(error);
      console.error("❌ ========================================\n");

      // Still return 200 to Stripe to prevent retries
      res.status(200).json({
        received: true,
        error: "Processing failed but acknowledged",
      });
    }
  }

  // ==================== PAYMENT SUCCESS HANDLER ====================

  async handlePaymentSuccess(paymentIntent, provider = "stripe") {
    try {
      const { id, metadata, status } = paymentIntent;

      console.log(`\n🔍 PROCESSING PAYMENT SUCCESS`);
      console.log(`   Payment Intent ID: ${id}`);
      console.log(`   Status: ${status}`);
      console.log(`   Metadata:`, JSON.stringify(metadata, null, 2));

      // ✅ Find transaction by provider intent_id
      const txResult = await pool.query(
        `SELECT transaction_id, booking_id, type, status 
         FROM transactions 
         WHERE intent_id = $1 
         ORDER BY created_at DESC 
         LIMIT 1`,
        [id]
      );

      if (txResult.rows.length === 0) {
        console.error(`❌ No transaction found for intent: ${id}`);
        console.error(`   This webhook will be ignored`);
        return;
      }

      const transaction = txResult.rows[0];
      const {
        transaction_id,
        booking_id,
        type,
        status: txStatus,
      } = transaction;

      console.log(`\n✅ TRANSACTION FOUND`);
      console.log(`   Transaction ID: ${transaction_id}`);
      console.log(`   Booking ID: ${booking_id}`);
      console.log(`   Payment Type: ${type}`);
      console.log(`   Current Status: ${txStatus}`);

      // Check if already processed
      if (txStatus === "succeeded") {
        console.log(`⚠️  Transaction already marked as succeeded - skipping`);
        return;
      }

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

      console.log(`\n✅ Transaction updated to 'succeeded'`);

      // ✅ Update booking status via gRPC
      console.log(`\n🔄 Updating booking status via gRPC...`);
      await this.updateBookingAfterPayment(booking_id, transaction_id, type);

      console.log(`\n✅ ========================================`);
      console.log(`✅ PAYMENT SUCCESS FULLY PROCESSED`);
      console.log(`✅ ========================================`);
      console.log(`   Booking: ${booking_id}`);
      console.log(`   Transaction: ${transaction_id}`);
      console.log(`   Type: ${type}`);
      console.log(`✅ ========================================\n`);
    } catch (error) {
      console.error("\n❌ ========================================");
      console.error("❌ ERROR IN handlePaymentSuccess");
      console.error("❌ ========================================");
      console.error(error);
      console.error("❌ ========================================\n");
      throw error;
    }
  }

  // ✅ Update booking after payment
  async updateBookingAfterPayment(bookingId, transactionId, paymentType) {
    try {
      console.log(`\n🔄 UPDATING BOOKING`);
      console.log(`   Booking ID: ${bookingId}`);
      console.log(`   Payment Type: ${paymentType}`);

      if (paymentType === "deposit") {
        await bookingGrpcClient.updateBookingAfterDepositPayment(
          bookingId,
          transactionId
        );
        console.log(`✅ Booking status updated: pending_payment → pending`);
        console.log(`   (Waiting for owner approval)`);
      } else if (paymentType === "final_payment") {
        await bookingGrpcClient.updateBookingAfterFinalPayment(
          bookingId,
          transactionId
        );
        console.log(`✅ Booking marked as fully paid`);
        console.log(`   (Status remains 'booking')`);
      }

      console.log(`✅ Booking update complete\n`);
    } catch (error) {
      console.error(`\n❌ CRITICAL ERROR: Failed to update booking`);
      console.error(`   Booking ID: ${bookingId}`);
      console.error(`   Payment Type: ${paymentType}`);
      console.error(`   Error:`, error.message);
      console.error(`\n⚠️  PAYMENT SUCCEEDED BUT BOOKING NOT UPDATED!`);
      console.error(`   This needs manual intervention\n`);
    }
  }

  // ==================== OTHER HANDLERS ====================

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
         WHERE intent_id = $2`,
        [last_payment_error?.message || "Payment failed", id]
      );

      console.log(`✅ Payment failure recorded in database\n`);
    } catch (error) {
      console.error("❌ handlePaymentFailed error:", error);
    }
  }

  async handlePaymentCanceled(paymentIntent) {
    try {
      const { id } = paymentIntent;

      console.log(`🚫 Payment canceled for intent: ${id}`);

      await pool.query(
        `UPDATE transactions
         SET status = 'cancelled',
             updated_at = NOW()
         WHERE intent_id = $1`,
        [id]
      );

      console.log(`✅ Payment cancellation recorded\n`);
    } catch (error) {
      console.error("❌ handlePaymentCanceled error:", error);
    }
  }

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

      console.log(`✅ Refund status updated\n`);
    } catch (error) {
      console.error("❌ handleRefundCompleted error:", error);
    }
  }

  // ==================== VNPAY HANDLER ====================

  async handleVNPayReturn(req, res, next) {
    try {
      let result;

      if (MOCK_MODE) {
        console.log("🎭 [MOCK] VNPay return (skipping signature check)");
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

        console.log(`✅ VNPay payment success: ${result.orderId}`);

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

  // ==================== PAYPAL HANDLER ====================

  async handlePayPalWebhook(req, res, next) {
    console.log("📨 PayPal webhook received (not implemented)");
    res.json({ received: true });
  }
}

module.exports = new WebhookController();
