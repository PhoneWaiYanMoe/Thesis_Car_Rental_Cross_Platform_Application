// Backend/user-service/src/controllers/payment_controller.js
const pool = require("../config/database");

class PaymentController {
  /**
   * GET /payments/methods
   * Get all payment methods for current user
   */
  async getPaymentMethods(req, res, next) {
    try {
      const userId = req.user.userId;

      const result = await pool.query(
        `SELECT 
          id,
          type,
          provider,
          card_last_four,
          card_brand,
          card_exp_month,
          card_exp_year,
          bank_account_last_four,
          bank_name,
          holder_name,
          billing_address,
          is_default,
          is_verified,
          status,
          created_at
         FROM payment_methods
         WHERE user_id = $1 AND status = 'active'
         ORDER BY is_default DESC, created_at DESC`,
        [userId],
      );

      res.json({
        paymentMethods: result.rows,
      });
    } catch (error) {
      console.error("Get payment methods error:", error);
      next(error);
    }
  }

  /**
   * GET /payments/methods/:methodId
   * Get single payment method
   */
  async getPaymentMethod(req, res, next) {
    try {
      const userId = req.user.userId;
      const { methodId } = req.params;

      const result = await pool.query(
        `SELECT * FROM payment_methods WHERE id = $1 AND user_id = $2`,
        [methodId, userId],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Payment method not found" });
      }

      res.json({
        paymentMethod: result.rows[0],
      });
    } catch (error) {
      console.error("Get payment method error:", error);
      next(error);
    }
  }

