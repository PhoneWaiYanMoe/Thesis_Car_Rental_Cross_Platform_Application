// Backend/request-service/src/routes/analytics.routes.js
const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analytics.controller");
const { authenticate, requireRole } = require("../middleware/auth.middleware");

// Request statistics (Admin/Support)
router.get(
  "/requests/stats",
  authenticate,
  requireRole("support", "admin"),
  (req, res, next) => analyticsController.getRequestStats(req, res, next),
);

// Staff performance (Admin only)
router.get(
  "/staff/performance",
  authenticate,
  requireRole("admin"),
  (req, res, next) => analyticsController.getStaffPerformance(req, res, next),
);

module.exports = router;
