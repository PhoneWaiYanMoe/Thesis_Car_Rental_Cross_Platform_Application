const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const pool = require("../config/database");
const emailService = require("../services/email_service");
const otpService = require("../services/otp_service");
const eventPublisher = require("../services/event_publisher");

class AuthController {
  async register(req, res, next) {
    try {
      const { email, fullName, password } = req.body;

      console.log("Registering user:", email);

      // Check if user exists
      const userExists = await pool.query(
        "SELECT * FROM users WHERE email = $1",
        [email]
      );

      if (userExists.rows.length > 0) {
        return res.status(400).json({
          error: "User already exists with this email",
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);
      const userId = uuidv4();

      // Insert user (unverified)
      const result = await pool.query(
        `INSERT INTO users (user_id, email, password_hash, full_name, role, is_verified) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING user_id, email, full_name`,
        [userId, email, passwordHash, fullName, "customer", false]
      );

      console.log("User created:", result.rows[0]);

      // Generate and store OTP
      const otp = otpService.generateOTP();
      await otpService.storeOTP(email, otp, "email_verification");

      console.log("OTP Code:", otp);

      // ✅ Publish event to RabbitMQ (Notification service will send email)
      await eventPublisher.publishUserRegistered(email, otp, userId);

      res.status(201).json({
        message: "OTP sent to email",
        userId: result.rows[0].user_id,
        // Include OTP in development for testing
        ...(process.env.NODE_ENV === "development" && { otp }),
      });
    } catch (error) {
      console.error("Registration error:", error);
      next(error);
    }
  }

  //Verify email OTP
  async verifyEmailOTP(req, res, next) {
    try {
      const { email, code } = req.body;

      //Verify OTP
      const isValid = await otpService.verifyOTP(
        email,
        code,
        "email_verification"
      );

      if (!isValid) {
        return res.status(400).json({
          error: "Invalid or expired OTP",
        });
      }

      //Update user as verified
      const result = await pool.query(
        `UPDATE users SET is_verified = true, updated_at = NOW() 
         WHERE email = $1 
         RETURNING user_id, email, full_name, phone, avatar_url, role, created_at`,
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const user = result.rows[0];

      //Generate tokens
      const token = jwt.sign(
        { userId: user.user_id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      const refreshToken = jwt.sign(
        { userId: user.user_id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
      );

      //Delete OTP after successful verification
      await otpService.deleteOTP(email, "email_verification");

      res.json({
        token,
        refreshToken,
        user: {
          id: user.user_id,
          email: user.email,
          fullName: user.full_name,
          phone: user.phone,
          avatarUrl: user.avatar_url,
          role: user.role,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  //Login

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      console.log(`🔐 Login attempt for: ${email}`);

      // Find user
      const result = await pool.query("SELECT * FROM users WHERE email = $1", [
        email,
      ]);

      if (result.rows.length === 0) {
        console.log(`❌ User not found: ${email}`);
        return res.status(401).json({
          error: "Invalid email or password",
          debug:
            process.env.NODE_ENV === "development"
              ? "User not found"
              : undefined,
        });
      }

      const user = result.rows[0];

      // Check if verified - WITH BETTER ERROR MESSAGE
      if (!user.is_verified) {
        console.log(`❌ Email not verified: ${email}`);
        return res.status(403).json({
          error: "Please verify your email before logging in",
          needsVerification: true,
          email: email,
        });
      }

      // Check if password exists (for OAuth-only users)
      if (!user.password_hash) {
        console.log(`❌ No password set (OAuth user): ${email}`);
        return res.status(401).json({
          error:
            "This account uses social login. Please use Google/Facebook to sign in.",
          isOAuthUser: true,
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(
        password,
        user.password_hash
      );

      if (!isPasswordValid) {
        console.log(`❌ Invalid password for: ${email}`);
        return res.status(401).json({
          error: "Invalid email or password",
          debug:
            process.env.NODE_ENV === "development"
              ? "Password incorrect"
              : undefined,
        });
      }

      // Generate tokens
      const token = jwt.sign(
        { userId: user.user_id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      const refreshToken = jwt.sign(
        { userId: user.user_id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
      );

      console.log(`✅ Login successful: ${email}`);

      res.json({
        token,
        refreshToken,
        user: {
          id: user.user_id,
          email: user.email,
          fullName: user.full_name,
          phone: user.phone,
          avatarUrl: user.avatar_url,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("❌ Login error:", error);
      next(error);
    }
  }

  //Forgot password
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      console.log("Forgot password request for:", email);

      // Check if user exists
      const result = await pool.query("SELECT * FROM users WHERE email = $1", [
        email,
      ]);

      if (result.rows.length === 0) {
        // Don't reveal if user exists or not (security)
        return res.json({
          message: "If the email exists, a reset code has been sent",
        });
      }

      // Generate and store OTP
      const otp = otpService.generateOTP();
      await otpService.storeOTP(email, otp, "password_reset");

      console.log("Reset OTP Code:", otp);

      // ✅ Publish event to RabbitMQ (Notification service will send email)
      await eventPublisher.publishPasswordResetRequested(email, otp);

      res.json({
        message: "Reset code sent",
        // Include OTP in development for testing
        ...(process.env.NODE_ENV === "development" && { otp }),
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      next(error);
    }
  }

  //Verify reset OTP
  async verifyResetOTP(req, res, next) {
    try {
      const { email, code } = req.body;

      const isValid = await otpService.verifyOTP(email, code, "password_reset");

      if (!isValid) {
        return res.status(400).json({
          error: "Invalid or expired OTP",
        });
      }

      //Mark OTP as verified (but don't delete yet)
      await otpService.markAsVerified(email, "password_reset");

      res.json({
        message: "Verified - proceed to reset",
      });
    } catch (error) {
      next(error);
    }
  }

  //Reset password
  async resetPassword(req, res, next) {
    try {
      const { email, newPassword, confirmNewPassword } = req.body;

      console.log(`🔄 Reset password request for: ${email}`);

      // Validate passwords match
      if (newPassword !== confirmNewPassword) {
        return res.status(400).json({
          error: "Passwords do not match",
        });
      }

      // Check if OTP was verified
      const isVerified = await otpService.checkVerified(
        email,
        "password_reset"
      );

      if (!isVerified) {
        console.log("❌ OTP not verified");
        return res.status(400).json({
          error: "Please verify OTP first",
        });
      }

      // Check if user exists
      const userCheck = await pool.query(
        "SELECT user_id FROM users WHERE email = $1",
        [email]
      );

      if (userCheck.rows.length === 0) {
        console.log("❌ User not found");
        return res.status(404).json({
          error: "User not found",
        });
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, 10);

      // Update password
      await pool.query(
        "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE email = $2",
        [passwordHash, email]
      );

      // Delete OTP after successful password reset
      await otpService.deleteOTP(email, "password_reset");

      console.log("✅ Password updated successfully");

      // ✅ Publish event to RabbitMQ (Notification service will send confirmation email)
      await eventPublisher.publishPasswordChanged(email);

      res.json({
        message: "Password updated successfully",
      });
    } catch (error) {
      console.error("❌ Reset password error:", error);
      next(error);
    }
  }

  //Refresh token
  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ error: "Refresh token required" });
      }

      //Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

      //Get user
      const result = await pool.query(
        "SELECT user_id, email, role FROM users WHERE user_id = $1",
        [decoded.userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const user = result.rows[0];

      const newToken = jwt.sign(
        { userId: user.user_id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.json({
        newToken,
      });
    } catch (error) {
      if (
        error.name === "JsonWebTokenError" ||
        error.name === "TokenExpiredError"
      ) {
        return res.status(401).json({ error: "Invalid refresh token" });
      }
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      res.json({
        message: "Session ended",
      });
    } catch (error) {
      next(error);
    }
  }

  async socialLogin(req, res, next) {
    try {
      const { provider, idToken } = req.body;

      // TODO: Implement Google/Facebook token verification
      res.status(501).json({
        error: "Social login not implemented yet",
      });
    } catch (error) {
      next(error);
    }
  }

  // NEW METHODS FOR OAUTH:

  //  Google OAuth callback
  //  Called by Google after user authorizes

  async googleCallback(req, res) {
    try {
      const oauthData = req.user; // Set by Passport

      console.log("Google callback received:", oauthData.email);

      // Find or create user
      const user =
        await require("../services/oauth_service").findOrCreateOAuthUser(
          oauthData
        );

      // Generate JWT tokens
      const { accessToken, refreshToken } =
        require("../services/oauth_service").generateTokens(user);

      // Redirect to frontend with tokens
      const redirectUrl = `${process.env.FRONTEND_URL}/auth/google/callback?token=${accessToken}&refreshToken=${refreshToken}`;

      console.log("Redirecting to frontend:", redirectUrl);
      res.redirect(redirectUrl);
    } catch (error) {
      console.error("Google OAuth callback error:", error);
      const errorUrl = `${
        process.env.FRONTEND_URL
      }/auth/error?message=${encodeURIComponent(error.message)}`;
      res.redirect(errorUrl);
    }
  }

  /**
   * Facebook OAuth callback
   * Called by Facebook after user authorizes
   */
  async facebookCallback(req, res) {
    try {
      const oauthData = req.user;

      console.log("Facebook callback received:", oauthData.email);

      const user =
        await require("../services/oauth_service").findOrCreateOAuthUser(
          oauthData
        );
      const { accessToken, refreshToken } =
        require("../services/oauth_service").generateTokens(user);

      const redirectUrl = `${process.env.FRONTEND_URL}/auth/facebook/callback?token=${accessToken}&refreshToken=${refreshToken}`;
      res.redirect(redirectUrl);
    } catch (error) {
      console.error("Facebook OAuth callback error:", error);
      const errorUrl = `${
        process.env.FRONTEND_URL
      }/auth/error?message=${encodeURIComponent(error.message)}`;
      res.redirect(errorUrl);
    }
  }

  /**
   * Link OAuth account to currently logged-in user
   * User must be authenticated to use this
   */
  async linkGoogleCallback(req, res) {
    try {
      const oauthData = req.user.oauthData; // Set by middleware
      const userId = req.user.userId; // From JWT token

      console.log(`Linking Google account to user: ${userId}`);

      const result =
        await require("../services/oauth_service").linkOAuthAccount(
          userId,
          oauthData
        );

      const redirectUrl = `${
        process.env.FRONTEND_URL
      }/settings/accounts?status=success&provider=google&message=${encodeURIComponent(
        result.message
      )}`;
      res.redirect(redirectUrl);
    } catch (error) {
      console.error("Link Google error:", error);
      const redirectUrl = `${
        process.env.FRONTEND_URL
      }/settings/accounts?status=error&provider=google&message=${encodeURIComponent(
        error.message
      )}`;
      res.redirect(redirectUrl);
    }
  }

  async linkFacebookCallback(req, res) {
    try {
      const oauthData = req.user.oauthData;
      const userId = req.user.userId;

      console.log(`Linking Facebook account to user: ${userId}`);

      const result =
        await require("../services/oauth_service").linkOAuthAccount(
          userId,
          oauthData
        );

      const redirectUrl = `${
        process.env.FRONTEND_URL
      }/settings/accounts?status=success&provider=facebook&message=${encodeURIComponent(
        result.message
      )}`;
      res.redirect(redirectUrl);
    } catch (error) {
      console.error("Link Facebook error:", error);
      const redirectUrl = `${
        process.env.FRONTEND_URL
      }/settings/accounts?status=error&provider=facebook&message=${encodeURIComponent(
        error.message
      )}`;
      res.redirect(redirectUrl);
    }
  }

  /**
   * Get linked OAuth accounts for current user
   */
  async getLinkedAccounts(req, res, next) {
    try {
      const userId = req.user.userId;

      const providers =
        await require("../services/oauth_service").getLinkedProviders(userId);

      res.json({
        linkedAccounts: providers,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Unlink OAuth provider from account
   */
  async unlinkAccount(req, res, next) {
    try {
      const userId = req.user.userId;
      const { provider } = req.params;

      if (!["google", "facebook"].includes(provider)) {
        return res.status(400).json({ error: "Invalid provider" });
      }

      const result =
        await require("../services/oauth_service").unlinkOAuthAccount(
          userId,
          provider
        );

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // Keep existing socialLogin method or replace it:
  async socialLogin(req, res, next) {
    // This endpoint is now handled by Passport OAuth flow
    res.status(410).json({
      error:
        "This endpoint is deprecated. Use /auth/google or /auth/facebook instead",
    });
  }
}

module.exports = new AuthController();
