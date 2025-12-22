const { body, validationResult } = require("express-validator");

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

exports.validateVehicleReview = [
  body("bookingId").notEmpty().withMessage("Booking ID is required"),
  body("vehicleId").notEmpty().withMessage("Vehicle ID is required"),
  body("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),
  body("comment")
    .optional()
    .isLength({ max: 1000 })
    .withMessage("Comment must be less than 1000 characters"),
  body("photos").optional().isArray().withMessage("Photos must be an array"),
  handleValidationErrors,
];

exports.validateOwnerReview = [
  body("bookingId").notEmpty().withMessage("Booking ID is required"),
  body("ownerId").notEmpty().withMessage("Owner ID is required"),
  body("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),
  body("comment")
    .optional()
    .isLength({ max: 1000 })
    .withMessage("Comment must be less than 1000 characters"),
  body("aspects")
    .optional()
    .isObject()
    .withMessage("Aspects must be an object"),
  body("aspects.communication")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("Communication rating must be between 1 and 5"),
  body("aspects.reliability")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("Reliability rating must be between 1 and 5"),
  body("aspects.carCondition")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("Car condition rating must be between 1 and 5"),
  handleValidationErrors,
];
