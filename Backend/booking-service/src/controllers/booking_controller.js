// Backend/booking-service/src/controllers/booking_controller.js
const pool = require("../config/database");
const { v4: uuidv4 } = require("uuid");

class BookingController {
  // Create new booking (requires driving license)
  async createBooking(req, res, next) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const userId = req.user.userId;
      const userEmail = req.user.email || "unknown@example.com";
      const userRole = req.user.role || "customer";
      const {
        vehicleId,
        startDate,
        endDate,
        pickupLocation,
        dropoffLocation,
        driverRequired,
        insuranceCoverage,
        paymentMethodId,
        additionalNotes,
      } = req.body;

      // Check if user has verified driving license
      const licenseResult = await client.query(
        `SELECT * FROM user_licenses 
         WHERE user_id = $1 AND is_verified = true`,
        [userId]
      );

      if (licenseResult.rows.length === 0) {
        return res.status(400).json({
          error: "Please upload and verify your driving license before booking",
          requiresLicense: true,
        });
      }

      // Ensure user exists in booking service
      await client.query(
        `INSERT INTO users (user_id, email, full_name, role)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id) DO UPDATE
         SET email = EXCLUDED.email, role = EXCLUDED.role`,
        [
          userId,
          userEmail,
          req.user.fullName || userEmail.split("@")[0],
          userRole,
        ]
      );

      // Validate dates
      const start = new Date(startDate);
      const end = new Date(endDate);
      const now = new Date();

      if (start <= now) {
        return res
          .status(400)
          .json({ error: "Start date must be in the future" });
      }

      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      if (days <= 0) {
        return res
          .status(400)
          .json({ error: "End date must be after start date" });
      }

      // Get vehicle details
      const vehicleResult = await client.query(
        "SELECT * FROM vehicles WHERE vehicle_id = $1 AND is_active = true",
        [vehicleId]
      );

      if (vehicleResult.rows.length === 0) {
        return res
          .status(404)
          .json({ error: "Vehicle not found or not available" });
      }

      const vehicle = vehicleResult.rows[0];

      // Ensure vehicle owner exists
      await client.query(
        `INSERT INTO users (user_id, email, full_name, role)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id) DO NOTHING`,
        [
          vehicle.owner_id,
          `owner-${vehicle.owner_id}@wiz.com`,
          "Vehicle Owner",
          "owner",
        ]
      );

      // Calculate pricing
      const rentalPrice = vehicle.daily_rate * days;
      const insuranceFee = Math.round(rentalPrice * (insuranceCoverage / 100));
      const total = rentalPrice + insuranceFee;
      const deposit = Math.round(total * 0.3); // 30% deposit
      const remainingPayment = total - deposit;

      // Generate rental ID
      const rentalId = Math.floor(
        10000000 + Math.random() * 90000000
      ).toString();

      // Create booking with PENDING status
      const bookingId = uuidv4();
      const bookingResult = await client.query(
        `INSERT INTO bookings (
          booking_id, rental_id, customer_id, owner_id, vehicle_id,
          start_date, end_date, duration_days,
          pickup_location, dropoff_location,
          driver_required, insurance_coverage,
          rental_price, insurance_fee, total_amount,
          deposit_amount, remaining_payment,
          payment_method_id, additional_notes,
          status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        RETURNING *`,
        [
          bookingId,
          rentalId,
          userId,
          vehicle.owner_id,
          vehicleId,
          startDate,
          endDate,
          days,
          JSON.stringify(pickupLocation),
          JSON.stringify(dropoffLocation),
          driverRequired,
          insuranceCoverage,
          rentalPrice,
          insuranceFee,
          total,
          deposit,
          remainingPayment,
          paymentMethodId,
          additionalNotes,
          "pending", // Initial status
        ]
      );

      await client.query("COMMIT");

      res.status(201).json({
        message: "Booking created successfully, waiting for owner approval",
        booking: {
          id: bookingId,
          rentalId: rentalId,
          vehicleId: vehicleId,
          vehicleName: vehicle.name,
          status: "pending",
          startDate: startDate,
          endDate: endDate,
          duration: `${days} days`,
          pricing: {
            rentalPrice,
            insuranceFee,
            dailyRate: vehicle.daily_rate,
            numberOfDays: days,
            total,
            deposit,
            remainingPayment,
          },
        },
        nextStep: "wait_for_owner_approval",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Create booking error:", error);
      next(error);
    } finally {
      client.release();
    }
  }

