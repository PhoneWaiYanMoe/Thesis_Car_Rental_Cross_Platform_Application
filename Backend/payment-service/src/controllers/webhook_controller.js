// Backend/payment-service/src/controllers/webhook_controller.js
// ✅ UPDATED: Add vehicle to unavailability AFTER successful deposit payment

const pool = require("../config/database");
const bookingGrpcClient = require("../grpc/booking_grpc_client");
const vehicleGrpcClient = require("../grpc/vehicle_grpc_client"); // ✅ ADD

const MOCK_MODE = process.env.MOCK_PAYMENT === "true";

class WebhookController {
  // ==================== STRIPE WEBHOOK ====================

  async handleStripeWebhook(req, res, next) {
    try {
      const event = req.webhookEvent;

      console.log(`\n========================================`);
      console.log(`📨 STRIPE WEBHOOK RECEIVED`);
      console.log(`========================================`);
      console.log(`   Event Type: ${event.type}`);
      console.log(`   Event ID: ${event.id}`);
      console.log(`========================================\n`);

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

      await pool.query(
        `INSERT INTO webhook_events (event_id, provider, type, payload, processed)
         VALUES ($1, $2, $3, $4, $5)`,
        [event.id, "stripe", event.type, JSON.stringify(event.data), false]
      );

      console.log(`✅ Webhook event stored in database`);

      switch (event.type) {
        case "payment_intent.succeeded":
          console.log(`\n💳 PAYMENT SUCCESS DETECTED`);
          await this.handlePaymentSuccess(event.data.object, "stripe");
          break;

        case "payment_intent.payment_failed":
          console.log(`\n❌ PAYMENT FAILED DETECTED`);
          await this.handlePaymentFailed(event.data.object);
          break;

        case "payment_intent.canceled":
          console.log(`\n🚫 PAYMENT CANCELED DETECTED`);
          await this.handlePaymentCanceled(event.data.object);
          break;

        case "charge.refunded":
          console.log(`\n💰 REFUND DETECTED`);
          await this.handleRefundCompleted(event.data.object);
          break;

        default:
          console.log(`\nℹ️  Unhandled Stripe event type: ${event.type}`);
      }

      await pool.query(
        "UPDATE webhook_events SET processed = true, processed_at = NOW() WHERE event_id = $1",
        [event.id]
      );

      console.log(`\n✅ Webhook processing complete\n`);

      res.json({ received: true, event_type: event.type });
    } catch (error) {
      console.error("\n❌ STRIPE WEBHOOK ERROR:", error);
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
      await this.updateBookingAfterPayment(booking_id, transaction_id, type);

      // ✅ NEW: If deposit payment, add vehicle to unavailability
      if (type === "deposit") {
        await this.addVehicleUnavailability(booking_id);
      }

      console.log(`\n✅ PAYMENT SUCCESS FULLY PROCESSED`);
    } catch (error) {
      console.error("\n❌ ERROR IN handlePaymentSuccess:", error);
      throw error;
    }
  }

  // ✅ FIXED: Get booking details via gRPC, not database
  async addVehicleUnavailability(bookingId) {
    try {
      console.log(`\n🔄 Adding vehicle to unavailability...`);
      console.log(`   Booking ID: ${bookingId}`);

      // ✅ Get booking details via gRPC (not direct DB query)
      let bookingDetails;
      try {
        bookingDetails = await bookingGrpcClient.getBookingDetails(bookingId);
      } catch (error) {
        console.error(
          `❌ Could not get booking details via gRPC:`,
          error.message
        );
        return;
      }

      const vehicleId = bookingDetails.vehicle_id;
      const startDate = bookingDetails.start_date.split("T")[0]; // Extract date only
      const endDate = bookingDetails.end_date.split("T")[0];

      console.log(`   Vehicle ID: ${vehicleId}`);
      console.log(`   Dates: ${startDate} to ${endDate}`);

      // ✅ Call vehicle service to add unavailability (already loaded at top)
      try {
        await vehicleGrpcClient.syncUnavailability(
          vehicleId,
          startDate,
          endDate,
          bookingId,
          "add"
        );

        console.log(`✅ Vehicle ${vehicleId} added to unavailability`);
        console.log(`   Period: ${startDate} to ${endDate}`);
      } catch (error) {
        console.error(
          `⚠️  Could not add vehicle to unavailability:`,
          error.message
        );
        // Don't fail payment if this errors - just log it
      }
    } catch (error) {
      console.error(
        `\n❌ CRITICAL ERROR: Failed to add vehicle unavailability`
      );
      console.error(`   Booking ID: ${bookingId}`);
      console.error(`   Error:`, error.message);
    }
  }

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
      } else if (paymentType === "final_payment") {
        await bookingGrpcClient.updateBookingAfterFinalPayment(
          bookingId,
          transactionId
        );
        console.log(`✅ Booking marked as fully paid`);
      }

      console.log(`✅ Booking update complete\n`);
    } catch (error) {
      console.error(`\n❌ CRITICAL ERROR: Failed to update booking`);
      console.error(`   Booking ID: ${bookingId}`);
      console.error(`   Error:`, error.message);
    }
  }

  // ==================== OTHER HANDLERS ====================

  async handlePaymentFailed(paymentIntent) {
    try {
      const { id, last_payment_error } = paymentIntent;

      console.log(`❌ Payment failed for intent: ${id}`);

      await pool.query(
        `UPDATE transactions
         SET status = 'failed',
             error_message = $1,
             updated_at = NOW()
         WHERE intent_id = $2`,
        [last_payment_error?.message || "Payment failed", id]
      );

      console.log(`✅ Payment failure recorded\n`);
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

        // ✅ NEW: Add to unavailability if deposit
        if (transaction.type === "deposit") {
          await this.addVehicleUnavailability(transaction.booking_id);
        }

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
