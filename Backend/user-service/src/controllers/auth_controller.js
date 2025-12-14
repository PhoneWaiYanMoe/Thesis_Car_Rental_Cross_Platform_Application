const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const pool = require("../config/database");
const emailService = require("../services/email_service");
const otpService = require("../services/otp_service");

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

      // Try to send email (don't fail in development)
      try {
        await emailService.sendOTPEmail(email, otp, "Email Verification");
        console.log("Email sent");
      } catch (emailError) {
        console.error("Email failed:", emailError.message);
        console.log("Using mock email mode - OTP:", otp);
      }

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

      //Find user
      const result = await pool.query("SELECT * FROM users WHERE email = $1", [
        email,
      ]);

      if (result.rows.length === 0) {
        return res.status(401).json({
          error: "Invalid email or password",
        });
      }

      const user = result.rows[0];

      //Check if verified
      if (!user.is_verified) {
        return res.status(403).json({
          error: "Please verify your email first",
        });
      }

      //Verify password
      const isPasswordValid = await bcrypt.compare(
        password,
        user.password_hash
      );

      if (!isPasswordValid) {
        return res.status(401).json({
          error: "Invalid email or password",
        });
      }

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

      // Try to send email (don't fail in development)
      try {
        await emailService.sendOTPEmail(email, otp, "Password Reset");
        console.log("Email sent");
      } catch (emailError) {
        console.error("Email failed:", emailError.message);
        console.log("Using mock email mode - OTP:", otp);
      }

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
      const { email, newPassword } = req.body;

      //Check if OTP was verified
      const isVerified = await otpService.checkVerified(
        email,
        "password_reset"
      );

      if (!isVerified) {
        return res.status(400).json({
          error: "Please verify OTP first",
        });
      }

      //Hash new password
      const passwordHash = await bcrypt.hash(newPassword, 10);

      //Update password
      await pool.query(
        "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE email = $2",
        [passwordHash, email]
      );

      //Delete OTP
      await otpService.deleteOTP(email, "password_reset");

      res.json({
        message: "Password updated successfully",
      });
    } catch (error) {
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
}

module.exports = new AuthController();
