// Backend/booking-service/src/routes/admin_booking_routes.js
// Admin routes for system-wide booking management

const express = require("express");
const router = express.Router();
const adminBookingController = require("../controllers/admin_booking_controller");
const { authenticate, requireAdmin } = require("../middleware/auth");

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// ==================== ADMIN BOOKING ROUTES ====================

/**
 * GET /admin/bookings
 * Get all bookings with advanced filtering, pagination, and sorting
 * Query params:
 * - page (default: 1)
 * - limit (default: 20, max: 100)
 * - status (comma-separated: pending_payment,ongoing,completed,cancelled)
 * - filter (default: all_time, options: today, this_week, this_month, this_year, custom)
 * - startDate (for custom filter)
 * - endDate (for custom filter)
 * - sortBy (default: recently, options: amount, duration, start_date)
 * - sortOrder (default: desc, options: asc, desc)
 * - search (search by booking_id, vehicle_id, or customer_id)
 */
router.get("/bookings", (req, res, next) =>
  adminBookingController.getAllBookings(req, res, next),
);

/**
 * GET /admin/bookings/by-status
 * Get bookings filtered by multiple statuses
 * Query params:
 * - statuses (required, comma-separated)
 * - page, limit, sortBy (same as /bookings)
 */
router.get("/bookings/by-status", (req, res, next) =>
  adminBookingController.getBookingsByStatus(req, res, next),
);

/**
 * GET /admin/bookings/search
 * Dedicated search endpoint
 * Query params:
 * - q (required, search query)
 * - type (optional: booking_id, vehicle_id, customer_id)
 * - page, limit
 */
router.get("/bookings/search", (req, res, next) =>
  adminBookingController.searchBookings(req, res, next),
);

/**
 * GET /admin/bookings/stats
 * Enhanced statistics for admin dashboard
 * Query params:
 * - filter (default: all_time)
 * - startDate, endDate (for custom filter)
 */
router.get("/bookings/stats", (req, res, next) =>
  adminBookingController.getEnhancedStats(req, res, next),
);

/**
 * GET /admin/bookings/:id
 * Get detailed booking information (admin view)
 */
router.get("/bookings/:id", (req, res, next) =>
  adminBookingController.getBookingDetails(req, res, next),
);

module.exports = router;
