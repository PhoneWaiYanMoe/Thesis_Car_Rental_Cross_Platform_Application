// Backend/payment-service/src/services/payment_service.js
// ✅ FIXED: Prevent duplicate payment intents with idempotency check

const pool = require("../config/database");
const { v4: uuidv4 } = require("uuid");
const stripeService = require("./stripe_service");
const paypalService = require("./paypal_service");
const vnpayService = require("./vnpay_service");
const mockPaymentService = require("./mock_payment_service");

const MOCK_MODE = process.env.MOCK_PAYMENT === "true";

class PaymentService {
  constructor() {
    if (MOCK_MODE) {
      console.log("⚠️  [MOCK MODE] Payment service running in mock mode");
    }
  }

  /**
   * ✅ FIXED: Create payment intent with duplicate prevention
   */
  async createPaymentIntent(
    bookingId,
    userId,
    amount,
    type,
    provider,
    paymentMethodId = null,
    clientIp = "127.0.0.1",
  ) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // ✅ CRITICAL FIX: Check for existing pending/processing payment intent
      console.log(
        `\n🔍 Checking for existing ${type} payment for booking: ${bookingId}`,
      );

      const existingTx = await client.query(
        `SELECT transaction_id, intent_id, status, created_at
         FROM transactions
         WHERE booking_id = $1 
         AND type = $2 
         AND status IN ('pending', 'processing', 'succeeded')
         ORDER BY created_at DESC
         LIMIT 1`,
        [bookingId, type],
      );

      if (existingTx.rows.length > 0) {
        const existing = existingTx.rows[0];

        // If there's a succeeded payment, don't create another
        if (existing.status === "succeeded") {
          console.log(
            `⚠️  ${type} payment already succeeded for booking ${bookingId}`,
          );
          await client.query("ROLLBACK");
          throw new Error(`${type} payment already completed for this booking`);
        }

        // If there's a pending/processing payment less than 5 minutes old, reuse it
        const ageMinutes =
          (Date.now() - new Date(existing.created_at).getTime()) / 60000;
        if (ageMinutes < 5) {
          console.log(
            `⚠️  Recent ${type} payment intent exists (${ageMinutes.toFixed(
              1,
            )}min old)`,
          );
          console.log(`   Transaction ID: ${existing.transaction_id}`);
          console.log(`   Intent ID: ${existing.intent_id}`);
          console.log(`   Status: ${existing.status}`);

          // Get full transaction details to return
          const fullTx = await client.query(
            `SELECT * FROM transactions WHERE transaction_id = $1`,
            [existing.transaction_id],
          );

          await client.query("COMMIT");

          const tx = fullTx.rows[0];
          return {
            transactionId: tx.transaction_id,
            intentId: tx.intent_id,
            clientSecret: tx.client_secret,
            status: tx.status,
            amount: tx.amount,
          };
        } else {
          // Old pending payment - mark as cancelled and create new one
          console.log(
            `🔄 Cancelling old ${type} payment (${ageMinutes.toFixed(
              1,
            )}min old)`,
          );
          await client.query(
            `UPDATE transactions 
             SET status = 'cancelled', updated_at = NOW()
             WHERE transaction_id = $1`,
            [existing.transaction_id],
          );
        }
      }

      console.log(
        `✅ No duplicate found - creating new ${type} payment intent`,
      );

      // Create new payment intent
      let providerResponse;
      const metadata = {
        bookingId,
        userId,
        type,
      };

      if (MOCK_MODE) {
        console.log(`🎭 [MOCK] Creating ${type} payment`);
        switch (provider) {
          case "stripe":
            providerResponse =
              await mockPaymentService.createStripePaymentIntent(
                amount,
                "VND",
                metadata,
              );
            break;
          case "paypal":
            providerResponse = await mockPaymentService.createPayPalOrder(
              amount,
              "VND",
              metadata,
            );
            break;
          case "vnpay":
            const mockReturnUrl =
              process.env.VNPAY_RETURN_URL ||
              `http://localhost:3006/payment/webhook/vnpay`;
            providerResponse = mockPaymentService.createVNPayPaymentUrl(
              amount,
              `Wiz Booking ${type} - ${bookingId}`,
              clientIp,
              mockReturnUrl,
            );
            break;
          default:
            throw new Error("Invalid payment provider");
        }
      } else {
        switch (provider) {
          case "stripe":
            console.log(`💳 Creating Stripe payment: ${amount} VND`);
            providerResponse = await stripeService.createPaymentIntent(
              amount,
              "VND",
              metadata,
              paymentMethodId,
            );
            console.log(`✅ Stripe intent: ${providerResponse.intentId}`);
            break;

          case "paypal":
            providerResponse = await paypalService.createOrder(amount, "VND", {
              ...metadata,
              description: `Wiz Booking ${type}`,
            });
            break;

          case "vnpay":
            providerResponse = vnpayService.createPaymentUrl(
              amount,
              `Wiz Booking ${type} - ${bookingId}`,
              clientIp,
              process.env.VNPAY_RETURN_URL,
            );
            break;

          default:
            throw new Error("Invalid payment provider");
        }
      }

