// Backend/payment-service/src/middleware/webhook_verify.js
// ✅ UPDATED: Better Stripe webhook verification

const stripeService = require("../services/stripe_service");
const crypto = require("crypto");

exports.verifyStripeWebhook = (req, res, next) => {
  try {
    const signature = req.headers["stripe-signature"];

    if (!signature) {
      console.error("❌ No Stripe signature header found");
      return res.status(400).json({ error: "Missing signature" });
    }

    // Get raw body
    let payload;
    if (req.rawBody) {
      payload = req.rawBody;
    } else if (Buffer.isBuffer(req.body)) {
      payload = req.body;
    } else {
      payload = JSON.stringify(req.body);
    }

    console.log("🔍 Verifying Stripe webhook...");
    console.log(`   Signature: ${signature.substring(0, 20)}...`);

    const event = stripeService.verifyWebhookSignature(payload, signature);

    console.log("✅ Stripe webhook verified successfully");
    console.log(`   Event type: ${event.type}`);
    console.log(`   Event ID: ${event.id}`);

    req.webhookEvent = event;
    next();
  } catch (error) {
    console.error("❌ Stripe webhook verification failed:", error.message);
    return res.status(400).json({
      error: "Invalid signature",
      message: error.message,
    });
  }
};

exports.verifyPayPalWebhook = (req, res, next) => {
  // PayPal webhook verification
  // For now, just pass through
  console.log("📨 PayPal webhook received (verification not implemented)");
  req.webhookEvent = req.body;
  next();
};

exports.verifyVNPayWebhook = (req, res, next) => {
  try {
    const vnpayService = require("../services/vnpay_service");
    const result = vnpayService.verifyReturnUrl(req.query);

    if (!result.valid) {
      console.error("❌ VNPay signature invalid");
      return res.status(400).json({ error: "Invalid signature" });
    }

    console.log("✅ VNPay return verified");
    req.webhookEvent = result;
    next();
  } catch (error) {
    console.error("❌ VNPay webhook verification failed:", error);
    return res.status(400).json({ error: "Invalid signature" });
  }
};
