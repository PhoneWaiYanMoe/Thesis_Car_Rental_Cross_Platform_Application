const express = require("express");
const router = express.Router();
const passport = require('../config/passport');

const authController = require("../controllers/auth_controller");
const {
  validateRegister,
  validateLogin,
  validateEmail,
  validateOTP,
  validateResetPassword,
} = require("../middleware/validation");
const { authenticate } = require("../middleware/auth");
const { authenticatedOAuthLink } = require("../middleware/oauth_link");

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

// GOOGLE OAUTH (LOGIN)

// Step 1: Redirect user to Google
router.get('/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false 
  })
);

// Step 2: Google redirects back here after authorization
router.get('/google/callback',
  passport.authenticate('google', { 
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_auth_failed`
  }),
  authController.googleCallback
);

// FACEBOOK OAUTH (LOGIN)

// Step 1: Redirect user to Facebook
router.get('/facebook',
  passport.authenticate('facebook', { 
    scope: ['email'],
    session: false 
  })
);

// Step 2: Facebook redirects back here after authorization
router.get('/facebook/callback',
  passport.authenticate('facebook', { 
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=facebook_auth_failed`
  }),
  authController.facebookCallback
);

// LINK OAUTH TO EXISTING ACCOUNT

// Link Google to logged-in user's account
router.get('/link/google',
  authenticatedOAuthLink('google'),
  authController.linkGoogleCallback
);

// Link Facebook to logged-in user's account
router.get('/link/facebook',
  authenticatedOAuthLink('facebook'),
  authController.linkFacebookCallback
);

// Get list of linked accounts (protected route)
router.get('/linked-accounts', 
  authenticate, 
  authController.getLinkedAccounts
);

// Unlink OAuth account (protected route)
router.delete('/unlink/:provider', 
  authenticate, 
  authController.unlinkAccount
);

module.exports = router;
