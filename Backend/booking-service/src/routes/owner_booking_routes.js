// Backend/booking-service/src/routes/owner_booking_routes.js
const express = require("express");
const router = express.Router();
const ownerBookingController = require("../controllers/owner_booking_controller");
const { authenticate } = require("../middleware/auth");

// All routes require authentication
router.use(authenticate);

// Owner rental request endpoints
router.get("/bookings", ownerBookingController.getOwnerBookings);
router.post("/:id/accept", ownerBookingController.acceptBooking);
router.post("/:id/reject", ownerBookingController.rejectBooking);

// NEW: Owner confirms return (complete or dispute)
router.post("/:id/confirm-return", ownerBookingController.confirmReturn);

module.exports = router;
