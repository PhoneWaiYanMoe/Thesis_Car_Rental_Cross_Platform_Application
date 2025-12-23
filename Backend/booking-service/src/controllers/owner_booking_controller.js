// Backend/booking-service/src/controllers/owner_booking_controller.js
const pool = require("../config/database");

class OwnerBookingController {
  // Get owner's rental requests
  async getOwnerBookings(req, res, next) {
    try {
      const ownerId = req.user.userId;
      const {
        status = "all",
        vehicleId,
        sortBy = "newest",
        page = 1,
        limit = 10,
      } = req.query;

      let query = `
        SELECT 
          b.*,
          v.name as vehicle_name, v.photo as vehicle_photo,
          c.full_name as customer_name, c.avatar_url as customer_avatar
        FROM bookings b
        JOIN vehicles v ON b.vehicle_id = v.vehicle_id
        JOIN users c ON b.customer_id = c.user_id
        WHERE b.owner_id = $1
      `;

      const params = [ownerId];
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
      const countResult = await pool.query(
        "SELECT COUNT(*) FROM bookings WHERE owner_id = $1",
        [ownerId]
      );

      res.json({
        bookings: result.rows.map((row) => ({
          id: row.booking_id,
          rentalId: row.rental_id,
          status: row.status,
          vehicle: {
            id: row.vehicle_id,
            name: row.vehicle_name,
            photo: row.vehicle_photo,
          },
          customer: {
            id: row.customer_id,
            name: row.customer_name,
            avatar: row.customer_avatar,
          },
          startDate: row.start_date,
          endDate: row.end_date,
          totalAmount: row.total_amount,
          createdAt: row.created_at,
          needsAction: row.status === "pending",
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

  // Accept booking request (changes status from pending to booking)
  async acceptBooking(req, res, next) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const ownerId = req.user.userId;
      const { id } = req.params;

      const bookingResult = await client.query(
        "SELECT * FROM bookings WHERE booking_id = $1 AND owner_id = $2",
        [id, ownerId]
      );

      if (bookingResult.rows.length === 0) {
        return res.status(404).json({ error: "Booking not found" });
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

      console.log(`✅ Owner accepted booking: ${id}`);

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

  // Reject booking request (changes status to cancelled)
  async rejectBooking(req, res, next) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const ownerId = req.user.userId;
      const { id } = req.params;
      const { reason } = req.body;

      const bookingResult = await client.query(
        "SELECT * FROM bookings WHERE booking_id = $1 AND owner_id = $2",
        [id, ownerId]
      );

      if (bookingResult.rows.length === 0) {
        return res.status(404).json({ error: "Booking not found" });
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

      console.log(`❌ Owner rejected booking: ${id}`);

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
