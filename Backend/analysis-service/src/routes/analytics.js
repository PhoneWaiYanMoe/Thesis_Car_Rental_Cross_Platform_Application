const express = require("express");
const router = express.Router();
const { authenticateToken, requireRole } = require("../middleware/auth");
const { getCacheKey, getCached, setCached } = require("../utils/cache");
const adminAnalytics = require("../services/adminAnalytics");
const ownerAnalytics = require("../services/ownerAnalytics");

// Admin Analytics Routes
router.get(
  "/admin/dashboard",
  authenticateToken,
  requireRole("admin", "support"),
  async (req, res) => {
    try {
      const { timeRange = "30d" } = req.query;
      const cacheKey = getCacheKey("admin:dashboard", { timeRange });

      // Check cache
      const cached = getCached(cacheKey);
      if (cached) {
        return res.json({
          success: true,
          data: cached,
          cached: true,
        });
      }

      const stats = await adminAnalytics.getDashboardStats(timeRange);

      // Cache for 5 minutes
      setCached(cacheKey, stats, 300);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Error getting admin dashboard:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get dashboard statistics",
        error: error.message,
      });
    }
  },
);

router.get(
  "/admin/bookings",
  authenticateToken,
  requireRole("admin", "support"),
  async (req, res) => {
    try {
      const filters = req.query;
      const analytics = await adminAnalytics.getBookingAnalytics(filters);

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      console.error("Error getting booking analytics:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get booking analytics",
        error: error.message,
      });
    }
  },
);

router.get(
  "/admin/revenue",
  authenticateToken,
  requireRole("admin"),
  async (req, res) => {
    try {
      const filters = req.query;
      const analytics = await adminAnalytics.getRevenueAnalytics(filters);

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      console.error("Error getting revenue analytics:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get revenue analytics",
        error: error.message,
      });
    }
  },
);

router.get(
  "/admin/users",
  authenticateToken,
  requireRole("admin"),
  async (req, res) => {
    try {
      const filters = req.query;
      const analytics = await adminAnalytics.getUserGrowthAnalytics(filters);

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      console.error("Error getting user analytics:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get user analytics",
        error: error.message,
      });
    }
  },
);

router.get(
  "/admin/staff/performance",
  authenticateToken,
  requireRole("admin"),
  async (req, res) => {
    try {
      const filters = req.query;
      const performance = await adminAnalytics.getStaffPerformance(filters);

      res.json({
        success: true,
        data: performance,
      });
    } catch (error) {
      console.error("Error getting staff performance:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get staff performance",
        error: error.message,
      });
    }
  },
);

// Owner Analytics Routes
router.get(
  "/owner/dashboard",
  authenticateToken,
  requireRole("owner"),
  async (req, res) => {
    try {
      const ownerId = req.user.id;
      const { timeRange = "30d" } = req.query;

      const cacheKey = getCacheKey("owner:dashboard", { ownerId, timeRange });

      // Check cache
      const cached = getCached(cacheKey);
      if (cached) {
        return res.json({
          success: true,
          data: cached,
          cached: true,
        });
      }

      const stats = await ownerAnalytics.getOwnerDashboard(ownerId, timeRange);

      // Cache for 5 minutes
      setCached(cacheKey, stats, 300);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Error getting owner dashboard:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get owner dashboard",
        error: error.message,
      });
    }
  },
);

router.get(
  "/owner/vehicle/:vehicleId",
  authenticateToken,
  requireRole("owner"),
  async (req, res) => {
    try {
      const ownerId = req.user.id;
      const { vehicleId } = req.params;
      const { timeRange = "30d" } = req.query;

      const analytics = await ownerAnalytics.getVehicleAnalytics(
        vehicleId,
        ownerId,
        timeRange,
      );

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      console.error("Error getting vehicle analytics:", error);

      if (error.message.includes("Unauthorized")) {
        return res.status(403).json({
          success: false,
          message: "You do not have access to this vehicle",
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to get vehicle analytics",
        error: error.message,
      });
    }
  },
);

router.get(
  "/owner/vehicles/comparison",
  authenticateToken,
  requireRole("owner"),
  async (req, res) => {
    try {
      const ownerId = req.user.id;
      const { timeRange = "30d" } = req.query;

      const comparison = await ownerAnalytics.getVehicleComparison(
        ownerId,
        timeRange,
      );

      res.json({
        success: true,
        data: comparison,
      });
    } catch (error) {
      console.error("Error getting vehicle comparison:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get vehicle comparison",
        error: error.message,
      });
    }
  },
);

module.exports = router;
