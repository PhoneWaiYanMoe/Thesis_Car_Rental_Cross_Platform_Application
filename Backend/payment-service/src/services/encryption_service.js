const crypto = require("crypto");

class EncryptionService {
  constructor() {
    this.algorithm = "aes-256-cbc";
    this.key = Buffer.from(
      process.env.ENCRYPTION_KEY || "0".repeat(32),
      "utf8"
    );
    this.iv = Buffer.from(process.env.ENCRYPTION_IV || "0".repeat(16), "utf8");
  }

  /**
   * Encrypt sensitive data (e.g., payment method tokens)
   */
  encrypt(text) {
    try {
      const cipher = crypto.createCipheriv(this.algorithm, this.key, this.iv);
      let encrypted = cipher.update(text, "utf8", "hex");
      encrypted += cipher.final("hex");
      return encrypted;
    } catch (error) {
      console.error("❌ Encryption error:", error);
      throw new Error("Encryption failed");
    }
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(encryptedText) {
    try {
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.key,
        this.iv
      );
      let decrypted = decipher.update(encryptedText, "hex", "utf8");
      decrypted += decipher.final("utf8");
      return decrypted;
    } catch (error) {
      console.error("❌ Decryption error:", error);
      throw new Error("Decryption failed");
    }
  }

  /**
   * Hash data (one-way, for verification)
   */
  hash(text) {
    return crypto.createHash("sha256").update(text).digest("hex");
  }

  /**
   * Generate secure random token
   */
  generateToken(length = 32) {
    return crypto.randomBytes(length).toString("hex");
  }

  /**
   * Verify HMAC signature (for webhooks)
   */
  verifyHmacSignature(data, signature, secret) {
    const hmac = crypto.createHmac("sha256", secret);
    const expectedSignature = hmac.update(data).digest("hex");
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }
}

module.exports = new EncryptionService();
