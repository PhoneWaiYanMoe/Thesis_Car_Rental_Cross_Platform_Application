// Backend/payment-service/src/routes/webhook_routes.js
// ✅ FIXED: Remove duplicate raw body parser

const express = require("express");
const router = express.Router();
const webhookController = require("../controllers/webhook_controller");
const {
  verifyStripeWebhook,
  verifyPayPalWebhook,
  verifyVNPayWebhook,
} = require("../middleware/webhook_verify");

// ✅ Stripe webhook - raw body is already handled in app.js
router.post(
  "/stripe",
  verifyStripeWebhook,
  webhookController.handleStripeWebhook.bind(webhookController)
);

// PayPal webhook
router.post(
  "/paypal",
  verifyPayPalWebhook,
  webhookController.handlePayPalWebhook.bind(webhookController)
);

// VNPay webhook (GET request for return URL)
router.get(
  "/vnpay",
  verifyVNPayWebhook,
  webhookController.handleVNPayReturn.bind(webhookController)
);

module.exports = router;
