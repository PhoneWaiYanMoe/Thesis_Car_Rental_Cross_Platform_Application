// Backend/booking-service/src/controllers/booking_controller.js
const pool = require("../config/database");
const { v4: uuidv4 } = require("uuid");

class BookingController {
  // Create new booking
  async createBooking(req, res, next) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const userId = req.user.userId;
      const userEmail = req.user.email || 'unknown@example.com';
      const userRole = req.user.role || 'customer';
      const {
        vehicleId,
        startDate,
        endDate,
        pickupLocation,
        dropoffLocation,
        driverRequired,
        insuranceCoverage,
        paymentMethodId,
        additionalNotes
      } = req.body;

      // Ensure user exists in booking service's users table (upsert)
      await client.query(
        `INSERT INTO users (user_id, email, full_name, role)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id) DO UPDATE
         SET email = EXCLUDED.email,
             role = EXCLUDED.role`,
        [userId, userEmail, req.user.fullName || userEmail.split('@')[0], userRole]
      );

      // Validate dates
      const start = new Date(startDate);
      const end = new Date(endDate);
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

      if (days <= 0) {
        return res.status(400).json({ error: "Invalid date range" });
      }

      // Get vehicle details
      const vehicleResult = await client.query(
        'SELECT * FROM vehicles WHERE vehicle_id = $1 AND is_active = true',
        [vehicleId]
      );

      if (vehicleResult.rows.length === 0) {
        return res.status(404).json({ error: "Vehicle not found or not available" });
      }

      const vehicle = vehicleResult.rows[0];

      // Ensure vehicle owner exists in users table (upsert)
      // Note: Owner info might not be available, so we'll use minimal data
      await client.query(
        `INSERT INTO users (user_id, email, full_name, role)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id) DO NOTHING`,
        [vehicle.owner_id, `owner-${vehicle.owner_id}@wiz.com`, 'Vehicle Owner', 'owner']
      );

      // Calculate pricing
      const rentalPrice = vehicle.daily_rate * days;
      const insuranceFee = Math.round(rentalPrice * (insuranceCoverage / 100));
      const total = rentalPrice + insuranceFee;
      const deposit = Math.round(total * 0.3); // 30% deposit
      const remainingPayment = total - deposit;

      // Generate rental ID (8-digit)
      const rentalId = Math.floor(10000000 + Math.random() * 90000000).toString();

