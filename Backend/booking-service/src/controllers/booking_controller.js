// Backend/booking-service/src/controllers/booking_controller.js
const pool = require("../config/database");
const { v4: uuidv4 } = require("uuid");

class BookingController {
  // ==================== VERIFICATION MANAGEMENT ====================

  /**
   * Get user's verification status (license + selfies)
   */
  async getMyVerification(req, res, next) {
    try {
      const userId = req.user.userId;

      const result = await pool.query(
        `SELECT * FROM user_verifications WHERE user_id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return res.json({
          isVerified: false,
          hasLicense: false,
          hasSelfies: false,
          needsVerification: true,
          verification: null,
        });
      }

      const verification = result.rows[0];

      res.json({
        isVerified: verification.is_verified,
        hasLicense: verification.license_verified,
        hasSelfies: verification.selfies_verified,
        needsVerification: false,
        verification: {
          license: {
            fullName: verification.license_full_name,
            licenseNumber: verification.license_number,
            expiryDate: verification.license_expiry_date,
            frontPhoto: verification.license_front_photo,
            backPhoto: verification.license_back_photo,
            verified: verification.license_verified,
          },
          selfies: {
            frontSelfie: verification.front_selfie,
            leftSelfie: verification.left_selfie,
            rightSelfie: verification.right_selfie,
            verified: verification.selfies_verified,
          },
          createdAt: verification.created_at,
          updatedAt: verification.updated_at,
        },
      });
    } catch (error) {
      console.error("Get verification error:", error);
      next(error);
    }
  }

  /**
   * Upload/Update complete verification (license + selfies)
   * This is saved in settings and reused for all future bookings
   */
  async uploadVerification(req, res, next) {
    try {
      const userId = req.user.userId;
      const {
        // License fields
        fullName,
        licenseNumber,
        expiryDate,
        licenseFrontPhoto,
        licenseBackPhoto,

        // Selfie fields (3 required)
        frontSelfie,
        leftSelfie,
        rightSelfie,
      } = req.body;

      // Validate required fields
      if (
        !fullName ||
        !licenseNumber ||
        !expiryDate ||
        !licenseFrontPhoto ||
        !licenseBackPhoto
      ) {
        return res.status(400).json({
          error: "Missing required license fields",
          required: [
            "fullName",
            "licenseNumber",
            "expiryDate",
            "licenseFrontPhoto",
            "licenseBackPhoto",
          ],
        });
      }

      if (!frontSelfie || !leftSelfie || !rightSelfie) {
        return res.status(400).json({
          error: "All 3 selfies are required (front, left, right)",
          required: ["frontSelfie", "leftSelfie", "rightSelfie"],
        });
      }

      // Validate expiry date
      const expiry = new Date(expiryDate);
      const now = new Date();
      if (expiry <= now) {
        return res.status(400).json({
          error: "License has expired or is expiring today",
        });
      }

      await pool.query(
        `INSERT INTO user_verifications (
          user_id, 
          license_full_name, license_number, license_expiry_date, 
          license_front_photo, license_back_photo, license_verified,
          front_selfie, left_selfie, right_selfie, selfies_verified,
          is_verified
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (user_id) DO UPDATE
        SET license_full_name = EXCLUDED.license_full_name,
            license_number = EXCLUDED.license_number,
            license_expiry_date = EXCLUDED.license_expiry_date,
            license_front_photo = EXCLUDED.license_front_photo,
            license_back_photo = EXCLUDED.license_back_photo,
            license_verified = EXCLUDED.license_verified,
            front_selfie = EXCLUDED.front_selfie,
            left_selfie = EXCLUDED.left_selfie,
            right_selfie = EXCLUDED.right_selfie,
            selfies_verified = EXCLUDED.selfies_verified,
            is_verified = EXCLUDED.is_verified,
            updated_at = NOW()`,
        [
          userId,
          fullName,
          licenseNumber,
          expiryDate,
          licenseFrontPhoto,
          licenseBackPhoto,
          true, // license_verified
          frontSelfie,
          leftSelfie,
          rightSelfie,
          true, // selfies_verified
          true, // is_verified
        ]
      );

      console.log(`✅ Verification saved for user: ${userId}`);

      res.json({
        message: "Verification saved successfully",
        isVerified: true,
        canBookNow: true,
      });
    } catch (error) {
      console.error("Upload verification error:", error);
      next(error);
    }
  }

  // ==================== BOOKING MANAGEMENT ====================

  /**
   * Create new booking
   * Requires: vehicleId only (owner is fetched from vehicle)
   * Checks: User must have verified license + selfies
   */
  async createBooking(req, res, next) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const userId = req.user.userId;
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

      // 1. Check if user has complete verification
      const verificationResult = await client.query(
        `SELECT * FROM user_verifications 
         WHERE user_id = $1 AND is_verified = true AND license_verified = true AND selfies_verified = true`,
        [userId]
      );

      if (verificationResult.rows.length === 0) {
        return res.status(400).json({
          error:
            "Please complete verification (license + selfies) before booking",
          requiresVerification: true,
          needsLicense: true,
          needsSelfies: true,
        });
      }

      // Check license expiry
      const verification = verificationResult.rows[0];
      const expiryDate = new Date(verification.license_expiry_date);
      const now = new Date();

      if (expiryDate <= now) {
        return res.status(400).json({
          error:
            "Your driving license has expired. Please update it in settings.",
          requiresLicenseUpdate: true,
        });
      }

      // 2. Validate dates
      const start = new Date(startDate);
      const end = new Date(endDate);

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

      // 3. Get vehicle details (including owner's user_id)
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
      const vehicleOwnerId = vehicle.user_id; // Owner is stored as user_id in vehicles table

      // Prevent booking own vehicle
      if (vehicleOwnerId === userId) {
        return res.status(400).json({
          error: "You cannot book your own vehicle",
        });
      }

      console.log(
        `📝 Booking: customer=${userId}, vehicleOwner=${vehicleOwnerId}, vehicle=${vehicleId}`
      );

      // 4. Calculate pricing
      const rentalPrice = vehicle.daily_rate * days;
      const insuranceFee = Math.round(rentalPrice * (insuranceCoverage / 100));
      const total = rentalPrice + insuranceFee;
      const deposit = Math.round(total * 0.3); // 30% deposit
      const remainingPayment = total - deposit;

      // 5. Create booking
      const bookingId = uuidv4();
      const bookingResult = await client.query(
        `INSERT INTO bookings (
          booking_id, customer_id, vehicle_id,
          start_date, end_date, duration_days,
          pickup_location, dropoff_location,
          driver_required, insurance_coverage,
          rental_price, insurance_fee, total_amount,
          deposit_amount, remaining_payment,
          payment_method_id, additional_notes,
          status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        RETURNING *`,
        [
          bookingId,
          userId, // customer_id
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
          "pending", // Waiting for owner approval
        ]
      );

      await client.query("COMMIT");

      console.log(`✅ Booking created: ${bookingId}`);

      res.status(201).json({
        message: "Booking created successfully, waiting for owner approval",
        booking: {
          id: bookingId,
          vehicleId: vehicleId,
          vehicleName: vehicle.name,
          customerId: userId,
          vehicleOwnerId: vehicleOwnerId, // Return owner ID in response
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

  /**
   * Get customer's bookings
   */
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
          v.name as vehicle_name, 
          v.photo as vehicle_photo,
          v.user_id as vehicle_owner_id
        FROM bookings b
        JOIN vehicles v ON b.vehicle_id = v.vehicle_id
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
          status: row.status,
          vehicle: {
            id: row.vehicle_id,
            name: row.vehicle_name,
            photo: row.vehicle_photo,
            ownerId: row.vehicle_owner_id,
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
          canReview:
            row.status === "completed" &&
            (!row.vehicle_reviewed || !row.owner_reviewed),
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

  /**
   * Get booking details by ID
   */
  async getBookingById(req, res, next) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;

      const result = await pool.query(
        `SELECT 
          b.*,
          v.name as vehicle_name, 
          v.photo as vehicle_photo, 
          v.transmission, 
          v.seats, 
          v.fuel_type, 
          v.location as vehicle_location,
          v.user_id as vehicle_owner_id
        FROM bookings b
        JOIN vehicles v ON b.vehicle_id = v.vehicle_id
        WHERE b.booking_id = $1 AND (b.customer_id = $2 OR v.user_id = $2)`,
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
          status: booking.status,
          vehicle: {
            id: booking.vehicle_id,
            name: booking.vehicle_name,
            photo: booking.vehicle_photo,
            transmission: booking.transmission,
            seats: booking.seats,
            fuelType: booking.fuel_type,
            location: booking.vehicle_location,
            ownerId: booking.vehicle_owner_id,
          },
          customerId: booking.customer_id,
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
          canReview:
            booking.status === "completed" &&
            (!booking.vehicle_reviewed || !booking.owner_reviewed),
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

  // ==================== BOOKING ACTIONS ====================

  /**
   * Confirm car pickup (changes status to on-journey)
   */
  async confirmPickup(req, res, next) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const userId = req.user.userId;
      const { id } = req.params;
      const { pickupPhotos, odometerReading, notes } = req.body;

      if (!pickupPhotos || pickupPhotos.length < 3) {
        return res.status(400).json({
          error: "Please upload at least 3 photos of the car",
        });
      }

      const bookingResult = await client.query(
        "SELECT * FROM bookings WHERE booking_id = $1 AND customer_id = $2",
        [id, userId]
      );

      if (bookingResult.rows.length === 0) {
        return res.status(404).json({ error: "Booking not found" });
      }

      const booking = bookingResult.rows[0];

      if (booking.status !== "booking") {
        return res.status(400).json({
          error: `Cannot confirm pickup. Current status: ${booking.status}. Expected: booking`,
        });
      }

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

  /**
   * Confirm car return (changes status to completed)
   */
  async confirmReturn(req, res, next) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const userId = req.user.userId;
      const { id } = req.params;
      const { returnPhotos, odometerReading, notes } = req.body;

      if (!returnPhotos || returnPhotos.length < 3) {
        return res.status(400).json({
          error: "Please upload at least 3 photos of the car",
        });
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

  /**
   * Cancel booking
   */
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

  /**
   * Sign contract (only on booking day)
   */
  async signContract(req, res, next) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const userId = req.user.userId;
      const { id } = req.params;
      const { signature, agreedToTerms } = req.body;

      if (!agreedToTerms) {
        return res.status(400).json({
          error: "You must agree to the terms and conditions",
        });
      }

      const bookingResult = await client.query(
        "SELECT * FROM bookings WHERE booking_id = $1 AND customer_id = $2",
        [id, userId]
      );

      if (bookingResult.rows.length === 0) {
        return res.status(404).json({ error: "Booking not found" });
      }

      const booking = bookingResult.rows[0];

      if (booking.status !== "booking") {
        return res.status(400).json({
          error: "Contract can only be signed for confirmed bookings",
        });
      }

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
