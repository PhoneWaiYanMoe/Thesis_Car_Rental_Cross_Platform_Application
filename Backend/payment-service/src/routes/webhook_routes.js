const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhook_controller');
const {
  verifyStripeWebhook,
  verifyPayPalWebhook,
  verifyVNPayWebhook,
} = require('../middleware/webhook_verify');

// Webhook routes (NO authentication - verified by signature)
router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  verifyStripeWebhook,
  webhookController.handleStripeWebhook.bind(webhookController)
);

router.post(
  '/paypal',
  verifyPayPalWebhook,
  webhookController.handlePayPalWebhook.bind(webhookController)
);

router.get(
  '/vnpay',
  verifyVNPayWebhook,
  webhookController.handleVNPayReturn.bind(webhookController)
);

module.exports = router;