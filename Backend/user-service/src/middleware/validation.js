const { body, validationResult } = require("express-validator");

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

exports.validateRegister = [
  body("email").isEmail().normalizeEmail(),
  body("fullName").trim().isLength({ min: 2, max: 100 }),
  body("password")
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  body("confirmPassword").custom(
    (value, { req }) => value === req.body.password
  ),
  handleValidationErrors,
];

exports.validateLogin = [
  body("email").isEmail().normalizeEmail(),
  body("password").notEmpty(),
  handleValidationErrors,
];

exports.validateEmail = [
  body("email").isEmail().normalizeEmail(),
  handleValidationErrors,
];

exports.validateOTP = [
  body("email").isEmail().normalizeEmail(),
  body("code").isLength({ min: 6, max: 6 }).isNumeric(),
  handleValidationErrors,
];

exports.validateResetPassword = [
  body("email").isEmail().normalizeEmail(),
  body("newPassword").isLength({ min: 8 }),
  body("confirmNewPassword").custom(
    (value, { req }) => value === req.body.newPassword
  ),
  handleValidationErrors,
];
