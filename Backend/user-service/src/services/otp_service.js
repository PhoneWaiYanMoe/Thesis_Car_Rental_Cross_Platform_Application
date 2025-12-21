const pool = require("../config/database");

class OTPService {
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async storeOTP(email, code, type) {
    const expiresAt = new Date();
    expiresAt.setMinutes(
      expiresAt.getMinutes() + parseInt(process.env.OTP_EXPIRY_MINUTES || 10)
    );

    await pool.query(
      `INSERT INTO otps (email, code, type, expires_at, is_verified) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (email, type) 
       DO UPDATE SET code = $2, expires_at = $4, is_verified = false, created_at = NOW()`,
      [email, code, type, expiresAt, false]
    );

    console.log(`✅ OTP stored for ${email} (type: ${type})`);
  }

  async verifyOTP(email, code, type) {
    const result = await pool.query(
      `SELECT * FROM otps 
       WHERE email = $1 AND code = $2 AND type = $3 AND expires_at > NOW()`,
      [email, code, type]
    );

    if (result.rows.length > 0) {
      console.log(`✅ OTP verified for ${email}`);
      return true;
    } else {
      console.log(`❌ Invalid or expired OTP for ${email}`);
      return false;
    }
  }

  async markAsVerified(email, type) {
    await pool.query(
      "UPDATE otps SET is_verified = true WHERE email = $1 AND type = $2",
      [email, type]
    );
    console.log(`✅ OTP marked as verified for ${email}`);
  }

  async checkVerified(email, type) {
    const result = await pool.query(
      "SELECT is_verified FROM otps WHERE email = $1 AND type = $2 AND expires_at > NOW()",
      [email, type]
    );

    if (result.rows.length > 0 && result.rows[0].is_verified) {
      console.log(`✅ OTP verification confirmed for ${email}`);
      return true;
    } else {
      console.log(`❌ OTP not verified for ${email}`);
      return false;
    }
  }

  async deleteOTP(email, type) {
    await pool.query("DELETE FROM otps WHERE email = $1 AND type = $2", [
      email,
      type,
    ]);
    console.log(`✅ OTP deleted for ${email} (type: ${type})`);
  }
}

module.exports = new OTPService();
