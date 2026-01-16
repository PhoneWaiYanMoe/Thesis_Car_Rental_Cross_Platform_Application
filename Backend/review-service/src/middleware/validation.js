// Backend/review-service/src/middleware/validation.js
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
  body("bookingId")
    .notEmpty()
    .withMessage("Booking ID is required")
    .isString()
    .withMessage("Booking ID must be a string"),

  body("vehicleId")
    .notEmpty()
    .withMessage("Vehicle ID is required")
    .isString()
    .withMessage("Vehicle ID must be a string"),

  body("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),

  body("comment")
    .optional()
    .isString()
    .withMessage("Comment must be a string")
    .isLength({ max: 1000 })
    .withMessage("Comment must be less than 1000 characters")
    .trim(),

  body("photos")
    .optional()
    .isArray()
    .withMessage("Photos must be an array")
    .custom((value) => {
      if (value && value.length > 10) {
        throw new Error("Maximum 10 photos allowed");
      }
      return true;
    }),

  body("photos.*")
    .optional()
    .isString()
    .withMessage("Each photo must be a valid URL string")
    .isURL()
    .withMessage("Each photo must be a valid URL"),

  handleValidationErrors,
];

exports.validateOwnerReview = [
  body("bookingId")
    .notEmpty()
    .withMessage("Booking ID is required")
    .isString()
    .withMessage("Booking ID must be a string"),

  body("ownerId")
    .notEmpty()
    .withMessage("Owner ID is required")
    .isString()
    .withMessage("Owner ID must be a string"),

  body("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),

  body("comment")
    .optional()
    .isString()
    .withMessage("Comment must be a string")
    .isLength({ max: 1000 })
    .withMessage("Comment must be less than 1000 characters")
    .trim(),

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

exports.validateReviewResponse = [
  body("response")
    .notEmpty()
    .withMessage("Response text is required")
    .isString()
    .withMessage("Response must be a string")
    .isLength({ min: 10, max: 500 })
    .withMessage("Response must be between 10 and 500 characters")
    .trim(),

  handleValidationErrors,
];

exports.validateReportReview = [
  body("reason")
    .notEmpty()
    .withMessage("Report reason is required")
    .isIn(["spam", "offensive", "inappropriate", "fake"])
    .withMessage("Invalid report reason"),

  body("details")
    .optional()
    .isString()
    .withMessage("Details must be a string")
    .isLength({ max: 500 })
    .withMessage("Details must be less than 500 characters")
    .trim(),

  handleValidationErrors,
];
