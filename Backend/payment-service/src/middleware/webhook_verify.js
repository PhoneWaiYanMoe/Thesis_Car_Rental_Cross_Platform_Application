const stripeService = require('../services/stripe_service');
const crypto = require('crypto');

exports.verifyStripeWebhook = (req, res, next) => {
  try {
    const signature = req.headers['stripe-signature'];
    const payload = req.rawBody || JSON.stringify(req.body);
    
    const event = stripeService.verifyWebhookSignature(payload, signature);
    req.webhookEvent = event;
    next();
  } catch (error) {
    console.error('❌ Stripe webhook verification failed:', error);
    return res.status(400).json({ error: 'Invalid signature' });
  }
};

exports.verifyPayPalWebhook = (req, res, next) => {
  // PayPal webhook verification
  // Implement based on PayPal's webhook verification process
  req.webhookEvent = req.body;
  next();
};

exports.verifyVNPayWebhook = (req, res, next) => {
  try {
    const vnpayService = require('../services/vnpay_service');
    const result = vnpayService.verifyReturnUrl(req.query);
    
    if (!result.valid) {
      return res.status(400).json({ error: 'Invalid signature' });
    }
    
    req.webhookEvent = result;
    next();
  } catch (error) {
    console.error('❌ VNPay webhook verification failed:', error);
    return res.status(400).json({ error: 'Invalid signature' });
  }
};
