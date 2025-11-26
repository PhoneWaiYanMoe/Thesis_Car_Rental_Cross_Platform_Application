const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth_controller");
const {
  validateRegister,
  validateLogin,
  validateEmail,
  validateOTP,
  validateResetPassword,
} = require("../middleware/validation");
const { authenticate } = require("../middleware/auth");

router.post("/register", validateRegister, authController.register);
router.post("/verify-email-otp", validateOTP, authController.verifyEmailOTP);
router.post("/login", validateLogin, authController.login);
router.post("/forgot-password", validateEmail, authController.forgotPassword);
router.post("/verify-reset-otp", validateOTP, authController.verifyResetOTP);
router.post(
  "/reset-password",
  validateResetPassword,
  authController.resetPassword
);
router.post("/refresh-token", authController.refreshToken);
router.post("/social-login", authController.socialLogin);

// Protected routes
router.post("/logout", authenticate, authController.logout);

module.exports = router;
