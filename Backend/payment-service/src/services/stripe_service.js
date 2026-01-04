const { stripeConfig } = require("../config/payment_providers");
const stripe = stripeConfig.client;

class StripeService {
  /**
   * Create payment intent for deposit or final payment
   */
  async createPaymentIntent(
    amount,
    currency,
    metadata,
    paymentMethodId = null
  ) {
    try {
      const intentData = {
        amount: Math.round(amount), // Amount in smallest currency unit
        currency: currency.toLowerCase(),
        metadata: metadata,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: "never",
        },
      };

      // If payment method provided, attach it
      if (paymentMethodId) {
        intentData.payment_method = paymentMethodId;
        intentData.confirm = false; // Will be confirmed by client
      }

      const paymentIntent = await stripe.paymentIntents.create(intentData);

      console.log(`✅ Stripe PaymentIntent created: ${paymentIntent.id}`);

      return {
        intentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      };
    } catch (error) {
      console.error("❌ Stripe createPaymentIntent error:", error);
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
      const refund = await stripe.refunds.create({
        charge: chargeId,
        amount: Math.round(amount),
        reason: reason,
      });

      console.log(`✅ Stripe Refund created: ${refund.id}`);

      return {
        refundId: refund.id,
        status: refund.status,
        amount: refund.amount,
        currency: refund.currency,
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
