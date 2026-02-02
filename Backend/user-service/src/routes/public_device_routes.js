// Backend/user-service/src/routes/public_device_routes.js
const express = require("express");
const router = express.Router();
const deviceController = require("../controllers/device_controller");

// Get user devices (used by notification service)
// This is a public API for internal microservice communication
router.get("/:userId/devices", deviceController.getUserDevices);

module.exports = router;