  // Get customer's bookings
  async getMyBookings(req, res, next) {
    try {
      const userId = req.user.userId;
      const {
        status = "all",
        search,
        sortBy = "newest",
        page = 1,
        limit = 10,
      } = req.query;

      let query = `
        SELECT 
          b.*,
          v.name as vehicle_name, v.photo as vehicle_photo,
          u.full_name as owner_name, u.avatar_url as owner_avatar
        FROM bookings b
        JOIN vehicles v ON b.vehicle_id = v.vehicle_id
        JOIN users u ON b.owner_id = u.user_id
        WHERE b.customer_id = $1
      `;

      const params = [userId];
      let paramIndex = 2;

      if (status !== "all") {
        query += ` AND b.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      if (search) {
        query += ` AND v.name ILIKE $${paramIndex}`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      query += ` ORDER BY b.created_at ${sortBy === "oldest" ? "ASC" : "DESC"}`;
      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, (page - 1) * limit);

      const result = await pool.query(query, params);
      const countResult = await pool.query(
        "SELECT COUNT(*) FROM bookings WHERE customer_id = $1",
        [userId]
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
          owner: {
            id: row.owner_id,
            name: row.owner_name,
            avatar: row.owner_avatar,
          },
          startDate: row.start_date,
          endDate: row.end_date,
          duration: `${row.duration_days} days`,
          pricing: {
            total: row.total_amount,
            deposit: row.deposit_amount,
            remainingPayment: row.remaining_payment,
          },
          canCancel:
            ["pending", "booking"].includes(row.status) &&
            new Date(row.start_date) > new Date(),
          canReview: row.status === "completed" && !row.rated,
          createdAt: row.created_at,
        })),
        pagination: {
          total: parseInt(countResult.rows[0].count),
          page: parseInt(page),
          limit: parseInt(limit),
        },
      });
    } catch (error) {
      console.error("Get my bookings error:", error);
      next(error);
    }
  }

  // Get booking details
  async getBookingById(req, res, next) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;

      const result = await pool.query(
        `SELECT 
          b.*,
          v.name as vehicle_name, v.photo as vehicle_photo, 
          v.transmission, v.seats, v.fuel_type, v.location as vehicle_location,
          c.full_name as customer_name, c.avatar_url as customer_avatar,
          o.full_name as owner_name, o.avatar_url as owner_avatar
        FROM bookings b
        JOIN vehicles v ON b.vehicle_id = v.vehicle_id
        JOIN users c ON b.customer_id = c.user_id
        JOIN users o ON b.owner_id = o.user_id
        WHERE b.booking_id = $1 AND (b.customer_id = $2 OR b.owner_id = $2)`,
        [id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Booking not found" });
      }

      const booking = result.rows[0];
      const now = new Date();
      const startDate = new Date(booking.start_date);

      res.json({
        booking: {
          id: booking.booking_id,
          rentalId: booking.rental_id,
          status: booking.status,
          vehicle: {
            id: booking.vehicle_id,
            name: booking.vehicle_name,
            photo: booking.vehicle_photo,
            transmission: booking.transmission,
            seats: booking.seats,
            fuelType: booking.fuel_type,
            location: booking.vehicle_location,
          },
          customer: {
            id: booking.customer_id,
            name: booking.customer_name,
            avatar: booking.customer_avatar,
          },
          owner: {
            id: booking.owner_id,
            name: booking.owner_name,
            avatar: booking.owner_avatar,
          },
          timeline: {
            startDate: booking.start_date,
            endDate: booking.end_date,
            duration: `${booking.duration_days} days`,
            isBookingDay: startDate.toDateString() === now.toDateString(),
          },
          pickup: JSON.parse(booking.pickup_location),
          dropoff: JSON.parse(booking.dropoff_location),
          billing: {
            rentalPrice: booking.rental_price,
            insuranceFee: booking.insurance_fee,
            dailyRate: Math.round(booking.rental_price / booking.duration_days),
            numberOfDays: booking.duration_days,
            total: booking.total_amount,
            deposit: booking.deposit_amount,
            depositPaid: booking.deposit_paid,
            remainingPayment: booking.remaining_payment,
            finalPaymentPaid: booking.final_payment_paid,
          },
          insurance: {
            coverage: booking.insurance_coverage,
          },
          pickupPhotos: booking.pickup_condition_photos,
          returnPhotos: booking.return_photos,
          additionalNotes: booking.additional_notes,
          contract: booking.contract_signed_at
            ? {
                signedAt: booking.contract_signed_at,
                url: `https://cdn.com/contracts/${booking.booking_id}.pdf`,
              }
            : null,
          canCancel:
            ["pending", "booking"].includes(booking.status) && startDate > now,
          canReview: booking.status === "completed" && !booking.rated,
          canSignContract:
            booking.status === "booking" &&
            startDate.toDateString() === now.toDateString() &&
            !booking.contract_signed_at,
        },
      });
    } catch (error) {
      console.error("Get booking error:", error);
      next(error);
    }
  }

  // Upload/Update driving license
  async uploadLicense(req, res, next) {
    try {
      const userId = req.user.userId;
      const {
        fullName,
        licenseNumber,
        expiryDate,
        frontPhotoUrl,
        backPhotoUrl,
      } = req.body;

      await pool.query(
        `INSERT INTO user_licenses (user_id, full_name, license_number, expiry_date, front_photo_url, back_photo_url, is_verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (user_id) DO UPDATE
         SET full_name = EXCLUDED.full_name,
             license_number = EXCLUDED.license_number,
             expiry_date = EXCLUDED.expiry_date,
             front_photo_url = EXCLUDED.front_photo_url,
             back_photo_url = EXCLUDED.back_photo_url,
             is_verified = EXCLUDED.is_verified,
             updated_at = NOW()`,
        [
          userId,
          fullName,
          licenseNumber,
          expiryDate,
          frontPhotoUrl || "front-url",
          backPhotoUrl || "back-url",
          true,
        ]
      );

      res.json({
        message: "License saved and verified successfully",
        licenseVerified: true,
      });
    } catch (error) {
      console.error("Upload license error:", error);
      next(error);
    }
  }

  // Get user's license
  async getMyLicense(req, res, next) {
    try {
      const userId = req.user.userId;

      const result = await pool.query(
        `SELECT full_name, license_number, expiry_date, front_photo_url, back_photo_url, is_verified
         FROM user_licenses WHERE user_id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return res.json({ hasLicense: false, license: null });
      }

      const license = result.rows[0];
      res.json({
        hasLicense: true,
        license: {
          fullName: license.full_name,
          licenseNumber: license.license_number,
          expiryDate: license.expiry_date,
          frontPhotoUrl: license.front_photo_url,
          backPhotoUrl: license.back_photo_url,
          isVerified: license.is_verified,
        },
      });
    } catch (error) {
      console.error("Get license error:", error);
      next(error);
    }
  }

  // Confirm car pickup (changes status to on-journey)
  async confirmPickup(req, res, next) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const userId = req.user.userId;
      const { id } = req.params;
      const { pickupPhotos, odometerReading, notes } = req.body;

      // Validate photos
      if (!pickupPhotos || pickupPhotos.length < 3) {
        return res
          .status(400)
          .json({ error: "Please upload at least 3 photos of the car" });
      }

      const bookingResult = await client.query(
        "SELECT * FROM bookings WHERE booking_id = $1 AND customer_id = $2",
        [id, userId]
      );

      if (bookingResult.rows.length === 0) {
        return res.status(404).json({ error: "Booking not found" });
      }

      const booking = bookingResult.rows[0];

      // Check if booking is in correct status
      if (booking.status !== "booking") {
        return res.status(400).json({
          error: `Cannot confirm pickup. Current status: ${booking.status}. Expected: booking`,
        });
      }

      // Check if contract is signed (required on booking day)
      const startDate = new Date(booking.start_date);
      const now = new Date();
      if (
        startDate.toDateString() === now.toDateString() &&
        !booking.contract_signed_at
      ) {
        return res.status(400).json({
          error: "Please sign the rental contract before pickup",
        });
      }

      await client.query(
        `UPDATE bookings 
         SET pickup_condition_photos = $1,
             pickup_condition_notes = $2,
             pickup_odometer_reading = $3,
             pickup_confirmed_at = NOW(),
             status = 'on-journey',
             updated_at = NOW()
         WHERE booking_id = $4`,
        [JSON.stringify(pickupPhotos), notes, odometerReading, id]
      );

      await client.query("COMMIT");

      res.json({
        message: "Car pickup confirmed. Have a safe journey!",
        bookingStatus: "on-journey",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Confirm pickup error:", error);
      next(error);
    } finally {
      client.release();
    }
  }

  // Confirm car return (changes status to completed)
  async confirmReturn(req, res, next) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const userId = req.user.userId;
      const { id } = req.params;
      const { returnPhotos, odometerReading, notes } = req.body;

      // Validate photos
      if (!returnPhotos || returnPhotos.length < 3) {
        return res
          .status(400)
          .json({ error: "Please upload at least 3 photos of the car" });
      }

      const bookingResult = await client.query(
        "SELECT * FROM bookings WHERE booking_id = $1 AND customer_id = $2",
        [id, userId]
      );

      if (bookingResult.rows.length === 0) {
        return res.status(404).json({ error: "Booking not found" });
      }

      const booking = bookingResult.rows[0];

      if (booking.status !== "on-journey") {
        return res.status(400).json({
          error: `Cannot confirm return. Current status: ${booking.status}. Expected: on-journey`,
        });
      }

      await client.query(
        `UPDATE bookings 
         SET return_photos = $1,
             return_odometer_reading = $2,
             return_notes = $3,
             return_confirmed_at = NOW(),
             status = 'completed',
             updated_at = NOW()
         WHERE booking_id = $4`,
        [JSON.stringify(returnPhotos), odometerReading, notes, id]
      );

      await client.query("COMMIT");

      res.json({
        message: "Car returned successfully. Thank you for using our service!",
        bookingStatus: "completed",
        canReviewNow: true,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Confirm return error:", error);
      next(error);
    } finally {
      client.release();
    }
  }

  // Cancel booking
  async cancelBooking(req, res, next) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const userId = req.user.userId;
      const { id } = req.params;
      const { reason } = req.body;

      const bookingResult = await client.query(
        "SELECT * FROM bookings WHERE booking_id = $1 AND customer_id = $2",
        [id, userId]
      );

      if (bookingResult.rows.length === 0) {
        return res.status(404).json({ error: "Booking not found" });
      }

      const booking = bookingResult.rows[0];
      const startDate = new Date(booking.start_date);
      const now = new Date();

      // Can only cancel if status is pending or booking, and before start date
      if (!["pending", "booking"].includes(booking.status)) {
        return res.status(400).json({
          error: `Cannot cancel booking with status: ${booking.status}`,
        });
      }

      if (startDate <= now) {
        return res.status(400).json({
          error: "Cannot cancel booking on or after start date",
        });
      }

      // Calculate refund
      let refundAmount = 0;
      const hoursUntilStart = (startDate - now) / (1000 * 60 * 60);

      if (hoursUntilStart > 24) {
        refundAmount = booking.deposit_paid ? booking.deposit_amount : 0;
      } else if (hoursUntilStart > 12) {
        refundAmount = booking.deposit_paid
          ? Math.round(booking.deposit_amount * 0.5)
          : 0;
      }

      await client.query(
        `UPDATE bookings 
         SET status = 'cancelled',
             cancellation_reason = $1,
             cancellation_date = NOW(),
             refund_amount = $2,
             refund_status = $3,
             updated_at = NOW()
         WHERE booking_id = $4`,
        [reason, refundAmount, refundAmount > 0 ? "processing" : "none", id]
      );

      await client.query("COMMIT");

      res.json({
        message: "Booking cancelled successfully",
        refundAmount,
        refundStatus: refundAmount > 0 ? "processing" : "none",
        refundPolicy:
          hoursUntilStart > 24
            ? "full_refund"
            : hoursUntilStart > 12
            ? "partial_refund"
            : "no_refund",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Cancel booking error:", error);
      next(error);
    } finally {
      client.release();
    }
  }

  // Sign contract (only on booking day)
  async signContract(req, res, next) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const userId = req.user.userId;
      const { id } = req.params;
      const { signature, agreedToTerms } = req.body;

      if (!agreedToTerms) {
        return res
          .status(400)
          .json({ error: "You must agree to the terms and conditions" });
      }

      const bookingResult = await client.query(
        "SELECT * FROM bookings WHERE booking_id = $1 AND customer_id = $2",
        [id, userId]
      );

      if (bookingResult.rows.length === 0) {
        return res.status(404).json({ error: "Booking not found" });
      }

      const booking = bookingResult.rows[0];

      // Check if status is booking
      if (booking.status !== "booking") {
        return res.status(400).json({
          error: "Contract can only be signed for confirmed bookings",
        });
      }

      // Check if it's booking day
      const startDate = new Date(booking.start_date);
      const now = new Date();

      if (startDate.toDateString() !== now.toDateString()) {
        return res.status(400).json({
          error: "Contract can only be signed on the booking day",
        });
      }

      await client.query(
        `UPDATE bookings 
         SET customer_signature = $1,
             contract_signed_at = NOW(),
             updated_at = NOW()
         WHERE booking_id = $2`,
        [signature, id]
      );

      await client.query("COMMIT");

      res.json({
        message: "Contract signed successfully",
        contractUrl: `https://cdn.com/contracts/${id}.pdf`,
        nextStep: "confirm_car_pickup",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Sign contract error:", error);
      next(error);
    } finally {
      client.release();
    }
  }
}

module.exports = new BookingController();