      // Create booking
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
          bookingId, rentalId, userId, vehicle.owner_id, vehicleId,
          startDate, endDate, days,
          JSON.stringify(pickupLocation), JSON.stringify(dropoffLocation),
          driverRequired, insuranceCoverage,
          rentalPrice, insuranceFee, total,
          deposit, remainingPayment,
          paymentMethodId, additionalNotes,
          'pending_license_verification'
        ]
      );

      await client.query('COMMIT');

      res.status(201).json({
        message: "Booking created successfully",
        booking: {
          id: bookingId,
          rentalId: rentalId,
          vehicleId: vehicleId,
          vehicleName: vehicle.name,
          customerId: userId,
          ownerId: vehicle.owner_id,
          status: 'pending_license_verification',
          startDate: startDate,
          endDate: endDate,
          duration: `${days} days`,
          pricing: {
            rentalPrice,
            insuranceFee,
            dailyTotal: vehicle.daily_rate,
            numberOfDays: days,
            subtotal: total,
            deposit,
            paymentAfterReceiving: remainingPayment,
            total
          },
          depositPaid: false,
          finalPaymentPending: true
        },
        nextStep: "upload_license"
      });

    } catch (error) {
      await client.query('ROLLBACK');
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
      const { status = 'all', search, sortBy = 'newest', page = 1, limit = 10 } = req.query;

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

      if (status !== 'all') {
        query += ` AND b.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      if (search) {
        query += ` AND v.name ILIKE $${paramIndex}`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      query += ` ORDER BY b.created_at ${sortBy === 'oldest' ? 'ASC' : 'DESC'}`;
      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, (page - 1) * limit);

      const result = await pool.query(query, params);

      // Get total count
      const countResult = await pool.query(
        'SELECT COUNT(*) FROM bookings WHERE customer_id = $1',
        [userId]
      );

      res.json({
        bookings: result.rows.map(row => ({
          id: row.booking_id,
          rentalId: row.rental_id,
          status: row.status,
          vehicle: {
            id: row.vehicle_id,
            name: row.vehicle_name,
            photo: row.vehicle_photo
          },
          owner: {
            id: row.owner_id,
            name: row.owner_name,
            avatar: row.owner_avatar
          },
          startDate: row.start_date,
          endDate: row.end_date,
          duration: `${row.duration_days} days`,
          pricing: {
            total: row.total_amount,
            depositPaid: row.deposit_amount,
            remainingPayment: row.remaining_payment
          },
          createdAt: row.created_at
        })),
        pagination: {
          total: parseInt(countResult.rows[0].count),
          page: parseInt(page),
          limit: parseInt(limit)
        }
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
          o.full_name as owner_name, o.avatar_url as owner_avatar,
          o.created_at as owner_joined_date
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
            location: booking.vehicle_location
          },
          customer: {
            id: booking.customer_id,
            name: booking.customer_name,
            licenseNumber: booking.license_number || '****00'
          },
          owner: {
            id: booking.owner_id,
            name: booking.owner_name,
            avatar: booking.owner_avatar,
            joinedDate: booking.owner_joined_date
          },
          timeline: {
            startDate: booking.start_date,
            endDate: booking.end_date,
            duration: `${booking.duration_days} days`
          },
          pickup: JSON.parse(booking.pickup_location),
          dropoff: JSON.parse(booking.dropoff_location),
          billing: {
            rentalPrice: booking.rental_price,
            insuranceFee: booking.insurance_fee,
            dailyRate: Math.round(booking.rental_price / booking.duration_days),
            numberOfDays: booking.duration_days,
            subtotal: booking.total_amount,
            deposit: booking.deposit_amount,
            depositStatus: booking.deposit_paid ? 'paid' : 'pending',
            finalPayment: booking.remaining_payment,
            finalPaymentStatus: booking.final_payment_paid ? 'paid' : 'pending'
          },
          insurance: {
            coverage: booking.insurance_coverage
          },
          additionalMessage: booking.additional_notes,
          canRate: booking.status === 'completed' && !booking.rated,
          canCancel: ['pending_license_verification', 'pending_owner_approval', 'confirmed'].includes(booking.status)
        }
      });

    } catch (error) {
      console.error("Get booking error:", error);
      next(error);
    }
  }

  // Upload driving license
  async uploadLicense(req, res, next) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      const { fullName, licenseNumber, expiryDate } = req.body;

      // In production, handle file uploads with multer
      // const frontPhoto = req.files.frontPhoto;
      // const backPhoto = req.files.backPhoto;

      const result = await pool.query(
        `UPDATE bookings 
         SET license_full_name = $1, 
             license_number = $2, 
             license_expiry_date = $3,
             license_front_photo = $4,
             license_back_photo = $5,
             status = 'pending_support_approval',
             updated_at = NOW()
         WHERE booking_id = $6 AND customer_id = $7
         RETURNING *`,
        [fullName, licenseNumber, expiryDate, 'front-photo-url', 'back-photo-url', id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Booking not found" });
      }

      res.json({
        message: "License uploaded, pending verification",
        bookingStatus: "pending_support_approval"
      });

    } catch (error) {
      console.error("Upload license error:", error);
      next(error);
    }
  }

  // Confirm pickup
  async confirmPickup(req, res, next) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      const { conditionPhotos, conditionNotes, odometerReading } = req.body;

      const result = await pool.query(
        `UPDATE bookings 
         SET pickup_condition_photos = $1,
             pickup_condition_notes = $2,
             pickup_odometer_reading = $3,
             pickup_confirmed_at = NOW(),
             status = 'active',
             updated_at = NOW()
         WHERE booking_id = $4 AND customer_id = $5
         RETURNING *`,
        [JSON.stringify(conditionPhotos), conditionNotes, odometerReading, id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Booking not found" });
      }

      res.json({
        message: "Pickup confirmed",
        bookingStatus: "active"
      });

    } catch (error) {
      console.error("Confirm pickup error:", error);
      next(error);
    }
  }

  // Confirm return
  async confirmReturn(req, res, next) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      const { returnPhotos, odometerReading, notes } = req.body;

      const result = await pool.query(
        `UPDATE bookings 
         SET return_photos = $1,
             return_odometer_reading = $2,
             return_notes = $3,
             return_confirmed_at = NOW(),
             status = 'pending_owner_confirmation',
             updated_at = NOW()
         WHERE booking_id = $4 AND customer_id = $5
         RETURNING remaining_payment`,
        [JSON.stringify(returnPhotos), odometerReading, notes, id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Booking not found" });
      }

      res.json({
        message: "Return confirmed, awaiting owner confirmation",
        bookingStatus: "pending_owner_confirmation",
        finalPaymentDue: result.rows[0].remaining_payment
      });

    } catch (error) {
      console.error("Confirm return error:", error);
      next(error);
    }
  }

  // Cancel booking
  async cancelBooking(req, res, next) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const userId = req.user.userId;
      const { id } = req.params;
      const { reason, requestRefund = true } = req.body;

      const bookingResult = await client.query(
        'SELECT * FROM bookings WHERE booking_id = $1 AND customer_id = $2',
        [id, userId]
      );

      if (bookingResult.rows.length === 0) {
        return res.status(404).json({ error: "Booking not found" });
      }

      const booking = bookingResult.rows[0];

      // Calculate refund based on cancellation policy
      let refundAmount = 0;
      const now = new Date();
      const startDate = new Date(booking.start_date);
      const hoursUntilStart = (startDate - now) / (1000 * 60 * 60);

      if (hoursUntilStart > 24) {
        refundAmount = booking.deposit_paid ? booking.deposit_amount : 0;
      } else if (hoursUntilStart > 12) {
        refundAmount = booking.deposit_paid ? Math.round(booking.deposit_amount * 0.5) : 0;
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
        [reason, refundAmount, refundAmount > 0 ? 'processing' : 'none', id]
      );

      await client.query('COMMIT');

      res.json({
        message: "Booking cancelled",
        refundAmount,
        refundStatus: refundAmount > 0 ? 'processing' : 'none'
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error("Cancel booking error:", error);
      next(error);
    } finally {
      client.release();
    }
  }

  // Sign contract
  async signContract(req, res, next) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      const { signature, agreedToTerms } = req.body;

      if (!agreedToTerms) {
        return res.status(400).json({ error: "Must agree to terms" });
      }

      const result = await pool.query(
        `UPDATE bookings 
         SET customer_signature = $1,
             contract_signed_at = NOW(),
             updated_at = NOW()
         WHERE booking_id = $2 AND customer_id = $3
         RETURNING *`,
        [signature, id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Booking not found" });
      }

      res.json({
        message: "Contract signed",
        contractUrl: `https://cdn.com/contracts/contract-${id}.pdf`
      });

    } catch (error) {
      console.error("Sign contract error:", error);
      next(error);
    }
  }
}

module.exports = new BookingController();