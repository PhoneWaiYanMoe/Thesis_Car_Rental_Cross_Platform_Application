const express = require('express');
const router = express.Router();
const paymentMethodController = require('../controllers/payment_method_controller');
const { authenticate } = require('../middleware/auth');
const { validateAddPaymentMethod } = require('../middleware/validation');

// All routes require authentication
router.use(authenticate);

router.get('/', paymentMethodController.getPaymentMethods.bind(paymentMethodController));
router.post('/', validateAddPaymentMethod, paymentMethodController.addPaymentMethod.bind(paymentMethodController));
router.delete('/:id', paymentMethodController.removePaymentMethod.bind(paymentMethodController));
router.post('/:id/default', paymentMethodController.setDefaultPaymentMethod.bind(paymentMethodController));

module.exports = router;
