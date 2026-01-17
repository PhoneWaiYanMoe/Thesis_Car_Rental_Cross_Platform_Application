// Backend/booking-service/src/routes/contract_routes.js
const express = require("express");
const router = express.Router();
const contractController = require("../controllers/contract_controller");
const { authenticate } = require("../middleware/auth");

// All routes require authentication
router.use(authenticate);

// ==================== CONTRACT MANAGEMENT ====================

// 1. Auto-generate platform contract (can be called by system or manually)
router.post("/:id/generate-contract", (req, res, next) =>
  contractController.generateContract(req, res, next)
);

// 2. Owner uploads custom contract
router.post("/:id/upload-owner-contract", (req, res, next) =>
  contractController.uploadOwnerContract(req, res, next)
);

// 3. Get contract for viewing/download
router.get("/:id/contract", (req, res, next) =>
  contractController.getContract(req, res, next)
);

// 4. Preview contract before signing
router.get("/:id/preview-contract", (req, res, next) =>
  contractController.previewContract(req, res, next)
);

// 5. Sign contract (customer uploads signed version)
router.post("/:id/sign-contract", (req, res, next) =>
  contractController.signContract(req, res, next)
);

module.exports = router;