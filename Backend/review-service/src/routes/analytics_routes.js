// Backend/review-service/src/routes/analytics_routes.js
const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analytics_controller");
const {
  authenticate,
  requireAdmin,
  requireOwner,
} = require("../middleware/auth");

// ==================== ANALYTICS ROUTES ====================

/**
 * GET /analytics/reviews/owner/:ownerId/stats?timeRange=30d
 * Get review statistics for owner and their vehicles
 * Access: Owner (own data) or Admin
 */
router.get(
  "/reviews/owner/:ownerId/stats",
  authenticate,
  (req, res, next) => {
    // Allow access if user is the owner or admin
    if (req.user.userId !== req.params.ownerId && req.user.role !== "admin") {
      return res.status(403).json({
        error: "Unauthorized to view these statistics",
      });
    }
    next();
  },
  (req, res, next) => analyticsController.getOwnerReviewStats(req, res, next),
);

/**
 * GET /analytics/reviews/vehicle/:vehicleId/stats?timeRange=30d
 * Get review statistics for a specific vehicle
 * Access: Owner or Admin (ownership verified in controller if needed)
 */
router.get(
  "/reviews/vehicle/:vehicleId/stats",
  authenticate,
  (req, res, next) => analyticsController.getVehicleReviewStats(req, res, next),
);

/**
 * GET /analytics/reviews/platform/stats?timeRange=30d
 * Platform-wide review statistics
 * Access: Admin only
 */
router.get(
  "/reviews/platform/stats",
  authenticate,
  requireAdmin,
  (req, res, next) =>
    analyticsController.getPlatformReviewStats(req, res, next),
);

module.exports = router;
