// Backend/vehicle-service/src/routes/vehicle_routes.js
const express = require("express");
const router = express.Router();
const vehicleController = require("../controllers/vehicle_controller");
const ownerVehicleController = require("../controllers/owner_vehicle_controller");
const adminVehicleController = require("../controllers/admin_vehicle_controller");
const analyticsVehicleController = require("../controllers/analytics_vehicle_controller");
const {
  authenticate,
  requireOwner,
  requireAdmin,
} = require("../middleware/auth");

// ==================== PUBLIC ROUTES ====================
router.get("/search", vehicleController.searchVehicles);
router.get("/:id/availability", vehicleController.checkAvailability);
router.get("/:id", vehicleController.getVehicleById);

// ==================== OWNER ROUTES ====================
router.get(
  "/owner/:ownerId/vehicles",
  authenticate,
  ownerVehicleController.getVehiclesByOwnerId,
);

router.get(
  "/owner/my-vehicles",
  authenticate,
  requireOwner,
  ownerVehicleController.getMyVehicles,
);

router.post(
  "/owner",
  authenticate,
  requireOwner,
  ownerVehicleController.createVehicle,
);

router.get(
  "/owner/:id",
  authenticate,
  requireOwner,
  ownerVehicleController.getMyVehicleById,
);

router.put(
  "/owner/:id",
  authenticate,
  requireOwner,
  ownerVehicleController.updateVehicle,
);

router.delete(
  "/owner/:id",
  authenticate,
  requireOwner,
  ownerVehicleController.deleteVehicle,
);

router.post(
  "/owner/:id/photos",
  authenticate,
  requireOwner,
  ownerVehicleController.uploadPhotos,
);

// Periodic verification routes for owners
router.post(
  "/owner/:id/verification",
  authenticate,
  requireOwner,
  ownerVehicleController.submitVerificationPhotos,
);

router.get(
  "/owner/:id/verification-status",
  authenticate,
  requireOwner,
  ownerVehicleController.getVerificationStatus,
);

// ==================== ADMIN ROUTES ====================

// ✅ NEW: Comprehensive admin routes with filters, sorting, and pagination

// Get all vehicles with comprehensive filtering
router.get(
  "/admin/vehicles",
  authenticate,
  requireAdmin,
  adminVehicleController.getAllVehicles,
);

// Get approved vehicles only
router.get(
  "/admin/vehicles/approved",
  authenticate,
  requireAdmin,
  adminVehicleController.getApprovedVehicles,
);

// Get vehicles by specific status
router.get(
  "/admin/vehicles/by-status/:status",
  authenticate,
  requireAdmin,
  adminVehicleController.getVehiclesByStatus,
);

// Get top rated vehicles
router.get(
  "/admin/vehicles/top-rated",
  authenticate,
  requireAdmin,
  adminVehicleController.getTopRatedVehicles,
);

// Filter vehicles by type
router.get(
  "/admin/vehicles/by-type/:vehicleType",
  authenticate,
  requireAdmin,
  adminVehicleController.getVehiclesByType,
);

// Get vehicles due for verification
router.get(
  "/admin/vehicles/due-verification",
  authenticate,
  requireAdmin,
  adminVehicleController.getVehiclesDueForVerification,
);

// Periodic verification management
router.get(
  "/admin/verifications/pending",
  authenticate,
  requireAdmin,
  adminVehicleController.getPendingVerifications,
);

router.post(
  "/admin/verifications/:id/approve",
  authenticate,
  requireAdmin,
  adminVehicleController.approveVerification,
);

router.post(
  "/admin/verifications/:id/reject",
  authenticate,
  requireAdmin,
  adminVehicleController.rejectVerification,
);

// Vehicle status management
router.patch(
  "/admin/:id/status",
  authenticate,
  requireAdmin,
  adminVehicleController.updateVehicleStatus,
);

router.post(
  "/admin/:id/approve",
  authenticate,
  requireAdmin,
  adminVehicleController.approveVehicle,
);

router.post(
  "/admin/:id/reject",
  authenticate,
  requireAdmin,
  adminVehicleController.rejectVehicle,
);

// ==================== ANALYTICS ROUTES ====================

// Platform-wide analytics (Admin only)
router.get(
  "/analytics/vehicles/stats",
  authenticate,
  requireAdmin,
  analyticsVehicleController.getVehicleStats,
);

// Owner-specific analytics (Owner or Admin)
router.get(
  "/analytics/vehicles/owner/:ownerId/stats",
  authenticate,
  analyticsVehicleController.getOwnerVehicleStats,
);

module.exports = router;
