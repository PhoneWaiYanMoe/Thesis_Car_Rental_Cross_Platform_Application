// Backend/payment-service/src/services/stripe_service.js
// ✅ FIXED: Better handling of payment method ID

const { stripeConfig } = require("../config/payment_providers");
const stripe = stripeConfig.client;

class StripeService {
  /**
   * Create payment intent for deposit or final payment
   * ✅ FIXED: Stripe doesn't support VND directly, convert to USD
   */
  async createPaymentIntent(
    amount,
    currency,
    metadata,
    paymentMethodId = null
  ) {
    try {
      // ✅ Convert VND to USD (Stripe doesn't support VND)
      // Exchange rate: ~24,000 VND = 1 USD
      let finalAmount = amount;
      let finalCurrency = currency;

      if (currency === "VND") {
        finalAmount = Math.round((amount / 24000) * 100); // Convert to USD cents
        finalCurrency = "usd";
        console.log(`💱 Converted ${amount} VND → ${finalAmount / 100} USD`);
      }

      const intentData = {
        amount: Math.round(finalAmount), // Amount in smallest currency unit
        currency: finalCurrency.toLowerCase(),
        metadata: {
          ...metadata,
          originalAmount: amount,
          originalCurrency: currency,
        },
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: "never",
        },
      };

      // ✅ FIX: Only attach payment method if it's a valid Stripe payment method ID
      // Valid format: pm_xxxxx, card_xxxxx, etc.
      if (
        paymentMethodId &&
        (paymentMethodId.startsWith("pm_") ||
          paymentMethodId.startsWith("card_") ||
          paymentMethodId.startsWith("ba_"))
      ) {
        console.log(`💳 Using saved payment method: ${paymentMethodId}`);
        intentData.payment_method = paymentMethodId;
        intentData.confirm = false; // Will be confirmed by client
      } else {
        // ✅ No payment method provided - Stripe will collect it in the payment sheet
        console.log(
          `💳 No payment method provided - will be collected by Stripe`
        );
      }

      const paymentIntent = await stripe.paymentIntents.create(intentData);

      console.log(`✅ Stripe PaymentIntent created: ${paymentIntent.id}`);
      console.log(
        `   Amount: ${finalAmount / 100} ${finalCurrency.toUpperCase()}`
      );
      console.log(`   Status: ${paymentIntent.status}`);

      return {
        intentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        status: paymentIntent.status,
        amount: amount, // Return original VND amount
        currency: currency, // Return original currency
        amountUsd: finalAmount / 100, // Also return USD amount for display
      };
    } catch (error) {
      console.error("❌ Stripe createPaymentIntent error:", error);

      // ✅ Provide more helpful error messages
      if (error.code === "resource_missing") {
        throw new Error(
          `Invalid payment method ID provided. Please use a valid Stripe payment method ID or omit this parameter to collect payment details from the user.`
        );
      }

      throw new Error(`Stripe error: ${error.message}`);
    }
  }

  /**
   * Confirm payment intent (usually done by webhook)
   */
  async confirmPayment(intentId) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(intentId);

      return {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        charges: paymentIntent.charges.data,
      };
    } catch (error) {
      console.error("❌ Stripe confirmPayment error:", error);
      throw new Error(`Stripe error: ${error.message}`);
    }
  }

  /**
   * Create refund
   */
  async createRefund(chargeId, amount, reason = "requested_by_customer") {
    try {
      // Convert VND to USD if needed
      let refundAmount = amount;
      if (amount > 1000000) {
        // Assume it's VND if > 1M
        refundAmount = Math.round((amount / 24000) * 100);
      }

      const refund = await stripe.refunds.create({
        charge: chargeId,
        amount: Math.round(refundAmount),
        reason: reason,
      });

      console.log(`✅ Stripe Refund created: ${refund.id}`);

      return {
        refundId: refund.id,
        status: refund.status,
        amount: amount, // Return original amount
        currency: "VND",
      };
    } catch (error) {
      console.error("❌ Stripe createRefund error:", error);
      throw new Error(`Stripe error: ${error.message}`);
    }
  }

  /**
   * Attach payment method to customer
   */
  async attachPaymentMethod(paymentMethodId, customerId) {
    try {
      const paymentMethod = await stripe.paymentMethods.attach(
        paymentMethodId,
        {
          customer: customerId,
        }
      );

      return paymentMethod;
    } catch (error) {
      console.error("❌ Stripe attachPaymentMethod error:", error);
      throw new Error(`Stripe error: ${error.message}`);
    }
  }

  /**
   * Get or create Stripe customer
   */
  async getOrCreateCustomer(userId, email, name) {
    try {
      // Search for existing customer
      const customers = await stripe.customers.list({
        email: email,
        limit: 1,
      });

      if (customers.data.length > 0) {
        return customers.data[0];
      }

      // Create new customer
      const customer = await stripe.customers.create({
        email: email,
        name: name,
        metadata: { userId: userId },
      });

      console.log(`✅ Stripe Customer created: ${customer.id}`);
      return customer;
    } catch (error) {
      console.error("❌ Stripe getOrCreateCustomer error:", error);
      throw new Error(`Stripe error: ${error.message}`);
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload, signature) {
    try {
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        stripeConfig.webhookSecret
      );
      return event;
    } catch (error) {
      console.error("❌ Stripe webhook verification failed:", error);
      throw new Error("Invalid signature");
    }
  }
}

module.exports = new StripeService();
