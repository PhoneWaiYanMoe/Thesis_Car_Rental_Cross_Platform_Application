// Backend/payment-service/src/routes/analytics_routes.js
const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/payment_analytics_controller");
const { authenticate, requireAdmin } = require("../middleware/auth");

// ==================== ANALYTICS ROUTES ====================

/**
 * GET /analytics/payments/revenue?timeRange=30d
 * Platform-wide revenue statistics
 * Access: Admin only
 */
router.get("/payments/revenue", authenticate, requireAdmin, (req, res, next) =>
  analyticsController.getPlatformRevenue(req, res, next),
);

/**
 * GET /analytics/payments/detailed
 * Detailed payment analytics with filters
 * Access: Admin only
 */
router.get("/payments/detailed", authenticate, requireAdmin, (req, res, next) =>
  analyticsController.getDetailedPaymentAnalytics(req, res, next),
);

/**
 * GET /analytics/payments/owner/:ownerId/revenue?timeRange=30d
 * Owner revenue statistics
 * Access: Owner (own data) or Admin
 */
router.get(
  "/payments/owner/:ownerId/revenue",
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
  (req, res, next) => analyticsController.getOwnerRevenue(req, res, next),
);

/**
 * GET /analytics/payments/vehicle/:vehicleId/revenue?timeRange=30d
 * Vehicle revenue statistics
 * Access: Owner or Admin (ownership verified in controller if needed)
 */
router.get(
  "/payments/vehicle/:vehicleId/revenue",
  authenticate,
  (req, res, next) => analyticsController.getVehicleRevenue(req, res, next),
);

module.exports = router;
