// Backend/booking-service/src/routes/booking_routes.js
const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/booking_controller");
const { authenticate } = require("../middleware/auth");
const { validateBooking } = require("../middleware/validation");

// All routes require authentication
router.use(authenticate);

// Customer booking endpoints
router.post("/", validateBooking, bookingController.createBooking);
router.get("/my-bookings", bookingController.getMyBookings);
router.get("/:id", bookingController.getBookingById);
router.post("/:id/upload-license", bookingController.uploadLicense);
router.post("/:id/confirm-pickup", bookingController.confirmPickup);
router.post("/:id/confirm-return", bookingController.confirmReturn);
router.post("/:id/cancel", bookingController.cancelBooking);
router.post("/:id/sign-contract", bookingController.signContract);

module.exports = router;