const { body, param, query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    return res.status(400).json({
      error: firstError.msg,
      field: firstError.path,
    });
  }
  next();
};

// Payment method validation
exports.validateAddPaymentMethod = [
  body('provider')
    .isIn(['stripe', 'paypal', 'vnpay'])
    .withMessage('Invalid payment provider'),
  body('token')
    .notEmpty()
    .withMessage('Payment method token is required'),
  handleValidationErrors,
];

// Payment intent validation
exports.validateCreateIntent = [
  body('bookingId')
    .isUUID()
    .withMessage('Valid booking ID is required'),
  body('provider')
    .isIn(['stripe', 'paypal', 'vnpay'])
    .withMessage('Invalid payment provider'),
  handleValidationErrors,
];

// Refund validation
exports.validateRefund = [
  body('bookingId')
    .isUUID()
    .withMessage('Valid booking ID is required'),
  body('amount')
    .isInt({ min: 1 })
    .withMessage('Valid refund amount is required'),
  body('reason')
    .isIn(['customer_cancellation', 'owner_rejection', 'dispute_resolution', 'system_error'])
    .withMessage('Invalid refund reason'),
  handleValidationErrors,
];