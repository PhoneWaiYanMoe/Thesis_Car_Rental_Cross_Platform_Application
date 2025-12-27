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
router.get("/search", vehicleController.searchVehicles);
router.get("/:id/availability", vehicleController.checkAvailability);
router.get("/:id", vehicleController.getVehicleById);

// ==================== OWNER ROUTES ====================
router.get(
  "/my-vehicles",
  authenticate,
  requireOwner,
  ownerVehicleController.getMyVehicles
);
router.post(
  "/",
  authenticate,
  requireOwner,
  ownerVehicleController.createVehicle
);
router.get(
  "/my-vehicles/:id",
  authenticate,
  requireOwner,
  ownerVehicleController.getMyVehicleById
);
router.put(
  "/my-vehicles/:id",
  authenticate,
  requireOwner,
  ownerVehicleController.updateVehicle
);
router.delete(
  "/my-vehicles/:id",
  authenticate,
  requireOwner,
  ownerVehicleController.deleteVehicle
);
router.post(
  "/my-vehicles/:id/photos",
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

module.exports = router;
