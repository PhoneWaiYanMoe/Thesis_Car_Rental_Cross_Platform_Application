// Backend/booking-service/src/controllers/owner_booking_controller.js
const pool = require("../config/database");
const vehicleGrpcClient = require("../grpc/vehicle_grpc_client");
const userGrpcClient = require("../grpc/user_grpc_client");
const eventPublisher = require("../utils/eventPublisher");

class OwnerBookingController {
  async getOwnerBookings(req, res, next) {
    try {
      const userId = req.user.userId;
      const userRole = req.user.role;

      if (userRole !== "owner") {
        return res.status(403).json({
          error: "Access denied. Only vehicle owners can view rental requests.",
          requiredRole: "owner",
          yourRole: userRole,
        });
      }

      const {
        status = "all",
        vehicleId,
        sortBy = "newest",
        page = 1,
        limit = 10,
      } = req.query;

      let query = `
        SELECT 
          b.booking_id,
          b.vehicle_id,
          b.customer_id,
          b.status,
          b.start_date,
          b.end_date,
          b.duration_days,
          b.total_amount,
          b.created_at
        FROM bookings b
        WHERE 1=1
      `;

      const params = [];
      let paramIndex = 1;

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

      const vehicleIds = [...new Set(result.rows.map((row) => row.vehicle_id))];
      let ownerVehicles = new Set();

      try {
        const vehicles = await vehicleGrpcClient.getVehiclesInfo(vehicleIds);
        vehicles.forEach((v) => {
          if (v.owner_id === userId) {
            ownerVehicles.add(v.vehicle_id);
          }
        });
      } catch (error) {
        console.error("⚠️  Could not fetch vehicle info:", error.message);
        return res.status(503).json({
          error: "Vehicle service unavailable",
        });
      }

      const filteredBookings = result.rows.filter((row) =>
        ownerVehicles.has(row.vehicle_id)
      );

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM bookings WHERE vehicle_id = ANY($1)`,
        [Array.from(ownerVehicles)]
      );

      res.json({
        bookings: filteredBookings.map((row) => ({
          id: row.booking_id,
          status: row.status,
          vehicle: {
            id: row.vehicle_id,
          },
          customerId: row.customer_id,
          startDate: row.start_date,
          endDate: row.end_date,
          duration: `${row.duration_days} days`,
          totalAmount: row.total_amount,
          createdAt: row.created_at,
          needsAction:
            row.status === "pending" || row.status === "return_submitted",
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

  async acceptBooking(req, res, next) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const userId = req.user.userId;
      const userRole = req.user.role;
      const { id } = req.params;

      if (userRole !== "owner") {
        return res.status(403).json({
          error: "Access denied. Only vehicle owners can accept bookings.",
          requiredRole: "owner",
        });
      }

      const bookingResult = await client.query(
        `SELECT * FROM bookings WHERE booking_id = $1`,
        [id]
      );

      if (bookingResult.rows.length === 0) {
        return res.status(404).json({
          error: "Booking not found",
        });
      }

      const booking = bookingResult.rows[0];

      // Verify ownership via gRPC
      try {
        const ownershipCheck = await vehicleGrpcClient.checkVehicleOwnership(
          booking.vehicle_id,
          userId
        );

        if (!ownershipCheck.is_owner) {
          return res.status(403).json({
            error: "You don't own this vehicle",
          });
        }
      } catch (error) {
        return res.status(503).json({
          error: "Could not verify vehicle ownership",
        });
      }

      if (booking.status !== "pending") {
        return res.status(400).json({
          error: `Cannot accept booking with status: ${booking.status}`,
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

      // ✅ Fetch info for notification
      let vehicle, customerInfo;
      try {
        vehicle = await vehicleGrpcClient.getVehicleInfo(booking.vehicle_id);
        customerInfo = await userGrpcClient.getUserProfile(booking.customer_id);

        // ✅ Publish booking accepted event
        const updatedBooking = {
          ...booking,
          status: "booking",
          owner_approved_at: new Date(),
        };
        await eventPublisher.bookingAcceptedByOwner(
          updatedBooking,
          vehicle,
          customerInfo
        );
        console.log(
          `📧 Booking accepted notification sent to ${customerInfo.email}`
        );
      } catch (error) {
        console.warn(
          "⚠️  Could not send acceptance notification:",
          error.message
        );
      }

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

  async rejectBooking(req, res, next) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const userId = req.user.userId;
      const userRole = req.user.role;
      const { id } = req.params;
      const { reason, refundAmount } = req.body;

      if (userRole !== "owner") {
        return res.status(403).json({
          error: "Access denied. Only vehicle owners can reject bookings.",
          requiredRole: "owner",
        });
      }

      if (!reason || reason.trim() === "") {
        return res.status(400).json({
          error: "Please provide a reason for rejection",
        });
      }

      if (refundAmount === undefined || refundAmount === null) {
        return res.status(400).json({
          error: "Refund amount is required",
        });
      }

      const bookingResult = await client.query(
        `SELECT * FROM bookings WHERE booking_id = $1`,
        [id]
      );

      if (bookingResult.rows.length === 0) {
        return res.status(404).json({
          error: "Booking not found",
        });
      }

      const booking = bookingResult.rows[0];

      // Verify ownership via gRPC
      try {
        const ownershipCheck = await vehicleGrpcClient.checkVehicleOwnership(
          booking.vehicle_id,
          userId
        );

        if (!ownershipCheck.is_owner) {
          return res.status(403).json({
            error: "You don't own this vehicle",
          });
        }
      } catch (error) {
        return res.status(503).json({
          error: "Could not verify vehicle ownership",
        });
      }

      if (booking.status !== "pending") {
        return res.status(400).json({
          error: `Cannot reject booking with status: ${booking.status}`,
        });
      }

      const maxRefund = booking.deposit_paid ? booking.deposit_amount : 0;
      if (refundAmount > maxRefund) {
        return res.status(400).json({
          error: `Refund amount cannot exceed deposit: ${maxRefund}`,
        });
      }

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

      // Remove unavailability when owner rejects booking
      try {
        await vehicleGrpcClient.syncUnavailability(
          booking.vehicle_id,
          booking.start_date,
          booking.end_date,
          id,
          "remove"
        );
        console.log(`✅ Removed unavailability after owner rejection: ${id}`);
      } catch (error) {
        console.error(
          `⚠️  Could not remove unavailability after rejection: ${error.message}`
        );
      }

      console.log(`❌ Owner ${userId} rejected booking: ${id}`);

      // ✅ Fetch info for notification
      let vehicle, customerInfo;
      try {
        vehicle = await vehicleGrpcClient.getVehicleInfo(booking.vehicle_id);
        customerInfo = await userGrpcClient.getUserProfile(booking.customer_id);

        // ✅ Publish booking rejected event
        const updatedBooking = {
          ...booking,
          status: "cancelled",
          rejection_reason: reason,
          rejected_at: new Date(),
        };
        await eventPublisher.bookingRejectedByOwner(
          updatedBooking,
          vehicle,
          customerInfo,
          reason
        );
        console.log(
          `📧 Booking rejection notification sent to ${customerInfo.email}`
        );
      } catch (error) {
        console.warn(
          "⚠️  Could not send rejection notification:",
          error.message
        );
      }

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

  async confirmReturn(req, res, next) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const userId = req.user.userId;
      const userRole = req.user.role;
      const { id } = req.params;
      const {
        conditionPhotos,
        conditionNotes,
        damagesReported,
        odometerReading,
        action,
      } = req.body;

      if (userRole !== "owner") {
        return res.status(403).json({
          error: "Access denied. Only vehicle owners can confirm returns.",
          requiredRole: "owner",
        });
      }

      if (
        !conditionPhotos ||
        !Array.isArray(conditionPhotos) ||
        conditionPhotos.length < 3
      ) {
        return res.status(400).json({
          error: "Please provide at least 3 condition photos as an array",
        });
      }

      if (!action || !["complete", "dispute"].includes(action)) {
        return res.status(400).json({
          error: "Action must be either 'complete' or 'dispute'",
        });
      }

      const bookingResult = await client.query(
        `SELECT * FROM bookings WHERE booking_id = $1`,
        [id]
      );

      if (bookingResult.rows.length === 0) {
        return res.status(404).json({
          error: "Booking not found",
        });
      }

      const booking = bookingResult.rows[0];

      // Verify ownership via gRPC
      try {
        const ownershipCheck = await vehicleGrpcClient.checkVehicleOwnership(
          booking.vehicle_id,
          userId
        );

        if (!ownershipCheck.is_owner) {
          return res.status(403).json({
            error: "You don't own this vehicle",
          });
        }
      } catch (error) {
        return res.status(503).json({
          error: "Could not verify vehicle ownership",
        });
      }

      if (booking.status !== "return_submitted") {
        return res.status(400).json({
          error: `Cannot confirm return. Current status: ${booking.status}. Expected: return_submitted`,
        });
      }

      const newStatus = action === "complete" ? "completed" : "dispute_opened";

      await client.query(
        `UPDATE bookings 
         SET owner_return_photos = $1,
             owner_return_notes = $2,
             damages_reported = $3,
             owner_return_odometer_reading = $4,
             owner_confirmed_return_at = NOW(),
             status = $5,
             updated_at = NOW()
         WHERE booking_id = $6`,
        [
          JSON.stringify(conditionPhotos),
          conditionNotes,
          damagesReported,
          odometerReading,
          newStatus,
          id,
        ]
      );

      await client.query("COMMIT");

      // Increment total rentals when completed
      if (action === "complete") {
        try {
          await vehicleGrpcClient.incrementTotalRentals(booking.vehicle_id);
          console.log(
            `✅ Incremented total rentals for vehicle: ${booking.vehicle_id}`
          );
        } catch (error) {
          console.error(
            `⚠️  Could not increment total rentals: ${error.message}`
          );
        }

        // Remove from unavailability
        try {
          await vehicleGrpcClient.syncUnavailability(
            booking.vehicle_id,
            booking.start_date,
            booking.end_date,
            id,
            "remove"
          );
          console.log(`✅ Removed completed booking from unavailability`);
        } catch (error) {
          console.error(`⚠️  Could not sync unavailability: ${error.message}`);
        }

        // ✅ Fetch info for notification
        let customerInfo;
        try {
          customerInfo = await userGrpcClient.getUserProfile(
            booking.customer_id
          );

          // ✅ Publish booking completed event
          const updatedBooking = {
            ...booking,
            status: "completed",
            owner_confirmed_return_at: new Date(),
          };
          await eventPublisher.bookingCompleted(updatedBooking, customerInfo);
          console.log(
            `📧 Booking completed notification sent to ${customerInfo.email}`
          );
        } catch (error) {
          console.warn(
            "⚠️  Could not send completion notification:",
            error.message
          );
        }
      }

      console.log(
        `✅ Owner ${userId} confirmed return for booking: ${id} with action: ${action}`
      );

      res.json({
        message:
          action === "complete"
            ? "Return confirmed, booking completed"
            : "Dispute opened, customer support will review",
        bookingStatus: newStatus,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Confirm return error:", error);
      next(error);
    } finally {
      client.release();
    }
  }
}

module.exports = new OwnerBookingController();
