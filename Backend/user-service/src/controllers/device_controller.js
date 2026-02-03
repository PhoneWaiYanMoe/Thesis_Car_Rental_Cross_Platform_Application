// Backend/user-service/src/controllers/device_controller.js
const pool = require("../config/database");

class DeviceController {
  /**
   * POST /devices
   * Register a new device for push notifications
   */
  async registerDevice(req, res, next) {
    try {
      const userId = req.user.userId;
      const { fcmToken, platform, deviceName, appVersion, osVersion } =
        req.body;

      if (!fcmToken || !platform) {
        return res.status(400).json({
          error: "fcmToken and platform are required",
        });
      }

      // Validate platform
      if (!["android", "ios", "web"].includes(platform)) {
        return res.status(400).json({
          error: "Platform must be android, ios, or web",
        });
      }

      // Check if device already exists
      const existing = await pool.query(
        "SELECT id FROM user_devices WHERE user_id = $1 AND fcm_token = $2",
        [userId, fcmToken],
      );

      if (existing.rows.length > 0) {
        // Update existing device
        const result = await pool.query(
          `UPDATE user_devices 
           SET 
             device_name = $1,
             platform = $2,
             app_version = $3,
             os_version = $4,
             is_active = TRUE,
             last_used_at = NOW(),
             updated_at = NOW()
           WHERE id = $5
           RETURNING *`,
          [deviceName, platform, appVersion, osVersion, existing.rows[0].id],
        );

        console.log(`✅ Device updated for user ${userId}`);

        return res.json({
          success: true,
          message: "Device updated",
          device: {
            id: result.rows[0].id,
            fcmToken: result.rows[0].fcm_token,
            platform: result.rows[0].platform,
          },
        });
      }

      // Insert new device
      const result = await pool.query(
        `INSERT INTO user_devices (user_id, fcm_token, platform, device_name, app_version, os_version)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [userId, fcmToken, platform, deviceName, appVersion, osVersion],
      );

      console.log(`✅ New device registered for user ${userId}`);

      res.status(201).json({
        success: true,
        message: "Device registered",
        device: {
          id: result.rows[0].id,
          fcmToken: result.rows[0].fcm_token,
          platform: result.rows[0].platform,
        },
      });
    } catch (error) {
      if (error.code === "23505") {
        // Unique constraint violation
        return res.status(409).json({
          error: "Device already registered",
        });
      }
      console.error("Register device error:", error);
      next(error);
    }
  }

  /**
   * GET /users/:userId/devices
   * Get all devices for a user (used by notification service)
   */
  async getUserDevices(req, res, next) {
    try {
      const { userId } = req.params;

      const result = await pool.query(
        `SELECT 
          id,
          fcm_token,
          platform,
          device_name,
          is_active,
          last_used_at,
          created_at
         FROM user_devices
         WHERE user_id = $1 AND is_active = TRUE
         ORDER BY last_used_at DESC`,
        [userId],
      );

      res.json({
        success: true,
        devices: result.rows.map((device) => ({
          id: device.id,
          fcmToken: device.fcm_token,
          platform: device.platform,
          deviceName: device.device_name,
          lastUsed: device.last_used_at,
        })),
      });
    } catch (error) {
      console.error("Get user devices error:", error);
      next(error);
    }
  }

  /**
   * GET /devices
   * Get current user's devices
   */
  async getMyDevices(req, res, next) {
    try {
      const userId = req.user.userId;

      const result = await pool.query(
        `SELECT 
          id,
          device_name,
          platform,
          app_version,
          os_version,
          is_active,
          last_used_at,
          created_at
         FROM user_devices
         WHERE user_id = $1
         ORDER BY last_used_at DESC`,
        [userId],
      );

      res.json({
        devices: result.rows,
      });
    } catch (error) {
      console.error("Get my devices error:", error);
      next(error);
    }
  }

  /**
   * DELETE /devices/:deviceId
   * Delete a device (invalidate token)
   */
  async deleteDevice(req, res, next) {
    try {
      const { deviceId } = req.params;

      // Check if requester is authenticated
      const userId = req.user?.userId;

      let result;
      if (userId) {
        // User deleting their own device
        result = await pool.query(
          "DELETE FROM user_devices WHERE id = $1 AND user_id = $2 RETURNING id",
          [deviceId, userId],
        );
      } else {
        // System/notification service deleting invalid token
        result = await pool.query(
          "DELETE FROM user_devices WHERE id = $1 RETURNING id",
          [deviceId],
        );
      }

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: "Device not found",
        });
      }

      console.log(`✅ Device deleted: ${deviceId}`);

      res.json({
        success: true,
        message: "Device deleted",
      });
    } catch (error) {
      console.error("Delete device error:", error);
      next(error);
    }
  }

  /**
   * PUT /devices/:deviceId/deactivate
   * Deactivate a device without deleting it
   */
  async deactivateDevice(req, res, next) {
    try {
      const userId = req.user.userId;
      const { deviceId } = req.params;

      const result = await pool.query(
        `UPDATE user_devices 
         SET is_active = FALSE, updated_at = NOW() 
         WHERE id = $1 AND user_id = $2
         RETURNING id`,
        [deviceId, userId],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: "Device not found",
        });
      }

      console.log(`✅ Device deactivated: ${deviceId}`);

      res.json({
        success: true,
        message: "Device deactivated",
      });
    } catch (error) {
      console.error("Deactivate device error:", error);
      next(error);
    }
  }

  /**
   * DELETE /devices/token/:fcmToken
   * Delete device by FCM token (used by notification service for cleanup)
   */
  async deleteDeviceByToken(req, res, next) {
    try {
      const { fcmToken } = req.params;

      const result = await pool.query(
        "DELETE FROM user_devices WHERE fcm_token = $1 RETURNING id",
        [fcmToken],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Device not found",
        });
      }

      console.log(
        `✅ Device deleted by token: ${fcmToken.substring(0, 20)}...`,
      );

      res.json({
        success: true,
        message: "Device deleted",
      });
    } catch (error) {
      console.error("Delete device by token error:", error);
      next(error);
    }
  }
}

module.exports = new DeviceController();
