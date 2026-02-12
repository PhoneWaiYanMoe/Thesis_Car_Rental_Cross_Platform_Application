// Backend/user-service/src/routes/user_routes.js
const express = require("express");
const router = express.Router();
const userController = require("../controllers/user_controller");
const { authenticate } = require("../middleware/auth");
const { requireAdmin, requireOwner } = require("../middleware/roleCheck");

// All user management routes require authentication
router.use(authenticate);

// Get all users (with filtering, searching, sorting)
router.get("/", userController.getAllUsers);

// Get support users
router.get("/support", userController.getSupportUsers);

// Get owner users
router.get("/owners", userController.getOwnerUsers);

// Get customer users
router.get("/customers", userController.getCustomerUsers);

// Get user by ID
router.get("/:userId", userController.getUserById);

// Change user role (customer <-> owner)
router.put("/:userId/role", userController.changeUserRole);

// Update user status (suspend, ban, activate)
router.put("/:userId/status", requireAdmin, userController.updateUserStatus);

// Get license verification status
router.get("/:userId/license-status", userController.getLicenseStatus);

// Upload driver's license
router.post("/:userId/upload-license", userController.uploadLicense);

// get logged in as
router.get("/:userId/logged-in-as", userController.getLoggedInAsById);

// Switch logged in as (customer <-> owner)
router.put("/:userId/logged-in-as", userController.updateLoggedInAsById);

module.exports = router;