  /**
   * POST /payments/methods
   * Add new payment method
   */
  async addPaymentMethod(req, res, next) {
    const client = await pool.connect();

    try {
      const userId = req.user.userId;
      const {
        type,
        provider,
        providerPaymentMethodId,
        cardLastFour,
        cardBrand,
        cardExpMonth,
        cardExpYear,
        bankAccountLastFour,
        bankName,
        holderName,
        billingAddress,
        isDefault = false,
        metadata,
      } = req.body;

      // Validate type
      const validTypes = [
        "credit_card",
        "debit_card",
        "paypal",
        "bank_account",
        "wallet",
      ];
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          error: `Invalid type. Must be one of: ${validTypes.join(", ")}`,
        });
      }

      await client.query("BEGIN");

      // If setting as default, unset other defaults
      if (isDefault) {
        await client.query(
          "UPDATE payment_methods SET is_default = FALSE WHERE user_id = $1",
          [userId],
        );
      }

      // Insert new payment method
      const result = await client.query(
        `INSERT INTO payment_methods (
          user_id, type, provider, provider_payment_method_id,
          card_last_four, card_brand, card_exp_month, card_exp_year,
          bank_account_last_four, bank_name,
          holder_name, billing_address,
          is_default, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *`,
        [
          userId,
          type,
          provider,
          providerPaymentMethodId,
          cardLastFour,
          cardBrand,
          cardExpMonth,
          cardExpYear,
          bankAccountLastFour,
          bankName,
          holderName,
          billingAddress ? JSON.stringify(billingAddress) : null,
          isDefault,
          metadata ? JSON.stringify(metadata) : null,
        ],
      );

      await client.query("COMMIT");

      console.log(`✅ Payment method added for user ${userId}`);

      res.status(201).json({
        message: "Payment method added",
        paymentMethod: result.rows[0],
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Add payment method error:", error);
      next(error);
    } finally {
      client.release();
    }
  }

  /**
   * PUT /payments/methods/:methodId
   * Update payment method
   */
  async updatePaymentMethod(req, res, next) {
    const client = await pool.connect();

    try {
      const userId = req.user.userId;
      const { methodId } = req.params;
      const {
        cardExpMonth,
        cardExpYear,
        holderName,
        billingAddress,
        isDefault,
      } = req.body;

      await client.query("BEGIN");

      // Verify ownership
      const checkResult = await client.query(
        "SELECT id FROM payment_methods WHERE id = $1 AND user_id = $2",
        [methodId, userId],
      );

      if (checkResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Payment method not found" });
      }

      // If setting as default, unset others
      if (isDefault === true) {
        await client.query(
          "UPDATE payment_methods SET is_default = FALSE WHERE user_id = $1",
          [userId],
        );
      }

      // Build update query dynamically
      const updates = [];
      const params = [];
      let paramCount = 1;

      if (cardExpMonth !== undefined) {
        updates.push(`card_exp_month = $${paramCount}`);
        params.push(cardExpMonth);
        paramCount++;
      }

      if (cardExpYear !== undefined) {
        updates.push(`card_exp_year = $${paramCount}`);
        params.push(cardExpYear);
        paramCount++;
      }

      if (holderName !== undefined) {
        updates.push(`holder_name = $${paramCount}`);
        params.push(holderName);
        paramCount++;
      }

      if (billingAddress !== undefined) {
        updates.push(`billing_address = $${paramCount}`);
        params.push(JSON.stringify(billingAddress));
        paramCount++;
      }

      if (isDefault !== undefined) {
        updates.push(`is_default = $${paramCount}`);
        params.push(isDefault);
        paramCount++;
      }

      updates.push(`updated_at = NOW()`);

      params.push(methodId);
      params.push(userId);

      const result = await client.query(
        `UPDATE payment_methods 
         SET ${updates.join(", ")}
         WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
         RETURNING *`,
        params,
      );

      await client.query("COMMIT");

      console.log(`✅ Payment method updated: ${methodId}`);

      res.json({
        message: "Payment method updated",
        paymentMethod: result.rows[0],
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Update payment method error:", error);
      next(error);
    } finally {
      client.release();
    }
  }

  /**
   * DELETE /payments/methods/:methodId
   * Delete payment method (soft delete by setting status to deleted)
   */
  async deletePaymentMethod(req, res, next) {
    try {
      const userId = req.user.userId;
      const { methodId } = req.params;

      const result = await pool.query(
        `UPDATE payment_methods 
         SET status = 'deleted', updated_at = NOW() 
         WHERE id = $1 AND user_id = $2
         RETURNING id`,
        [methodId, userId],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Payment method not found" });
      }

      console.log(`✅ Payment method deleted: ${methodId}`);

      res.json({
        message: "Payment method deleted",
      });
    } catch (error) {
      console.error("Delete payment method error:", error);
      next(error);
    }
  }

  /**
   * PUT /payments/methods/:methodId/set-default
   * Set payment method as default
   */
  async setDefaultPaymentMethod(req, res, next) {
    const client = await pool.connect();

    try {
      const userId = req.user.userId;
      const { methodId } = req.params;

      await client.query("BEGIN");

      // Verify ownership
      const checkResult = await client.query(
        "SELECT id FROM payment_methods WHERE id = $1 AND user_id = $2 AND status = 'active'",
        [methodId, userId],
      );

      if (checkResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Payment method not found" });
      }

      // Unset all defaults
      await client.query(
        "UPDATE payment_methods SET is_default = FALSE WHERE user_id = $1",
        [userId],
      );

      // Set new default
      await client.query(
        "UPDATE payment_methods SET is_default = TRUE, updated_at = NOW() WHERE id = $1",
        [methodId],
      );

      await client.query("COMMIT");

      console.log(`✅ Default payment method set: ${methodId}`);

      res.json({
        message: "Default payment method updated",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Set default payment method error:", error);
      next(error);
    } finally {
      client.release();
    }
  }

  /**
   * GET /users/:userId/payments/methods
   * Admin endpoint: Get payment methods for any user
   */
  async getUserPaymentMethods(req, res, next) {
    try {
      // Check if requester is admin
      if (req.user.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { userId } = req.params;

      const result = await pool.query(
        `SELECT * FROM payment_methods 
         WHERE user_id = $1 
         ORDER BY is_default DESC, created_at DESC`,
        [userId],
      );

      res.json({
        paymentMethods: result.rows,
      });
    } catch (error) {
      console.error("Get user payment methods error:", error);
      next(error);
    }
  }
}

module.exports = new PaymentController();
