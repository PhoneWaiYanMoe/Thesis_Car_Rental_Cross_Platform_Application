// Backend/booking-service/src/middleware/validation.js
const { body, validationResult } = require("express-validator");

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

exports.validateBooking = [
  body("vehicleId").notEmpty().withMessage("Vehicle ID is required"),
  body("startDate").isISO8601().withMessage("Valid start date is required"),
  body("endDate").isISO8601().withMessage("Valid end date is required"),
  body("pickupLocation").isObject().withMessage("Pickup location is required"),
  body("dropoffLocation").isObject().withMessage("Dropoff location is required"),
  body("insuranceCoverage").isInt({ min: 0, max: 100 }).withMessage("Insurance coverage must be between 0-100"),
  // ✅ REMOVED: paymentMethodId validation (it's optional for VNPay)
  body("provider").isIn(['stripe', 'paypal', 'vnpay']).withMessage("Valid payment provider is required"),
  handleValidationErrors,
];