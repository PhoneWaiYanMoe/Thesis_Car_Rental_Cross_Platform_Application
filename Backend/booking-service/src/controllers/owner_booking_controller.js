// Backend/booking-service/src/controllers/owner_booking_controller.js
const pool = require("../config/database");

class OwnerBookingController {
  /**
   * Get owner's rental requests
   * Fetches all bookings for vehicles owned by this user (user_id matches vehicle.user_id)
   */
  async getOwnerBookings(req, res, next) {
    try {
      const userId = req.user.userId; // Owner's user_id
      const {
        status = "all",
        vehicleId,
        sortBy = "newest",
        page = 1,
        limit = 10,
      } = req.query;

      // Join bookings with vehicles where vehicle.user_id = current user (owner)
      let query = `
        SELECT 
          b.*,
          v.name as vehicle_name, 
          v.photo as vehicle_photo
        FROM bookings b
        JOIN vehicles v ON b.vehicle_id = v.vehicle_id
        WHERE v.user_id = $1
      `;

      const params = [userId];
      let paramIndex = 2;

      if (status !== "all") {
        query += ` AND b.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      if (vehicleId) {
        query += ` AND b.vehicle_id = $${paramIndex}`;
        params.push(vehicleId);
        paramIndex++;
      }

      query += ` ORDER BY b.created_at ${sortBy === "oldest" ? "ASC" : "DESC"}`;
      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, (page - 1) * limit);

      const result = await pool.query(query, params);

      // Count total bookings for this owner
      const countResult = await pool.query(
        `SELECT COUNT(*) 
         FROM bookings b
         JOIN vehicles v ON b.vehicle_id = v.vehicle_id
         WHERE v.user_id = $1`,
        [userId]
      );

      console.log(
        `📊 Owner ${userId} has ${result.rows.length} bookings in this page`
      );

      res.json({
        bookings: result.rows.map((row) => ({
          id: row.booking_id,
          status: row.status,
          vehicle: {
            id: row.vehicle_id,
            name: row.vehicle_name,
            photo: row.vehicle_photo,
          },
          customerId: row.customer_id,
          startDate: row.start_date,
          endDate: row.end_date,
          duration: `${row.duration_days} days`,
          totalAmount: row.total_amount,
          createdAt: row.created_at,
          needsAction: row.status === "pending", // Requires owner approval
        })),
        pagination: {
          total: parseInt(countResult.rows[0].count),
          page: parseInt(page),
          limit: parseInt(limit),
        },
      });
    } catch (error) {
      console.error("Get owner bookings error:", error);
      next(error);
    }
  }

  /**
   * Accept booking request (changes status from pending to booking)
   */
  async acceptBooking(req, res, next) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const userId = req.user.userId; // Owner's user_id
      const { id } = req.params;

      // Verify this booking belongs to a vehicle owned by this user
      const bookingResult = await client.query(
        `SELECT b.* 
         FROM bookings b
         JOIN vehicles v ON b.vehicle_id = v.vehicle_id
         WHERE b.booking_id = $1 AND v.user_id = $2`,
        [id, userId]
      );

      if (bookingResult.rows.length === 0) {
        return res.status(404).json({
          error: "Booking not found or you don't own this vehicle",
        });
      }

      const booking = bookingResult.rows[0];

      if (booking.status !== "pending") {
        return res.status(400).json({
          error: `Cannot accept booking with status: ${booking.status}. Expected: pending`,
        });
      }

      await client.query(
        `UPDATE bookings 
         SET status = 'booking',
             owner_approved_at = NOW(),
             updated_at = NOW()
         WHERE booking_id = $1`,
        [id]
      );

      await client.query("COMMIT");

      console.log(`✅ Owner ${userId} accepted booking: ${id}`);

      res.json({
        message: "Booking accepted successfully",
        bookingStatus: "booking",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Accept booking error:", error);
      next(error);
    } finally {
      client.release();
    }
  }

  /**
   * Reject booking request (changes status to cancelled)
   */
  async rejectBooking(req, res, next) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const userId = req.user.userId; // Owner's user_id
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason || reason.trim() === "") {
        return res.status(400).json({
          error: "Please provide a reason for rejection",
        });
      }

      // Verify this booking belongs to a vehicle owned by this user
      const bookingResult = await client.query(
        `SELECT b.* 
         FROM bookings b
         JOIN vehicles v ON b.vehicle_id = v.vehicle_id
         WHERE b.booking_id = $1 AND v.user_id = $2`,
        [id, userId]
      );

      if (bookingResult.rows.length === 0) {
        return res.status(404).json({
          error: "Booking not found or you don't own this vehicle",
        });
      }

      const booking = bookingResult.rows[0];

      if (booking.status !== "pending") {
        return res.status(400).json({
          error: `Cannot reject booking with status: ${booking.status}. Expected: pending`,
        });
      }

      // Calculate refund (full refund if owner rejects)
      const refundAmount = booking.deposit_paid ? booking.deposit_amount : 0;

      await client.query(
        `UPDATE bookings 
         SET status = 'cancelled',
             rejection_reason = $1,
             rejected_at = NOW(),
             refund_amount = $2,
             refund_status = $3,
             updated_at = NOW()
         WHERE booking_id = $4`,
        [reason, refundAmount, refundAmount > 0 ? "processing" : "none", id]
      );

      await client.query("COMMIT");

      console.log(`❌ Owner ${userId} rejected booking: ${id}`);

      res.json({
        message: "Booking rejected",
        refundAmount,
        customerNotified: true,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Reject booking error:", error);
      next(error);
    } finally {
      client.release();
    }
  }
}

module.exports = new OwnerBookingController();
