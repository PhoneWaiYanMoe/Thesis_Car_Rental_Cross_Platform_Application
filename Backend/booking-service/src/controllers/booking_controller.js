// Backend/booking-service/src/controllers/booking_controller.js
const pool = require("../config/database");
const { v4: uuidv4 } = require("uuid");
const vehicleGrpcClient = require("../grpc/vehicle_grpc_client");

class BookingController {
  // ==================== HELPER FUNCTIONS ====================

  async syncVehicleUnavailability(
    vehicleId,
    startDate,
    endDate,
    bookingId,
    action = "add"
  ) {
    try {
      const response = await vehicleGrpcClient.syncUnavailability(
        vehicleId,
        startDate,
        endDate,
        bookingId,
        action
      );
      console.log(
        `✅ Vehicle unavailability ${action}: ${vehicleId} (${startDate} to ${endDate})`
      );
      return response;
    } catch (error) {
      console.error(
        `⚠️  Could not sync vehicle unavailability: ${error.message}`
      );
      return null;
    }
  }

  async incrementTotalRentals(vehicleId) {
    try {
      await vehicleGrpcClient.incrementTotalRentals(vehicleId);
      console.log(`✅ Incremented total rentals for vehicle: ${vehicleId}`);
    } catch (error) {
      console.error(`⚠️  Could not increment total rentals: ${error.message}`);
    }
  }

  // ==================== VERIFICATION ROUTES ====================

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

