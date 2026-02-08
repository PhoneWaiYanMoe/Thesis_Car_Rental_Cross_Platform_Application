const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const pool = require("../config/database");
const otpService = require("../services/otp_service");
const eventPublisher = require("../services/event_publisher");
const oauthService = require("../services/oauth_service");

class AuthController {
  async register(req, res, next) {
    try {
      const { email, fullName, password, role } = req.body;

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
        [userId, email, passwordHash, fullName, role || "customer", false]
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

  async verifyEmailOTP(req, res, next) {
    try {
      const { email, code } = req.body;

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

      const token = jwt.sign(
        { userId: user.user_id, email: user.email, role: user.role, fullName: user.full_name, phone: user.phone, avatarUrl: user.avatar_url},
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      const refreshToken = jwt.sign(
        { userId: user.user_id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
      );

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

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      console.log(`🔐 Login attempt for: ${email}`);

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

      if (!user.is_verified) {
        console.log(`❌ Email not verified: ${email}`);
        return res.status(403).json({
          error: "Please verify your email before logging in",
          needsVerification: true,
          email: email,
        });
      }

      if (!user.password_hash) {
        console.log(`❌ No password set (OAuth user): ${email}`);
        return res.status(401).json({
          error:
            "This account uses social login. Please use Google/Facebook to sign in.",
          isOAuthUser: true,
        });
      }

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

      const token = jwt.sign(
        { userId: user.user_id, email: user.email, role: user.role, fullName: user.full_name, phone: user.phone, avatarUrl: user.avatar_url},
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

  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      console.log("Forgot password request for:", email);

      const result = await pool.query("SELECT * FROM users WHERE email = $1", [
        email,
      ]);

      if (result.rows.length === 0) {
        return res.json({
          message: "If the email exists, a reset code has been sent",
        });
      }

      const otp = otpService.generateOTP();
      await otpService.storeOTP(email, otp, "password_reset");

      console.log("Reset OTP Code:", otp);

      // ✅ Publish event to RabbitMQ (Notification service will send email)
      await eventPublisher.publishPasswordResetRequested(email, otp);

      res.json({
        message: "Reset code sent",
        ...(process.env.NODE_ENV === "development" && { otp }),
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      next(error);
    }
  }

  async verifyResetOTP(req, res, next) {
    try {
      const { email, code } = req.body;

      const isValid = await otpService.verifyOTP(email, code, "password_reset");

      if (!isValid) {
        return res.status(400).json({
          error: "Invalid or expired OTP",
        });
      }

      await otpService.markAsVerified(email, "password_reset");

      res.json({
        message: "Verified - proceed to reset",
      });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { email, newPassword, confirmNewPassword } = req.body;

      console.log(`🔄 Reset password request for: ${email}`);

      if (newPassword !== confirmNewPassword) {
        return res.status(400).json({
          error: "Passwords do not match",
        });
      }

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

      const passwordHash = await bcrypt.hash(newPassword, 10);

      await pool.query(
        "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE email = $2",
        [passwordHash, email]
      );

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

  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ error: "Refresh token required" });
      }

      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

      const result = await pool.query(
        "SELECT user_id, email, role FROM users WHERE user_id = $1",
        [decoded.userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const user = result.rows[0];

      const newToken = jwt.sign(
        { userId: user.user_id, email: user.email, role: user.role, fullName: user.full_name, phone: user.phone, avatarUrl: user.avatar_url},
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

  // ✅ Social login placeholder (now deprecated in favor of OAuth flow)
  async socialLogin(req, res, next) {
    try {
      res.status(410).json({
        error:
          "This endpoint is deprecated. Use /auth/google or /auth/facebook instead",
        hint: "Redirect users to GET /auth/google or GET /auth/facebook",
      });
    } catch (error) {
      next(error);
    }
  }

  // OAuth callbacks
  async googleCallback(req, res) {
    try {
      const oauthData = req.user;

      console.log("Google callback received:", oauthData.email);

      const user = await oauthService.findOrCreateOAuthUser(oauthData);

      const { accessToken, refreshToken } = oauthService.generateTokens(user);

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

  async facebookCallback(req, res) {
    try {
      const oauthData = req.user;

      console.log("Facebook callback received:", oauthData.email);

      const user = await oauthService.findOrCreateOAuthUser(oauthData);
      const { accessToken, refreshToken } = oauthService.generateTokens(user);

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

  async linkGoogleCallback(req, res) {
    try {
      const oauthData = req.user.oauthData;
      const userId = req.user.userId;

      console.log(`Linking Google account to user: ${userId}`);

      const result = await oauthService.linkOAuthAccount(userId, oauthData);

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

      const result = await oauthService.linkOAuthAccount(userId, oauthData);

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

  async getLinkedAccounts(req, res, next) {
    try {
      const userId = req.user.userId;

      const providers = await oauthService.getLinkedProviders(userId);

      res.json({
        linkedAccounts: providers,
      });
    } catch (error) {
      next(error);
    }
  }

  async unlinkAccount(req, res, next) {
    try {
      const userId = req.user.userId;
      const { provider } = req.params;

      if (!["google", "facebook"].includes(provider)) {
        return res.status(400).json({ error: "Invalid provider" });
      }

      const result = await oauthService.unlinkOAuthAccount(userId, provider);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
