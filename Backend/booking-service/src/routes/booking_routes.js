// Backend/booking-service/src/routes/booking_routes.js
// ✅ FIXED: Contract routes must be registered BEFORE :id routes to avoid conflicts

const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/booking_controller");
const contractController = require("../controllers/contract_controller");
const { authenticate } = require("../middleware/auth");
const { validateBooking } = require("../middleware/validation");

// All routes require authentication
router.use(authenticate);

// ==================== VERIFICATION ROUTES ====================
router.get("/verification/me", (req, res, next) =>
  bookingController.getMyVerification(req, res, next)
);
router.post("/verification", (req, res, next) =>
  bookingController.uploadVerification(req, res, next)
);

// ==================== BOOKING ROUTES ====================
router.post("/", validateBooking, (req, res, next) =>
  bookingController.createBooking(req, res, next)
);
router.get("/my-bookings", (req, res, next) =>
  bookingController.getMyBookings(req, res, next)
);

// ==================== CONTRACT ROUTES (MUST BE BEFORE :id) ====================
// ✅ CRITICAL: These MUST come BEFORE router.get("/:id") to avoid route conflicts

// Generate contract (system/manual trigger)
router.post("/:id/generate-contract", (req, res, next) =>
  contractController.generateContract(req, res, next)
);

// Owner uploads custom contract
router.post("/:id/upload-owner-contract", (req, res, next) =>
  contractController.uploadOwnerContract(req, res, next)
);

// Get contract for viewing/download
router.get("/:id/contract", (req, res, next) =>
  contractController.getContract(req, res, next)
);

// Preview contract before signing
router.get("/:id/preview-contract", (req, res, next) =>
  contractController.previewContract(req, res, next)
);

// Sign contract (customer uploads signed version)
router.post("/:id/sign-contract", (req, res, next) =>
  contractController.signContract(req, res, next)
);

// ==================== OTHER BOOKING ACTION ROUTES ====================

// Final payment endpoint (must be called AFTER signing contract)
router.post("/:id/pay-final", (req, res, next) =>
  bookingController.payFinalPayment(req, res, next)
);

router.post("/:id/confirm-pickup", (req, res, next) =>
  bookingController.confirmPickup(req, res, next)
);

router.post("/:id/confirm-return", (req, res, next) =>
  bookingController.confirmReturn(req, res, next)
);

router.post("/:id/cancel", (req, res, next) =>
  bookingController.cancelBooking(req, res, next)
);

// ==================== GET BOOKING BY ID (MUST BE LAST) ====================
// ✅ This MUST be at the end to avoid catching specific routes above
router.get("/:id", (req, res, next) =>
  bookingController.getBookingById(req, res, next)
);

module.exports = router;