  async uploadVerification(req, res, next) {
    try {
      const userId = req.user.userId;
      const {
        fullName,
        licenseNumber,
        expiryDate,
        licenseFrontPhoto,
        licenseBackPhoto,
        frontSelfie,
        leftSelfie,
        rightSelfie,
      } = req.body;

      if (
        !fullName ||
        !licenseNumber ||
        !expiryDate ||
        !licenseFrontPhoto ||
        !licenseBackPhoto
      ) {
        return res.status(400).json({
          error: "Missing required license fields",
        });
      }

      if (!frontSelfie || !leftSelfie || !rightSelfie) {
        return res.status(400).json({
          error: "All 3 selfies are required (front, left, right)",
        });
      }

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
          true,
          frontSelfie,
          leftSelfie,
          rightSelfie,
          true,
          true,
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

      // Check verification
      const verificationResult = await client.query(
        `SELECT * FROM user_verifications 
         WHERE user_id = $1 AND is_verified = true`,
        [userId]
      );

      if (verificationResult.rows.length === 0) {
        return res.status(400).json({
          error: "Please complete verification before booking",
          requiresVerification: true,
        });
      }

      const verification = verificationResult.rows[0];
      const expiryDate = new Date(verification.license_expiry_date);
      const now = new Date();

      if (expiryDate <= now) {
        return res.status(400).json({
          error: "Your driving license has expired",
          requiresLicenseUpdate: true,
        });
      }

      // Validate dates
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

      // FETCH VEHICLE FROM VEHICLE-SERVICE VIA GRPC
      let vehicle;
      try {
        vehicle = await vehicleGrpcClient.getVehicleInfo(vehicleId);
      } catch (error) {
        return res.status(404).json({
          error: "Vehicle not found or not available",
          details: error.message,
        });
      }

      if (vehicle.status !== "active") {
        return res.status(400).json({
          error: "Vehicle is not available for booking",
        });
      }

      const vehicleOwnerId = vehicle.owner_id;

      if (vehicleOwnerId === userId) {
        return res.status(400).json({ error: "Cannot book your own vehicle" });
      }

      // CHECK VEHICLE AVAILABILITY VIA GRPC
      try {
        const availability = await vehicleGrpcClient.checkAvailability(
          vehicleId,
          startDate,
          endDate
        );

        if (!availability.is_available) {
          return res.status(400).json({
            error: "Vehicle is not available for selected dates",
            unavailablePeriods: availability.unavailable_periods,
          });
        }
      } catch (error) {
        console.warn("⚠️  Could not check availability:", error.message);
      }

      // Calculate pricing
      const rentalPrice = vehicle.price_per_day * days;
      const insuranceFee = Math.round(rentalPrice * (insuranceCoverage / 100));
      const total = rentalPrice + insuranceFee;
      const deposit = Math.round(total * 0.3);
      const remainingPayment = total - deposit;

      // Create booking
      const bookingId = uuidv4();
      await client.query(
        `INSERT INTO bookings (
          booking_id, customer_id, vehicle_id,
          start_date, end_date, duration_days,
          pickup_location, dropoff_location,
          driver_required, insurance_coverage,
          rental_price, insurance_fee, total_amount,
          deposit_amount, remaining_payment,
          payment_method_id, additional_notes,
          status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
        [
          bookingId,
          userId,
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
          "pending",
        ]
      );

      await client.query("COMMIT");

      // SYNC TO VEHICLE UNAVAILABILITY
      await this.syncVehicleUnavailability(
        vehicleId,
        startDate,
        endDate,
        bookingId,
        "add"
      );

      console.log(`✅ Booking created: ${bookingId}`);

      res.status(201).json({
        message: "Booking created successfully",
        booking: {
          id: bookingId,
          vehicleId: vehicleId,
          vehicleName: vehicle.name,
          customerId: userId,
          vehicleOwnerId: vehicleOwnerId,
          status: "pending",
          startDate: startDate,
          endDate: endDate,
          duration: `${days} days`,
          pricing: {
            rentalPrice,
            insuranceFee,
            total,
            deposit,
            remainingPayment,
          },
        },
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Create booking error:", error);
      next(error);
    } finally {
      client.release();
    }
  }

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
          b.booking_id,
          b.vehicle_id,
          b.status,
          b.start_date,
          b.end_date,
          b.duration_days,
          b.total_amount,
          b.deposit_amount,
          b.remaining_payment,
          b.deposit_paid,
          b.vehicle_reviewed,
          b.owner_reviewed,
          b.created_at
        FROM bookings b
        WHERE b.customer_id = $1
      `;

      const params = [userId];
      let paramIndex = 2;

      if (status !== "all") {
        query += ` AND b.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      query += ` ORDER BY b.created_at ${sortBy === "oldest" ? "ASC" : "DESC"}`;
      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

      const result = await pool.query(query, params);

      // Fetch vehicle info for all bookings via gRPC
      const vehicleIds = [...new Set(result.rows.map((row) => row.vehicle_id))];
      let vehicles = {};

      try {
        const vehiclesList = await vehicleGrpcClient.getVehiclesInfo(
          vehicleIds
        );
        vehiclesList.forEach((v) => {
          vehicles[v.vehicle_id] = v;
        });
      } catch (error) {
        console.warn("⚠️  Could not fetch vehicle info:", error.message);
      }

      const countResult = await pool.query(
        "SELECT COUNT(*) FROM bookings WHERE customer_id = $1",
        [userId]
      );

      const now = new Date();

      res.json({
        bookings: result.rows.map((row) => {
          const vehicle = vehicles[row.vehicle_id] || {
            name: "Unknown Vehicle",
            owner_id: null,
          };

          return {
            id: row.booking_id,
            status: row.status,
            vehicle: {
              id: row.vehicle_id,
              name: vehicle.name,
              ownerId: vehicle.owner_id,
            },
            startDate: row.start_date,
            endDate: row.end_date,
            duration: `${row.duration_days} days`,
            pricing: {
              total: row.total_amount,
              deposit: row.deposit_amount,
              remainingPayment: row.remaining_payment,
              depositPaid: row.deposit_paid,
            },
            canCancel:
              ["pending", "booking"].includes(row.status) &&
              new Date(row.start_date) > now,
            canReview:
              row.status === "completed" &&
              (!row.vehicle_reviewed || !row.owner_reviewed),
            createdAt: row.created_at,
          };
        }),
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

  async getBookingById(req, res, next) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;

      const result = await pool.query(
        `SELECT b.* FROM bookings b WHERE b.booking_id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Booking not found" });
      }

      const booking = result.rows[0];

      // Fetch vehicle info via gRPC
      let vehicle;
      try {
        vehicle = await vehicleGrpcClient.getVehicleInfo(booking.vehicle_id);
      } catch (error) {
        vehicle = { name: "Unknown Vehicle", owner_id: null };
      }

      // Check authorization
      if (booking.customer_id !== userId && vehicle.owner_id !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const now = new Date();
      const startDate = new Date(booking.start_date);

      // Parse JSON safely
      let pickupLocation = null;
      let dropoffLocation = null;
      let pickupPhotos = null;
      let returnPhotos = null;

      try {
        pickupLocation =
          typeof booking.pickup_location === "string"
            ? JSON.parse(booking.pickup_location)
            : booking.pickup_location;
      } catch (e) {
        console.error("Failed to parse pickup_location:", e);
      }

      try {
        dropoffLocation =
          typeof booking.dropoff_location === "string"
            ? JSON.parse(booking.dropoff_location)
            : booking.dropoff_location;
      } catch (e) {
        console.error("Failed to parse dropoff_location:", e);
      }

      try {
        if (booking.pickup_condition_photos) {
          pickupPhotos =
            typeof booking.pickup_condition_photos === "string"
              ? JSON.parse(booking.pickup_condition_photos)
              : booking.pickup_condition_photos;
        }
      } catch (e) {
        console.error("Failed to parse pickup_condition_photos:", e);
      }

      try {
        if (booking.return_photos) {
          returnPhotos =
            typeof booking.return_photos === "string"
              ? JSON.parse(booking.return_photos)
              : booking.return_photos;
        }
      } catch (e) {
        console.error("Failed to parse return_photos:", e);
      }

      res.json({
        booking: {
          id: booking.booking_id,
          status: booking.status,
          vehicle: {
            id: booking.vehicle_id,
            name: vehicle.name,
            ownerId: vehicle.owner_id,
          },
          customerId: booking.customer_id,
          timeline: {
            startDate: booking.start_date,
            endDate: booking.end_date,
            duration: `${booking.duration_days} days`,
            isBookingDay: startDate.toDateString() === now.toDateString(),
          },
          pickup: pickupLocation,
          dropoff: dropoffLocation,
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
          pickupPhotos: pickupPhotos,
          returnPhotos: returnPhotos,
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

  async confirmPickup(req, res, next) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const userId = req.user.userId;
      const { id } = req.params;
      const { pickupPhotos, odometerReading, notes } = req.body;

      if (
        !pickupPhotos ||
        !Array.isArray(pickupPhotos) ||
        pickupPhotos.length < 3
      ) {
        return res.status(400).json({
          error: "Please provide at least 3 pickup photos as an array",
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
          error: `Cannot confirm pickup. Current status: ${booking.status}`,
        });
      }

      if (!booking.contract_signed_at) {
        return res.status(400).json({
          error: "Please sign the contract before pickup",
        });
      }

      await client.query(
        `UPDATE bookings 
         SET pickup_condition_photos = $1,
             pickup_condition_notes = $2,
             pickup_odometer_reading = $3,
             pickup_confirmed_at = NOW(),
             status = 'picked_up',
             updated_at = NOW()
         WHERE booking_id = $4`,
        [JSON.stringify(pickupPhotos), notes, odometerReading, id]
      );

      await client.query("COMMIT");

      res.json({
        message: "Car pickup confirmed. Have a safe journey!",
        bookingStatus: "picked_up",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Confirm pickup error:", error);
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
      const { id } = req.params;
      const { returnPhotos, odometerReading, notes } = req.body;

      if (
        !returnPhotos ||
        !Array.isArray(returnPhotos) ||
        returnPhotos.length < 3
      ) {
        return res.status(400).json({
          error: "Please provide at least 3 return photos as an array",
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

      if (booking.status !== "picked_up") {
        return res.status(400).json({
          error: `Cannot confirm return. Current status: ${booking.status}. Expected: picked_up`,
        });
      }

      await client.query(
        `UPDATE bookings 
         SET return_photos = $1,
             return_odometer_reading = $2,
             return_notes = $3,
             return_confirmed_at = NOW(),
             status = 'return_submitted',
             updated_at = NOW()
         WHERE booking_id = $4`,
        [JSON.stringify(returnPhotos), odometerReading, notes, id]
      );

      await client.query("COMMIT");

      res.json({
        message: "Return submitted. Waiting for owner confirmation.",
        bookingStatus: "return_submitted",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Confirm return error:", error);
      next(error);
    } finally {
      client.release();
    }
  }

 
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

    // ✅ VERIFIED: Remove from vehicle unavailability (already present)
    try {
      await vehicleGrpcClient.syncUnavailability(
        booking.vehicle_id,
        booking.start_date,
        booking.end_date,
        id,
        "remove"
      );
      console.log(`✅ Removed unavailability after customer cancellation: ${id}`);
    } catch (error) {
      console.error(`⚠️  Could not remove unavailability: ${error.message}`);
      // Don't fail the cancellation - log and continue
    }

    res.json({
      message: "Booking cancelled successfully",
      refundAmount,
      refundStatus: refundAmount > 0 ? "processing" : "none",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Cancel booking error:", error);
    next(error);
  } finally {
    client.release();
  }
}

  async signContract(req, res, next) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const userId = req.user.userId;
      const { id } = req.params;
      const { signature, agreedToTerms } = req.body;

      if (!agreedToTerms) {
        return res.status(400).json({
          error: "You must agree to the terms",
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
