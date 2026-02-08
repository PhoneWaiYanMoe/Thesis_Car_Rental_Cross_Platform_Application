// Backend/vehicle-service/src/controllers/owner_vehicle_controller.js
const pool = require("../config/database");
const { v4: uuidv4 } = require("uuid");
const eventEmitter = require("../utils/eventEmitter");
const userGrpcClient = require("../grpc/user_grpc_client");


class OwnerVehicleController {
  /**
   * GET /vehicles/owner/:ownerId/vehicles
   * Get all vehicles belonging to an owner
   */
  async getVehiclesByOwnerId(req, res, next) {
    try {
      const { ownerId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      // Verify ownership if not admin
      if (req.user.role !== "admin" && req.user.userId !== ownerId) {
        return res.status(403).json({
          error: "Access denied. You can only view your own vehicles.",
        });
      }

      const result = await pool.query(
        `SELECT 
        v.*,
        (SELECT photo_url FROM vehicle_photos 
         WHERE vehicle_id = v.vehicle_id AND is_primary = true 
         LIMIT 1) as primary_photo
       FROM vehicles v
       WHERE v.owner_id = $1
       ORDER BY v.created_at DESC
       LIMIT $2 OFFSET $3`,
        [ownerId, parseInt(limit), (parseInt(page) - 1) * parseInt(limit)],
      );

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM vehicles WHERE owner_id = $1`,
        [ownerId],
      );

      res.json({
        vehicles: result.rows.map((v) => ({
          id: v.vehicle_id,
          name: v.name,
          ownerId: v.owner_id,
          vehicleType: v.vehicle_type,
          status: v.status,
          verificationStatus: v.verification_status,
          transmission: v.transmission,
          fuelType: v.fuel_type,
          seats: v.seats,
          year: v.year,
          pricePerDay: v.price_per_day,
          rating: parseFloat(v.average_rating),
          totalRentals: v.total_rentals,
          totalRevenue: parseInt(v.total_revenue_earned || 0),
          primaryPhoto: v.primary_photo,
          createdAt: v.created_at,
          lastVerified: v.last_verified_at,
          nextVerificationDue: v.next_verification_due,
        })),
        pagination: {
          total: parseInt(countResult.rows[0].count),
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(
            parseInt(countResult.rows[0].count) / parseInt(limit),
          ),
        },
      });
    } catch (error) {
      console.error("❌ Get vehicles by owner error:", error);
      next(error);
    }
  }

  /**
   * POST /owner
   * Create new vehicle listing
   */
  async createVehicle(req, res, next) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const userId = req.user.userId;
      const userRole = req.user.role;

      if (userRole !== "owner" && userRole !== "admin") {
        return res.status(403).json({
          error: "Only vehicle owners and admin can create listings",
          requiredRole: "owner",
        });
      }

      const {
        name,
        description,
        vehicleType,
        transmission,
        fuelType,
        seats,
        year,
        mileage,
        licensePlate,
        pricePerDay,
        location,
        features,
        rules,
        driverSupported,
        instantBooking,
        deliveryAvailable,
        photoIds,
        documentIds,
      } = req.body;

      const vehicleId = uuidv4();

      // Set next verification due date (2 months from now)
      const nextVerificationDue = new Date();
      nextVerificationDue.setMonth(nextVerificationDue.getMonth() + 2);

      // ✅ NEW: Vehicle starts with 'unverified' status
      await client.query(
        `INSERT INTO vehicles (
          vehicle_id, owner_id, name, description,
          vehicle_type, transmission, fuel_type, seats, year, mileage, license_plate,
          price_per_day, location, features, rules,
          driver_supported, instant_booking, delivery_available,
          status, verification_status, next_verification_due
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)`,
        [
          vehicleId,
          userId,
          name,
          description,
          vehicleType,
          transmission,
          fuelType,
          seats,
          year,
          mileage,
          licensePlate,
          pricePerDay,
          JSON.stringify(location),
          JSON.stringify(features || []),
          JSON.stringify(rules || {}),
          driverSupported || false,
          instantBooking || false,
          deliveryAvailable || false,
          "active", // Default status is active
          "unverified", // ✅ NEW: Default verification status is unverified
          nextVerificationDue,
        ],
      );

      // Insert photos if provided
      if (photoIds && photoIds.length > 0) {
        for (let i = 0; i < photoIds.length; i++) {
          await client.query(
            `INSERT INTO vehicle_photos (vehicle_id, photo_url, is_primary, display_order)
             VALUES ($1, $2, $3, $4)`,
            [vehicleId, photoIds[i], i === 0, i + 1],
          );
        }
      }

      await client.query("COMMIT");

      console.log(`✅ Vehicle created by owner ${userId}: ${vehicleId}`);

      // ✅ Emit vehicle.created event
      await eventEmitter.emit("vehicle.created", {
        vehicleId,
        ownerId: userId,
        name,
        vehicleType,
        status: "active",
        verificationStatus: "unverified",
        pricePerDay,
      });

      res.status(201).json({
        message: "Vehicle created successfully",
        vehicleId: vehicleId,
        status: "active",
        verificationStatus: "unverified",
      });
    } catch (error) {
      await client.query("ROLLBACK");

      if (error.code === "23505") {
        return res.status(400).json({
          error: "License plate already exists",
        });
      }

      console.error("❌ Create vehicle error:", error);
      next(error);
    } finally {
      client.release();
    }
  }

  /**
   * GET /owner/my-vehicles
   * Get owner's vehicles
   */
  async getMyVehicles(req, res, next) {
    try {
      const userId = req.user.userId;
      const {
        status = "all",
        sortBy = "name",
        page = 1,
        limit = 20,
      } = req.query;

      let query = `
        SELECT 
          v.*,
          (SELECT photo_url FROM vehicle_photos 
           WHERE vehicle_id = v.vehicle_id AND is_primary = true 
           LIMIT 1) as primary_photo
        FROM vehicles v
        WHERE v.owner_id = $1
      `;

      const params = [userId];
      let paramIndex = 2;

      if (status !== "all") {
        query += ` AND v.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      const sortFields = {
        name: "v.name",
        rentals: "v.total_rentals",
        rating: "v.average_rating",
        price: "v.price_per_day",
        revenue: "v.total_revenue_earned",
      };

      query += ` ORDER BY ${sortFields[sortBy] || "v.name"} DESC`;
      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

      const result = await pool.query(query, params);

      // Get total count
      let countQuery = "SELECT COUNT(*) FROM vehicles WHERE owner_id = $1";
      const countParams = [userId];

      if (status !== "all") {
        countQuery += " AND status = $2";
        countParams.push(status);
      }

      const countResult = await pool.query(countQuery, countParams);

      res.json({
        vehicles: result.rows.map((vehicle) => ({
          id: vehicle.vehicle_id,
          name: vehicle.name,
          status: vehicle.status,
          verificationStatus: vehicle.verification_status,
          pricePerDay: vehicle.price_per_day,
          rating: parseFloat(vehicle.average_rating),
          totalRentals: vehicle.total_rentals,
          totalRevenue: parseInt(vehicle.total_revenue_earned || 0),
          primaryPhoto: vehicle.primary_photo,
          createdAt: vehicle.created_at,
          lastVerified: vehicle.last_verified_at,
          nextVerificationDue: vehicle.next_verification_due,
          verificationNotes: vehicle.verification_notes,
        })),
        pagination: {
          total: parseInt(countResult.rows[0].count),
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(
            parseInt(countResult.rows[0].count) / parseInt(limit),
          ),
        },
      });
    } catch (error) {
      console.error("❌ Get my vehicles error:", error);
      next(error);
    }
  }

  /**
   * GET /owner/:id
   * Get detailed info of owner's vehicle
   */
  async getMyVehicleById(req, res, next) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;

      const result = await pool.query(
        `SELECT v.*,
          (SELECT json_agg(json_build_object(
            'url', photo_url,
            'isPrimary', is_primary,
            'order', display_order
          ) ORDER BY display_order) 
           FROM vehicle_photos 
           WHERE vehicle_id = v.vehicle_id) as photos,
          (SELECT json_agg(json_build_object(
            'startDate', start_date,
            'endDate', end_date,
            'reason', reason
          ))
           FROM vehicle_unavailability
           WHERE vehicle_id = v.vehicle_id
           AND end_date >= CURRENT_DATE) as unavailable_periods
         FROM vehicles v
         WHERE v.vehicle_id = $1`,
        [id],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: "Vehicle not found or access denied",
        });
      }

      const vehicle = result.rows[0];

      let ownerName = "Vehicle Owner";
      let ownerAvatar = "assets/images/article_2.png";

      try {
        console.log(`📞 Fetching owner info for user ${vehicle.owner_id}...`);
        const ownerProfile = await userGrpcClient.getUserProfile(
          vehicle.owner_id,
        );
        ownerName = ownerProfile.full_name;
        ownerAvatar = ownerProfile.avatar_url || ownerAvatar;
        console.log(`✅ Owner name: ${ownerName}`);
      } catch (error) {
        console.error(
          "⚠️ Failed to fetch owner info via gRPC – using defaults:",
          error.message,
        );
      }

      res.json({
        vehicle: {
          id: vehicle.vehicle_id,
          ownerId: vehicle.owner_id,
          name: vehicle.name,
          description: vehicle.description,
          specifications: {
            vehicleType: vehicle.vehicle_type,
            transmission: vehicle.transmission,
            fuelType: vehicle.fuel_type,
            seats: vehicle.seats,
            year: vehicle.year,
            mileage: vehicle.mileage,
            licensePlate: vehicle.license_plate,
          },
          photos: vehicle.photos || [],
          features: vehicle.features || [],
          pricing: {
            pricePerDay: vehicle.price_per_day,
          },
          location: vehicle.location,
          availability: {
            driverSupported: vehicle.driver_supported,
            instantBooking: vehicle.instant_booking,
            deliveryAvailable: vehicle.delivery_available,
            unavailablePeriods: vehicle.unavailable_periods || [],
          },
          performance: {
            totalRentals: vehicle.total_rentals,
            totalRevenue: parseInt(vehicle.total_revenue_earned || 0),
            rating: parseFloat(vehicle.average_rating),
            reviewCount: vehicle.review_count,
          },
          status: vehicle.status,
          verificationStatus: vehicle.verification_status,
          verificationNotes: vehicle.verification_notes,
          lastVerified: vehicle.last_verified_at,
          nextVerificationDue: vehicle.next_verification_due,
          rules: vehicle.rules || {},
          createdAt: vehicle.created_at,
          updatedAt: vehicle.updated_at,
          bannedReason: vehicle.banned_reason,
          rejectionReason: vehicle.rejection_reason,
          ownerName: ownerName, // FROM gRPC
          ownerAvatar: ownerAvatar,
        },
      });
    } catch (error) {
      console.error("❌ Get my vehicle by ID error:", error);
      next(error);
    }
  }

  /**
   * PUT /owner/:id
   * Update vehicle
   */
  async updateVehicle(req, res, next) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const userId = req.user.userId;
      const { id } = req.params;

      // Verify ownership
      const ownershipResult = await client.query(
        "SELECT owner_id FROM vehicles WHERE vehicle_id = $1",
        [id],
      );

      if (ownershipResult.rows.length === 0) {
        return res.status(404).json({ error: "Vehicle not found" });
      }

      if (
        ownershipResult.rows[0].owner_id !== userId &&
        req.user.role !== "admin"
      ) {
        return res.status(403).json({
          error: "Access denied. You can only update your own vehicles.",
        });
      }

      const {
        name,
        description,
        transmission,
        fuelType,
        seats,
        mileage,
        pricePerDay,
        location,
        features,
        rules,
        vehicleStatus,
        driverSupported,
        instantBooking,
        deliveryAvailable,
      } = req.body;

      const updateFields = [];
      const values = [];
      let paramIndex = 1;

      if (name) {
        updateFields.push(`name = $${paramIndex}`);
        values.push(name);
        paramIndex++;
      }
      if (description !== undefined) {
        updateFields.push(`description = $${paramIndex}`);
        values.push(description);
        paramIndex++;
      }
      if (transmission) {
        updateFields.push(`transmission = $${paramIndex}`);
        values.push(transmission);
        paramIndex++;
      }
      if (fuelType) {
        updateFields.push(`fuel_type = $${paramIndex}`);
        values.push(fuelType);
        paramIndex++;
      }
      if (seats) {
        updateFields.push(`seats = $${paramIndex}`);
        values.push(seats);
        paramIndex++;
      }
      if (mileage) {
        updateFields.push(`mileage = $${paramIndex}`);
        values.push(mileage);
        paramIndex++;
      }
      if (pricePerDay) {
        updateFields.push(`price_per_day = $${paramIndex}`);
        values.push(pricePerDay);
        paramIndex++;
      }
      if (location) {
        updateFields.push(`location = $${paramIndex}`);
        values.push(JSON.stringify(location));
        paramIndex++;
      }
      if (features) {
        updateFields.push(`features = $${paramIndex}`);
        values.push(JSON.stringify(features));
        paramIndex++;
      }
      if (rules) {
        updateFields.push(`rules = $${paramIndex}`);
        values.push(JSON.stringify(rules));
        paramIndex++;
      }
      if (vehicleStatus) {
        updateFields.push(`status = $${paramIndex}`);
        values.push(vehicleStatus);
        paramIndex++;
      }
      if (driverSupported !== undefined) {
        updateFields.push(`driver_supported = $${paramIndex}`);
        values.push(driverSupported);
        paramIndex++;
      }
      if (instantBooking !== undefined) {
        updateFields.push(`instant_booking = $${paramIndex}`);
        values.push(instantBooking);
        paramIndex++;
      }
      if (deliveryAvailable !== undefined) {
        updateFields.push(`delivery_available = $${paramIndex}`);
        values.push(deliveryAvailable);
        paramIndex++;
      }

      if (updateFields.length === 0) {
        return res.status(400).json({ error: "No fields to update" });
      }

      updateFields.push(`updated_at = NOW()`);

      values.push(id);
      const query = `
        UPDATE vehicles 
        SET ${updateFields.join(", ")}
        WHERE vehicle_id = $${paramIndex}
        RETURNING *
      `;

      const result = await client.query(query, values);

      await client.query("COMMIT");

      console.log(`✅ Vehicle ${id} updated by owner ${userId}`);

      // ✅ Emit vehicle.updated event
      await eventEmitter.emit("vehicle.updated", {
        vehicleId: id,
        ownerId: userId,
        updatedFields: Object.keys(req.body),
      });

      res.json({
        message: "Vehicle updated successfully",
        vehicle: {
          id: result.rows[0].vehicle_id,
          name: result.rows[0].name,
          status: result.rows[0].status,
        },
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("❌ Update vehicle error:", error);
      next(error);
    } finally {
      client.release();
    }
  }

  /**
   * DELETE /owner/:id
   * Delete vehicle (soft delete - set status to 'stopped')
   */
  async deleteVehicle(req, res, next) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const userId = req.user.userId;
      const { id } = req.params;

      // Verify ownership
      const ownershipResult = await client.query(
        "SELECT owner_id, status FROM vehicles WHERE vehicle_id = $1",
        [id],
      );

      if (ownershipResult.rows.length === 0) {
        return res.status(404).json({ error: "Vehicle not found" });
      }

      if (ownershipResult.rows[0].owner_id !== userId) {
        return res.status(403).json({
          error: "Access denied. You can only delete your own vehicles.",
        });
      }

      const oldStatus = ownershipResult.rows[0].status;

      // Soft delete by setting status to 'stopped'
      await client.query(
        `UPDATE vehicles 
         SET status = 'stopped', updated_at = NOW()
         WHERE vehicle_id = $1`,
        [id],
      );

      await client.query("COMMIT");

      console.log(`✅ Vehicle ${id} deleted (stopped) by owner ${userId}`);

      // ✅ Emit vehicle.status_changed event
      await eventEmitter.emit("vehicle.status_changed", {
        vehicleId: id,
        ownerId: userId,
        oldStatus,
        newStatus: "stopped",
        reason: "Owner deleted vehicle",
      });

      res.json({
        message: "Vehicle deleted successfully",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("❌ Delete vehicle error:", error);
      next(error);
    } finally {
      client.release();
    }
  }

  /**
   * POST /owner/:id/photos
   * Upload photos for vehicle
   */
  async uploadPhotos(req, res, next) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const userId = req.user.userId;
      const { id } = req.params;
      const { photoUrls } = req.body;

      if (!photoUrls || photoUrls.length === 0) {
        return res.status(400).json({ error: "No photo URLs provided" });
      }

      // Verify ownership
      const ownershipResult = await client.query(
        "SELECT owner_id FROM vehicles WHERE vehicle_id = $1",
        [id],
      );

      if (ownershipResult.rows.length === 0) {
        return res.status(404).json({ error: "Vehicle not found" });
      }

      if (ownershipResult.rows[0].owner_id !== userId) {
        return res.status(403).json({
          error: "Access denied",
        });
      }

      // Get current max display order
      const maxOrderResult = await client.query(
        `SELECT COALESCE(MAX(display_order), 0) as max_order 
         FROM vehicle_photos 
         WHERE vehicle_id = $1`,
        [id],
      );

      let displayOrder = maxOrderResult.rows[0].max_order + 1;

      // Check if there are existing primary photos
      const primaryCheck = await client.query(
        `SELECT COUNT(*) FROM vehicle_photos 
         WHERE vehicle_id = $1 AND is_primary = true`,
        [id],
      );

      const hasPrimary = parseInt(primaryCheck.rows[0].count) > 0;

      // Insert new photos
      for (let i = 0; i < photoUrls.length; i++) {
        await client.query(
          `INSERT INTO vehicle_photos (vehicle_id, photo_url, is_primary, display_order)
           VALUES ($1, $2, $3, $4)`,
          [id, photoUrls[i], !hasPrimary && i === 0, displayOrder++],
        );
      }

      await client.query("COMMIT");

      console.log(`✅ ${photoUrls.length} photos uploaded for vehicle ${id}`);

      res.json({
        message: "Photos uploaded successfully",
        photoCount: photoUrls.length,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("❌ Upload photos error:", error);
      next(error);
    } finally {
      client.release();
    }
  }

  /**
   * POST /owner/:id/verification
   * Submit periodic verification photos
   */
  async submitVerificationPhotos(req, res, next) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const userId = req.user.userId;
      const { id } = req.params;
      const { photoUrls } = req.body;

      if (!photoUrls || photoUrls.length === 0) {
        return res.status(400).json({
          error: "Verification photos are required",
        });
      }

      // Verify ownership
      const ownershipResult = await client.query(
        "SELECT owner_id FROM vehicles WHERE vehicle_id = $1",
        [id],
      );

      if (ownershipResult.rows.length === 0) {
        return res.status(404).json({ error: "Vehicle not found" });
      }

      if (ownershipResult.rows[0].owner_id !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Insert verification record
      await client.query(
        `INSERT INTO vehicle_verification_photos (vehicle_id, photo_urls, verification_status)
         VALUES ($1, $2, 'pending')`,
        [id, JSON.stringify(photoUrls)],
      );

      // Update vehicle verification status to pending
      await client.query(
        `UPDATE vehicles 
         SET verification_status = 'pending',
             updated_at = NOW()
         WHERE vehicle_id = $1`,
        [id],
      );

      await client.query("COMMIT");

      console.log(`✅ Verification photos submitted for vehicle ${id}`);

      res.json({
        message: "Verification photos submitted. Pending admin approval.",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("❌ Submit verification photos error:", error);
      next(error);
    } finally {
      client.release();
    }
  }

  /**
   * GET /owner/:id/verification-status
   * Get verification status
   */
  async getVerificationStatus(req, res, next) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;

      const result = await pool.query(
        `SELECT 
          v.verification_status,
          v.verification_notes,
          v.last_verified_at,
          v.next_verification_due
         FROM vehicles v
         WHERE v.vehicle_id = $1 AND v.owner_id = $2`,
        [id, userId],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: "Vehicle not found or access denied",
        });
      }

      const vehicle = result.rows[0];

      res.json({
        verificationStatus: vehicle.verification_status,
        notes: vehicle.verification_notes,
        lastVerified: vehicle.last_verified_at,
        nextVerificationDue: vehicle.next_verification_due,
        isDue:
          vehicle.next_verification_due &&
          new Date(vehicle.next_verification_due) <= new Date(),
      });
    } catch (error) {
      console.error("❌ Get verification status error:", error);
      next(error);
    }
  }
}

module.exports = new OwnerVehicleController();
