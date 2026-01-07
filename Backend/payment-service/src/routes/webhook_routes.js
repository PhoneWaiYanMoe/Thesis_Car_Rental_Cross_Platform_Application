// Backend/payment-service/src/routes/webhook_routes.js
// ✅ FIXED: Properly separated webhook routes

const express = require("express");
const router = express.Router();
const webhookController = require("../controllers/webhook_controller");
const {
  verifyStripeWebhook,
  verifyPayPalWebhook,
  verifyVNPayWebhook,
} = require("../middleware/webhook_verify");

// ✅ IMPORTANT: This router is used in TWO ways in app.js:
// 1. For Stripe: mounted at /payment/webhook/stripe with express.raw()
// 2. For others: mounted at /payment/webhook/* with express.json()

// Stripe webhook - expects raw body (already handled in app.js)
router.post(
  "/",
  verifyStripeWebhook,
  webhookController.handleStripeWebhook.bind(webhookController)
);

// VNPay webhook (GET request for return URL)
router.get(
  "/",
  verifyVNPayWebhook,
  webhookController.handleVNPayReturn.bind(webhookController)
);

// PayPal webhook
router.post(
  "/",
  verifyPayPalWebhook,
  webhookController.handlePayPalWebhook.bind(webhookController)
);

module.exports = router;
