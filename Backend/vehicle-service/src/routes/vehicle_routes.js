const express = require("express");
const router = express.Router();

const vehicleController = require("../controllers/vehicle_controller");
const { authenticate, requireAdmin } = require("../middleware/auth");
const { 
  validateCreateVehicle, 
  validateUpdateVehicle, 
  validateStatus 
} = require("../middleware/validation");

// Public routes (no authentication required)
router.get("/", vehicleController.getAllVehicles);
router.get("/:id", vehicleController.getVehicleById);

// Protected routes (authentication required)
router.post("/", authenticate, validateCreateVehicle, vehicleController.createVehicle);
router.put("/:id", authenticate, validateUpdateVehicle, vehicleController.updateVehicle);
router.delete("/:id", authenticate, vehicleController.deleteVehicle);

// Admin-only routes
router.patch("/:id/status", authenticate, requireAdmin, validateStatus, vehicleController.updateVehicleStatus);
router.get("/admin/statistics", authenticate, requireAdmin, vehicleController.getStatistics);

module.exports = router;