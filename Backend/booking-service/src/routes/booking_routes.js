// Backend/booking-service/src/routes/booking_routes.js
// ✅ UPDATED: Added final payment endpoint

const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/booking_controller");
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
router.get("/:id", (req, res, next) =>
  bookingController.getBookingById(req, res, next)
);

// ==================== BOOKING ACTIONS ====================
router.post("/:id/sign-contract", (req, res, next) =>
  bookingController.signContract(req, res, next)
);

// ✅ NEW: Final payment endpoint (must be called AFTER signing contract)
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

module.exports = router;
