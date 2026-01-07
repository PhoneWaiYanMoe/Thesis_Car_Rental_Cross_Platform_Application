// Backend/payment-service/src/middleware/webhook_verify.js
// ✅ FIXED: Proper raw body handling for Stripe signature verification

const stripeService = require("../services/stripe_service");
const crypto = require("crypto");

exports.verifyStripeWebhook = (req, res, next) => {
  try {
    const signature = req.headers["stripe-signature"];

    if (!signature) {
      console.error("❌ No Stripe signature header found");
      return res.status(400).json({ error: "Missing signature" });
    }

    // ✅ CRITICAL: req.body is already a Buffer from express.raw() in app.js
    const payload = req.body;

    // Verify it's actually a Buffer
    if (!Buffer.isBuffer(payload)) {
      console.error("❌ Request body is not a Buffer!");
      console.error(`   Body type: ${typeof payload}`);
      console.error(`   Body constructor: ${payload?.constructor?.name}`);
      return res.status(400).json({
        error: "Invalid body format",
        details: "Expected raw buffer for webhook verification",
      });
    }

    console.log("🔍 Verifying Stripe webhook...");
    console.log(`   Signature: ${signature.substring(0, 20)}...`);
    console.log(`   Body size: ${payload.length} bytes`);
    console.log(`   Body is Buffer: ${Buffer.isBuffer(payload)}`);

    // Verify the webhook signature
    const event = stripeService.verifyWebhookSignature(payload, signature);

    console.log("✅ Stripe webhook verified successfully");
    console.log(`   Event type: ${event.type}`);
    console.log(`   Event ID: ${event.id}`);

    req.webhookEvent = event;
    next();
  } catch (error) {
    console.error("❌ Stripe webhook verification failed:", error.message);

    // Log more details for debugging
    if (error.type === "StripeSignatureVerificationError") {
      console.error("   This is a signature verification error");
      console.error("   Check that:");
      console.error("   1. STRIPE_WEBHOOK_SECRET is correct in .env");
      console.error("   2. Request body is being passed as raw Buffer");
      console.error("   3. No middleware is modifying the body");
    }

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
