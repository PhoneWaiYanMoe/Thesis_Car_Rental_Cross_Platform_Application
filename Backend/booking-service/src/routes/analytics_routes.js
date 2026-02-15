// Backend/booking-service/src/routes/analytics_routes.js
const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analytics_controller");
const {
  authenticate,
  requireAdmin,
  requireOwner,
} = require("../middleware/auth");

// Platform-wide stats (Admin only)
router.get("/bookings/stats", authenticate, requireAdmin, (req, res, next) =>
  analyticsController.getPlatformStats(req, res, next),
);

// Owner stats (Owner accessing their own data)
router.get(
  "/bookings/owner/:ownerId/stats",
  authenticate,
  requireOwner,
  (req, res, next) => analyticsController.getOwnerStats(req, res, next),
);

// Vehicle stats (Owner accessing their vehicle data)
router.get(
  "/bookings/vehicle/:vehicleId/stats",
  authenticate,
  requireOwner,
  (req, res, next) => analyticsController.getVehicleStats(req, res, next),
);

router.get(
  "/bookings/owner/analytics",
  authenticate,
  requireOwner,
  (req, res, next) => analyticsController.getBookingAnalyticsOwner(req, res, next),
);

module.exports = router;
