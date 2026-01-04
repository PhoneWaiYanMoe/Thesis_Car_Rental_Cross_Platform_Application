const pool = require("../config/database");
const { v4: uuidv4 } = require("uuid");
const encryptionService = require("../services/encryption_service");

class PaymentMethodController {
  async getPaymentMethods(req, res, next) {
    try {
      const userId = req.user.userId;

      const result = await pool.query(
        `SELECT method_id, provider, type, details, is_default, created_at
         FROM payment_methods
         WHERE user_id = $1 AND is_active = true
         ORDER BY is_default DESC, created_at DESC`,
        [userId]
      );

      const methods = result.rows.map((method) => ({
        id: method.method_id,
        provider: method.provider,
        type: method.type,
        details: method.details,
        isDefault: method.is_default,
        createdAt: method.created_at,
      }));

      const defaultMethod = methods.find((m) => m.isDefault);

      res.json({
        methods,
        default: defaultMethod?.id || null,
      });
    } catch (error) {
      console.error("Get payment methods error:", error);
      next(error);
    }
  }

  async addPaymentMethod(req, res, next) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const userId = req.user.userId;
      const { provider, token, setAsDefault, billingDetails } = req.body;

      // Encrypt the token before storing
      const encryptedToken = encryptionService.encrypt(token);

      const methodId = uuidv4();

      // If setting as default, unset other defaults
      if (setAsDefault) {
        await client.query(
          "UPDATE payment_methods SET is_default = false WHERE user_id = $1",
          [userId]
        );
      }

      // Save payment method
      await client.query(
        `INSERT INTO payment_methods (
          method_id, user_id, provider, provider_method_id,
          type, details, is_default
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          methodId,
          userId,
          provider,
          encryptedToken,
          "card", // Default to card, can be extended
          JSON.stringify(billingDetails || {}),
          setAsDefault || false,
        ]
      );

      await client.query("COMMIT");

      console.log(`✅ Payment method added: ${methodId} (${provider})`);

      res.status(201).json({
        message: "Payment method added successfully",
        method: {
          id: methodId,
          provider,
          isDefault: setAsDefault || false,
        },
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Add payment method error:", error);
      next(error);
    } finally {
      client.release();
    }
  }

  async removePaymentMethod(req, res, next) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const userId = req.user.userId;
      const { id } = req.params;

      // Soft delete
      const result = await client.query(
        `UPDATE payment_methods 
         SET is_active = false, updated_at = NOW()
         WHERE method_id = $1 AND user_id = $2
         RETURNING method_id`,
        [id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Payment method not found" });
      }

      await client.query("COMMIT");

      res.json({ message: "Payment method removed" });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Remove payment method error:", error);
      next(error);
    } finally {
      client.release();
    }
  }

  async setDefaultPaymentMethod(req, res, next) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const userId = req.user.userId;
      const { id } = req.params;

      // Unset all defaults
      await client.query(
        "UPDATE payment_methods SET is_default = false WHERE user_id = $1",
        [userId]
      );

      // Set new default
      const result = await client.query(
        `UPDATE payment_methods 
         SET is_default = true, updated_at = NOW()
         WHERE method_id = $1 AND user_id = $2
         RETURNING method_id`,
        [id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Payment method not found" });
      }

      await client.query("COMMIT");

      res.json({ message: "Default payment method updated" });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Set default payment method error:", error);
      next(error);
    } finally {
      client.release();
    }
  }
}

module.exports = new PaymentMethodController();
