// Backend/booking-service/src/routes/owner_booking_routes.js
const express = require("express");
const router = express.Router();
const ownerBookingController = require("../controllers/owner_booking_controller");
const { authenticate } = require("../middleware/auth");

// All routes require authentication
router.use(authenticate);

// ✅ FIX: Wrap in arrow functions to preserve 'this' context
router.get("/bookings", (req, res, next) =>
  ownerBookingController.getOwnerBookings(req, res, next),
);
router.post("/:id/accept", (req, res, next) =>
  ownerBookingController.acceptBooking(req, res, next),
);
router.post("/:id/reject", (req, res, next) =>
  ownerBookingController.rejectBooking(req, res, next),
);
router.post("/:id/confirm-return", (req, res, next) =>
  ownerBookingController.confirmReturn(req, res, next),
);
router.post("/:id/sign-contract", (req, res, next) =>
  contractController.ownerSignContract(req, res, next),
);

module.exports = router;
