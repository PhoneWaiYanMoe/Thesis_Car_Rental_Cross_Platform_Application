// Backend/booking-service/src/routes/booking_routes.js
const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/booking_controller");
const { authenticate } = require("../middleware/auth");
const { validateBooking } = require("../middleware/validation");

// All routes require authentication
router.use(authenticate);

// ==================== VERIFICATION ROUTES ====================
router.get("/verification/me", bookingController.getMyVerification);
router.post("/verification", bookingController.uploadVerification);

// ==================== BOOKING ROUTES ====================
router.post("/", validateBooking, bookingController.createBooking);
router.get("/my-bookings", bookingController.getMyBookings);
router.get("/:id", bookingController.getBookingById);

// ==================== BOOKING ACTIONS ====================
router.post("/:id/sign-contract", bookingController.signContract);
router.post("/:id/confirm-pickup", bookingController.confirmPickup);
router.post("/:id/confirm-return", bookingController.confirmReturn);
router.post("/:id/cancel", bookingController.cancelBooking);

module.exports = router;
