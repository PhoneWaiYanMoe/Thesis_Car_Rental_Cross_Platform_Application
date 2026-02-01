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

// ==================== OWNER ROUTES ====================
router.get(
  "/owner/:ownerId/vehicles",
  authenticate,
  ownerVehicleController.getVehiclesByOwnerId
);

router.get(
  "/owner/my-vehicles",
  authenticate,
  requireOwner,
  ownerVehicleController.getMyVehicles
);
router.post(
  "/owner",
  authenticate,
  requireOwner,
  ownerVehicleController.createVehicle
);
router.get(
  "/owner/:id",
  authenticate,
  requireOwner,
  ownerVehicleController.getMyVehicleById
);
router.put(
  "/owner/:id",
  authenticate,
  requireOwner,
  ownerVehicleController.updateVehicle
);
router.delete(
  "/owner/:id",
  authenticate,
  requireOwner,
  ownerVehicleController.deleteVehicle
);
router.post(
  "/owner/:id/photos",
  authenticate,
  requireOwner,
  ownerVehicleController.uploadPhotos
);

// ✅ NEW: Periodic verification routes for owners
router.post(
  "/owner/:id/verification",
  authenticate,
  requireOwner,
  ownerVehicleController.submitVerificationPhotos
);
router.get(
  "/owner/:id/verification-status",
  authenticate,
  requireOwner,
  ownerVehicleController.getVerificationStatus
);

// ==================== ADMIN ROUTES ====================
router.get(
  "/admin/vehicles",
  authenticate,
  requireAdmin,
  adminVehicleController.getAllVehicles
);
router.patch(
  "/admin/:id/status",
  authenticate,
  requireAdmin,
  adminVehicleController.updateVehicleStatus
);
router.post(
  "/admin/:id/approve",
  authenticate,
  requireAdmin,
  adminVehicleController.approveVehicle
);
router.post(
  "/admin/:id/reject",
  authenticate,
  requireAdmin,
  adminVehicleController.rejectVehicle
);

// ✅ NEW: Periodic verification routes for admins
router.get(
  "/admin/verifications/due",
  authenticate,
  requireAdmin,
  adminVehicleController.getVehiclesDueForVerification
);
router.get(
  "/admin/verifications/pending",
  authenticate,
  requireAdmin,
  adminVehicleController.getPendingVerifications
);
router.post(
  "/admin/verifications/:id/approve",
  authenticate,
  requireAdmin,
  adminVehicleController.approveVerification
);
router.post(
  "/admin/verifications/:id/reject",
  authenticate,
  requireAdmin,
  adminVehicleController.rejectVerification
);

// ==================== PUBLIC DETAIL ROUTE ====================
router.get("/:id", vehicleController.getVehicleById);

// ==================== ANALYTICS ROUTES ====================
// Platform-wide analytics (Admin only)
router.get(
  "/analytics/vehicles/stats",
  authenticate,
  requireAdmin,
  analyticsVehicleController.getVehicleStats
);

// Owner-specific analytics (Owner or Admin)
router.get(
  "/analytics/vehicles/owner/:ownerId/stats",
  authenticate,
  analyticsVehicleController.getOwnerVehicleStats
);


module.exports = router;
