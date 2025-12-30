// Backend/user-service/src/controllers/user_controller.js
const pool = require("../config/database");

class UserController {
  /**
   * Get current user's profile
   * Returns complete user info including role and linked OAuth accounts
   */
  async getProfile(req, res, next) {
    try {
      const userId = req.user.userId;

      // Get user from database
      const userResult = await pool.query(
        `SELECT user_id, email, full_name, phone, role, avatar_url, is_verified, created_at 
         FROM users 
         WHERE user_id = $1`,
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const user = userResult.rows[0];

      // Get linked OAuth accounts
      let linkedAccounts = [];
      try {
        const oauthResult = await pool.query(
          `SELECT provider, created_at 
           FROM oauth_accounts 
           WHERE user_id = $1`,
          [userId]
        );
        linkedAccounts = oauthResult.rows.map((row) => ({
          provider: row.provider,
          linkedAt: row.created_at,
        }));
      } catch (error) {
        console.warn("Could not fetch OAuth accounts:", error.message);
      }

      console.log(`✅ Profile loaded for user ${userId}: role=${user.role}`);

      res.json({
        user: {
          id: user.user_id,
          email: user.email,
          fullName: user.full_name,
          phone: user.phone,
          role: user.role, // ✅ IMPORTANT: Include role
          avatarUrl: user.avatar_url,
          isVerified: user.is_verified,
          createdAt: user.created_at,
        },
        linkedAccounts: linkedAccounts,
      });
    } catch (error) {
      console.error("Get profile error:", error);
      next(error);
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(req, res, next) {
    try {
      const userId = req.user.userId;
      const { fullName, phone, avatarUrl } = req.body;

      const result = await pool.query(
        `UPDATE users 
         SET full_name = COALESCE($1, full_name),
             phone = COALESCE($2, phone),
             avatar_url = COALESCE($3, avatar_url),
             updated_at = NOW()
         WHERE user_id = $4
         RETURNING user_id, email, full_name, phone, role, avatar_url, is_verified`,
        [fullName, phone, avatarUrl, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const user = result.rows[0];

      res.json({
        message: "Profile updated successfully",
        user: {
          id: user.user_id,
          email: user.email,
          fullName: user.full_name,
          phone: user.phone,
          role: user.role,
          avatarUrl: user.avatar_url,
          isVerified: user.is_verified,
        },
      });
    } catch (error) {
      console.error("Update profile error:", error);
      next(error);
    }
  }
}

module.exports = new UserController();
