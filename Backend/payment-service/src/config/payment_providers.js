const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const paypal = require('@paypal/checkout-server-sdk');

// Stripe configuration
const stripeConfig = {
  client: stripe,
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
};

// PayPal configuration
let paypalEnvironment;
if (process.env.PAYPAL_MODE === 'live') {
  paypalEnvironment = new paypal.core.LiveEnvironment(
    process.env.PAYPAL_CLIENT_ID,
    process.env.PAYPAL_CLIENT_SECRET
  );
} else {
  paypalEnvironment = new paypal.core.SandboxEnvironment(
    process.env.PAYPAL_CLIENT_ID,
    process.env.PAYPAL_CLIENT_SECRET
  );
}

const paypalConfig = {
  client: new paypal.core.PayPalHttpClient(paypalEnvironment),
  environment: paypalEnvironment,
  webhookId: process.env.PAYPAL_WEBHOOK_ID,
};

// VNPay configuration
const vnpayConfig = {
  tmnCode: process.env.VNPAY_TMN_CODE,
  hashSecret: process.env.VNPAY_HASH_SECRET,
  url: process.env.VNPAY_URL,
  returnUrl: process.env.VNPAY_RETURN_URL,
};

module.exports = {
  stripeConfig,
  paypalConfig,
  vnpayConfig,
};
