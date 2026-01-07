// Backend/payment-service/src/services/payment_service.js
// ✅ UPDATED: Better Stripe integration

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
      console.log("   All payments will be simulated");
      console.log("   Set MOCK_PAYMENT=false to use real providers");
    }
  }

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
      insuranceCoverage
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

  calculateDamageLiability(damageAmount, insuranceCoverage) {
    const coverageRate = insuranceCoverage / 100;
    const insuranceCovers = Math.round(damageAmount * coverageRate);
    const customerPays = damageAmount - insuranceCovers;

    return {
      damageAmount,
      insuranceCovers,
      customerPays,
      coveragePercent: insuranceCoverage,
    };
  }

  /**
   * ✅ UPDATED: Create payment intent with better Stripe support
   */
  // Backend/payment-service/src/services/payment_service.js
  // ✅ COMPLETE FIX: Around line 150-180

  async createPaymentIntent(
    bookingId,
    userId,
    amount,
    type,
    provider,
    paymentMethodId = null,
    clientIp = "127.0.0.1"
  ) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      let providerResponse;
      const metadata = {
        bookingId,
        userId,
        type,
      };

      // ✅ Use mock service if in mock mode
      if (MOCK_MODE) {
        console.log(
          `🎭 [MOCK] Creating ${type} payment intent for booking: ${bookingId}`
        );

        switch (provider) {
          case "stripe":
            providerResponse =
              await mockPaymentService.createStripePaymentIntent(
                amount,
                "VND",
                metadata
              );
            break;

          case "paypal":
            providerResponse = await mockPaymentService.createPayPalOrder(
              amount,
              "VND",
              metadata
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
              mockReturnUrl
            );
            console.log(
              `🎭 [MOCK] VNPay payment URL: ${providerResponse.paymentUrl}`
            );
            break;

          default:
            throw new Error("Invalid payment provider");
        }
      } else {
        // ✅ Use real payment providers
        switch (provider) {
          case "stripe":
            console.log(`💳 Creating Stripe payment intent: ${amount} VND`);
            providerResponse = await stripeService.createPaymentIntent(
              amount,
              "VND", // Will be converted to USD inside stripe_service
              metadata,
              paymentMethodId
            );
            console.log(
              `✅ Stripe intent created: ${providerResponse.intentId}`
            );
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
              process.env.VNPAY_RETURN_URL
            );
            break;

          default:
            throw new Error("Invalid payment provider");
        }
      }

      // ✅ FIX: Validate paymentMethodId - must be UUID or null
      // If paymentMethodId is the provider string (like "stripe"), set it to null
      let validPaymentMethodId = null;

      if (paymentMethodId) {
        // Check if it's a valid UUID format (8-4-4-4-12 hex characters)
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

        if (uuidRegex.test(paymentMethodId)) {
          validPaymentMethodId = paymentMethodId;
        } else {
          console.log(
            `⚠️  Invalid payment method ID (not UUID): "${paymentMethodId}" - setting to null`
          );
          validPaymentMethodId = null;
        }
      }

      // Save transaction record
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
          validPaymentMethodId, // ✅ Use validated UUID or null
          JSON.stringify({
            amountUsd: providerResponse.amountUsd,
            originalCurrency: "VND",
          }),
        ]
      );

      await client.query("COMMIT");

      const mode = MOCK_MODE ? "[MOCK]" : "";
      console.log(
        `✅ ${mode} Payment intent created: ${transactionId} (${provider})`
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
        [providerTransactionId, transactionId]
      );

      await client.query("COMMIT");

      const mode = MOCK_MODE ? "[MOCK]" : "";
      console.log(`✅ ${mode} Payment confirmed: ${transactionId}`);
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
        [bookingId]
      );

      if (transactionResult.rows.length === 0) {
        throw new Error("No successful transaction found for refund");
      }

      const transaction = transactionResult.rows[0];

      let providerRefund;

      if (MOCK_MODE) {
        console.log(`🎭 [MOCK] Processing refund for booking: ${bookingId}`);
        providerRefund = await mockPaymentService.mockRefund(
          transaction.provider_transaction_id,
          amount,
          transaction.provider
        );
      } else {
        switch (transaction.provider) {
          case "stripe":
            console.log(`💳 Processing Stripe refund: ${amount} VND`);
            providerRefund = await stripeService.createRefund(
              transaction.provider_transaction_id,
              amount
            );
            break;

          case "paypal":
            providerRefund = await paypalService.createRefund(
              transaction.provider_transaction_id,
              amount,
              "VND"
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
        ]
      );

      await client.query("COMMIT");

      const mode = MOCK_MODE ? "[MOCK]" : "";
      console.log(
        `✅ ${mode} Refund processed: ${refundId} (${transaction.provider})`
      );

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
