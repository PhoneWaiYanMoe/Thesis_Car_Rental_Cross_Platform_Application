const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analytics_controller");
const { authenticate } = require("../middleware/auth");

// All analytics routes require authentication
router.use(authenticate);

// Platform-wide user statistics
router.get("/users/stats", analyticsController.getUserStats);

// User growth analytics
router.get("/users/growth", analyticsController.getUserGrowth);

module.exports = router;
