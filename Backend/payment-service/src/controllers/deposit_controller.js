const paymentService = require("../services/payment_service");
const bookingGrpcClient = require("../grpc/booking_grpc_client");

class DepositController {
  async createDepositIntent(req, res, next) {
    try {
      const userId = req.user.userId;
      const { bookingId, provider, paymentMethodId, returnUrl } = req.body;

      // Get booking details from booking service
      const booking = await bookingGrpcClient.getBookingDetails(bookingId);

      if (booking.customer_id !== userId) {
        return res
          .status(403)
          .json({ error: "Not authorized for this booking" });
      }

      // Allow deposit payment when status is 'pending_payment' (new booking) or 'pending' (retry)
      if (
        booking.status !== "pending_payment" &&
        booking.status !== "pending"
      ) {
        return res.status(400).json({
          error: `Cannot process deposit. Booking status: ${booking.status}. Expected: pending_payment or pending`,
        });
      }

      // Check if deposit is already paid
      if (booking.deposit_paid) {
        return res.status(400).json({
          error: "Deposit has already been paid for this booking",
        });
      }

      // Create payment intent
      const result = await paymentService.createPaymentIntent(
        bookingId,
        userId,
        booking.deposit_amount,
        "deposit",
        provider,
        paymentMethodId,
        { ownerId: booking.owner_id, vehicleId: booking.vehicle_id },
      );

      res.status(201).json({
        intentId: result.intentId || result.orderId,
        clientSecret: result.clientSecret,
        amount: booking.deposit_amount,
        currency: "VND",
        status: result.status,
        provider: provider,
        paymentUrl: result.paymentUrl, // For VNPay
      });
    } catch (error) {
      console.error("Create deposit intent error:", error);
      next(error);
    }
  }

  async confirmDeposit(req, res, next) {
    try {
      const userId = req.user.userId;
      const { intentId } = req.params;

      // This is typically called by webhook, but can be manual
      // Implementation depends on provider-specific confirmation

      res.json({
        message: "Deposit confirmation received",
        intentId,
      });
    } catch (error) {
      console.error("Confirm deposit error:", error);
      next(error);
    }
  }

  // ✅ NEW: Verify payment status by checking Stripe directly (fallback if webhook fails)
  async verifyDepositPayment(req, res, next) {
    try {
      const userId = req.user.userId;
      const { intentId } = req.params;

      console.log(`\n🔍 VERIFYING DEPOSIT PAYMENT`);
      console.log(`   Intent ID: ${intentId}`);
      console.log(`   User ID: ${userId}`);

      // Get transaction from database
      const txResult = await require("../config/database").query(
        `SELECT transaction_id, booking_id, type, status, provider 
         FROM transactions 
         WHERE intent_id = $1 
         LIMIT 1`,
        [intentId],
      );

      if (txResult.rows.length === 0) {
        console.log(`❌ No transaction found for intent: ${intentId}`);
        return res.status(404).json({
          error: "Transaction not found",
          intentId,
        });
      }

      const transaction = txResult.rows[0];
      const {
        transaction_id,
        booking_id,
        type,
        status: txStatus,
        provider,
      } = transaction;

      console.log(`✅ Transaction found`);
      console.log(`   Transaction ID: ${transaction_id}`);
      console.log(`   Booking ID: ${booking_id}`);
      console.log(`   Current Status: ${txStatus}`);

      // If already succeeded, just return
      if (txStatus === "succeeded") {
        console.log(`⚠️  Transaction already marked as succeeded`);
        return res.json({
          status: "succeeded",
          message: "Payment already confirmed",
          transactionId: transaction_id,
          bookingId: booking_id,
        });
      }

      // Query Stripe to get actual payment intent status
      if (provider === "stripe") {
        const stripeService = require("../services/stripe_service");
        let stripeIntent;

        try {
          stripeIntent = await stripeService.getPaymentIntent(intentId);
          console.log(`\n💳 STRIPE PAYMENT INTENT STATUS`);
          console.log(`   Status: ${stripeIntent.status}`);
          console.log(`   Amount Received: ${stripeIntent.amount_received}`);
          console.log(`   Charges: ${stripeIntent.charges?.data?.length || 0}`);
        } catch (error) {
          console.error(
            `❌ Failed to retrieve intent from Stripe:`,
            error.message,
          );
          return res.status(502).json({
            error: "Failed to verify with payment provider",
            message: error.message,
          });
        }

        // If Stripe says it succeeded, update our database
        if (stripeIntent.status === "succeeded") {
          console.log(`\n✅ STRIPE CONFIRMS PAYMENT SUCCEEDED`);
          console.log(`   Amount: ${stripeIntent.amount_received / 100} `);

          // Update transaction status
          await require("../config/database").query(
            `UPDATE transactions
             SET status = 'succeeded',
                 provider_transaction_id = $1,
                 completed_at = NOW(),
                 updated_at = NOW()
             WHERE transaction_id = $2`,
            [intentId, transaction_id],
          );

          console.log(`✅ Transaction updated to 'succeeded' in database`);

          // Update booking via gRPC (same as webhook would do)
          try {
            const bookingGrpcClient = require("../grpc/booking_grpc_client");
            await bookingGrpcClient.updateBookingAfterDepositPayment(
              booking_id,
              transaction_id,
            );
            console.log(`✅ Booking marked as deposit paid`);
          } catch (error) {
            console.error(
              `⚠️  Failed to update booking via gRPC:`,
              error.message,
            );
            // Don't fail the verification if gRPC fails
          }

          return res.json({
            status: "succeeded",
            message: "Payment verified and updated",
            transactionId: transaction_id,
            bookingId: booking_id,
            stripeStatus: stripeIntent.status,
          });
        } else if (stripeIntent.status === "processing") {
          console.log(`⏳ Payment still processing`);
          return res.json({
            status: "processing",
            message: "Payment is still being processed",
            transactionId: transaction_id,
            stripeStatus: stripeIntent.status,
          });
        } else if (stripeIntent.status === "requires_payment_method") {
          console.log(`❌ Payment requires additional payment method`);
          return res.json({
            status: "requires_payment_method",
            message: "Payment requires additional payment method",
            transactionId: transaction_id,
            stripeStatus: stripeIntent.status,
          });
        } else {
          console.log(`❌ Payment failed or canceled: ${stripeIntent.status}`);
          return res.json({
            status: "failed",
            message: `Payment ${stripeIntent.status}`,
            transactionId: transaction_id,
            stripeStatus: stripeIntent.status,
          });
        }
      } else {
        console.log(`⚠️  Verification not supported for provider: ${provider}`);
        return res.status(501).json({
          error: "Verification not supported for this provider",
          provider,
        });
      }
    } catch (error) {
      console.error("\n❌ VERIFY DEPOSIT ERROR:", error);
      next(error);
    }
  }
}

module.exports = new DepositController();