      // Validate paymentMethodId (must be UUID or null)
      let validPaymentMethodId = null;
      if (paymentMethodId) {
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(paymentMethodId)) {
          validPaymentMethodId = paymentMethodId;
        } else {
          console.log(`⚠️  Invalid payment method ID: "${paymentMethodId}"`);
        }
      }

      // Save transaction
      const transactionId = uuidv4();
      await client.query(
        `INSERT INTO transactions (
          transaction_id, booking_id, user_id, type, amount, currency,
          status, provider, intent_id, client_secret, payment_method_id, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          transactionId,
          bookingId,
          userId,
          type,
          amount,
          "VND",
          "pending",
          provider,
          providerResponse.intentId || providerResponse.orderId,
          providerResponse.clientSecret || null,
          validPaymentMethodId,
          JSON.stringify({
            amountUsd: providerResponse.amountUsd,
            originalCurrency: "VND",

            ownerId: metadata.ownerId,
            vehicleId: metadata.vehicleId,
          }),
        ],
      );

      await client.query("COMMIT");

      console.log(
        `✅ Payment intent created: ${transactionId} (${provider})\n`,
      );

      return {
        transactionId,
        ...providerResponse,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("❌ createPaymentIntent error:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  // ... rest of the service methods remain the same

  calculateInsuranceFee(rentalPrice, coveragePercent) {
    const premiumRates = {
      0: 0,
      30: 0.05,
      50: 0.08,
      70: 0.12,
      100: 0.15,
    };
    const rate = premiumRates[coveragePercent] || 0;
    return Math.round(rentalPrice * rate);
  }

  calculateBookingCost(dailyRate, days, insuranceCoverage) {
    const rentalPrice = dailyRate * days;
    const insuranceFee = this.calculateInsuranceFee(
      rentalPrice,
      insuranceCoverage,
    );
    const total = rentalPrice + insuranceFee;
    const deposit = Math.round(total * 0.3);
    const remainingPayment = total - deposit;

    return {
      rentalPrice,
      insuranceFee,
      insuranceCoverage,
      total,
      deposit,
      remainingPayment,
    };
  }

  async confirmPayment(transactionId, providerTransactionId) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `UPDATE transactions 
         SET status = 'succeeded',
             provider_transaction_id = $1,
             completed_at = NOW(),
             updated_at = NOW()
         WHERE transaction_id = $2`,
        [providerTransactionId, transactionId],
      );
      await client.query("COMMIT");
      console.log(`✅ Payment confirmed: ${transactionId}`);
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("❌ confirmPayment error:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  async processRefund(bookingId, userId, amount, reason, notes = null) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const transactionResult = await client.query(
        `SELECT * FROM transactions 
         WHERE booking_id = $1 
         AND type IN ('deposit', 'final_payment')
         AND status = 'succeeded'
         ORDER BY created_at DESC
         LIMIT 1`,
        [bookingId],
      );

      if (transactionResult.rows.length === 0) {
        throw new Error("No successful transaction found for refund");
      }

      const transaction = transactionResult.rows[0];
      let providerRefund;

      if (MOCK_MODE) {
        providerRefund = await mockPaymentService.mockRefund(
          transaction.provider_transaction_id,
          amount,
          transaction.provider,
        );
      } else {
        switch (transaction.provider) {
          case "stripe":
            providerRefund = await stripeService.createRefund(
              transaction.provider_transaction_id,
              amount,
            );
            break;
          case "paypal":
            providerRefund = await paypalService.createRefund(
              transaction.provider_transaction_id,
              amount,
              "VND",
            );
            break;
          case "vnpay":
            providerRefund = {
              refundId: `vnpay_refund_${Date.now()}`,
              status: "processing",
            };
            break;
          default:
            throw new Error("Invalid payment provider");
        }
      }

      const refundId = uuidv4();
      const estimatedArrival = new Date();
      estimatedArrival.setDate(estimatedArrival.getDate() + 7);

      await client.query(
        `INSERT INTO refunds (
          refund_id, transaction_id, booking_id, user_id, amount,
          reason, status, provider, provider_refund_id, notes,
          estimated_arrival
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          refundId,
          transaction.transaction_id,
          bookingId,
          userId,
          amount,
          reason,
          providerRefund.status,
          transaction.provider,
          providerRefund.refundId,
          notes,
          estimatedArrival,
        ],
      );

      await client.query("COMMIT");

      console.log(`✅ Refund processed: ${refundId}`);

      return {
        refundId,
        amount,
        status: providerRefund.status,
        estimatedArrival: estimatedArrival.toISOString().split("T")[0],
      };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("❌ processRefund error:", error);
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = new PaymentService();
