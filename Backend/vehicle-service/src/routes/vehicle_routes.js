// Backend/vehicle-service/src/routes/vehicle_routes.js
const express = require("express");
const router = express.Router();
const vehicleController = require("../controllers/vehicle_controller");
const ownerVehicleController = require("../controllers/owner_vehicle_controller");
const adminVehicleController = require("../controllers/admin_vehicle_controller");
const {
  authenticate,
  requireOwner,
  requireAdmin,
} = require("../middleware/auth");

// ==================== PUBLIC ROUTES ====================
// These MUST come first to avoid conflicts with /:id routes
router.get("/search", vehicleController.searchVehicles);
router.get("/:id/availability", vehicleController.checkAvailability);

// ==================== OWNER ROUTES ====================
// Prefixed with /owner to avoid conflicts
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

// ==================== PUBLIC DETAIL ROUTE ====================
// This MUST come LAST to avoid matching "search", "owner", "admin" as IDs
router.get("/:id", vehicleController.getVehicleById);

module.exports = router;
  