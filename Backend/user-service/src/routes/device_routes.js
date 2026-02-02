// Backend/user-service/src/routes/device_routes.js
const express = require("express");
const router = express.Router();
const deviceController = require("../controllers/device_controller");
const { authenticate } = require("../middleware/auth");
const { optionalAuth } = require("../middleware/auth");

// Register/update device (requires authentication)
router.post("/", authenticate, deviceController.registerDevice);

// Get current user's devices
router.get("/", authenticate, deviceController.getMyDevices);

// Delete device (requires authentication)
router.delete("/:deviceId", authenticate, deviceController.deleteDevice);

// Deactivate device
router.put(
  "/:deviceId/deactivate",
  authenticate,
  deviceController.deactivateDevice,
);

// Delete device by FCM token (for notification service cleanup - no auth required)
router.delete("/token/:fcmToken", deviceController.deleteDeviceByToken);

module.exports = router;
