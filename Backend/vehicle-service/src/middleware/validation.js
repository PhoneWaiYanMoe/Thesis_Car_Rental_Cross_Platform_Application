const { body, validationResult } = require("express-validator");

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

exports.validateCreateVehicle = [
  body("name").trim().isLength({ min: 2, max: 100 }),
  body("vehicleType").isIn(['Sedan', 'SUV', 'Hatchback', 'Van', 'Other']),
  body("seater").isInt({ min: 4, max: 9 }),
  body("fuelType").isIn(['Gasoline', 'Diesel', 'Electric', 'Hybrid', 'Other']),
  body("transmission").isIn(['Automatic', 'Manual', 'Semi-Auto']),
  body("year").isInt({ min: 1990, max: new Date().getFullYear() + 1 }),
  body("pricePerDay").isFloat({ min: 0 }),
  body("location").optional().trim(),
  handleValidationErrors,
];

exports.validateUpdateVehicle = [
  body("name").optional().trim().isLength({ min: 2, max: 100 }),
  body("vehicleType").optional().isIn(['Sedan', 'SUV', 'Hatchback', 'Van', 'Other']),
  body("seater").optional().isInt({ min: 4, max: 9 }),
  body("fuelType").optional().isIn(['Gasoline', 'Diesel', 'Electric', 'Hybrid', 'Other']),
  body("transmission").optional().isIn(['Automatic', 'Manual', 'Semi-Auto']),
  body("year").optional().isInt({ min: 1990, max: new Date().getFullYear() + 1 }),
  body("pricePerDay").optional().isFloat({ min: 0 }),
  handleValidationErrors,
];

exports.validateStatus = [
  body("status").isIn(['normal', 'stopped', 'banned']),
  handleValidationErrors,
];