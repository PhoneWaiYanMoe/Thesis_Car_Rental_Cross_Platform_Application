const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/review_controller");
const { authenticate } = require("../middleware/auth");
const {
  validateVehicleReview,
  validateOwnerReview,
} = require("../middleware/validation");

// ==================== SUBMIT REVIEWS (PROTECTED) ====================
router.post(
  "/vehicle",
  authenticate,
  validateVehicleReview,
  reviewController.submitVehicleReview,
);
router.post(
  "/owner",
  authenticate,
  validateOwnerReview,
  reviewController.submitOwnerReview,
);

// ==================== GET REVIEWS (PUBLIC) ====================
// NEW: Get all reviews with pagination (supports type filter)
router.get("/all", reviewController.getAllReviews);

// Existing endpoints - kept for backward compatibility
router.get("/vehicle/:vehicleId", reviewController.getVehicleReviews);
router.get("/owner/:ownerId", reviewController.getOwnerReviews);

// ==================== REVIEW ACTIONS (PROTECTED) ====================
router.post("/:id/response", authenticate, reviewController.postResponse);
router.post("/:id/report", authenticate, reviewController.reportReview);
router.post("/:id/helpful", authenticate, reviewController.markHelpful);

module.exports = router;
