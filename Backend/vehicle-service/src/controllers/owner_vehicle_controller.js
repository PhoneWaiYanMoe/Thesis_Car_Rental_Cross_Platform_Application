const pool = require("../config/database");
const { v4: uuidv4 } = require("uuid");

class OwnerVehicleController {
  /**
   * Create new vehicle listing
   */
  async createVehicle(req, res, next) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const userId = req.user.userId;
      const userRole = req.user.role;

      if (userRole !== "owner") {
        return res.status(403).json({
          error: "Only vehicle owners can create listings",
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
          "pending",
          "pending",
          nextVerificationDue,
        ]
      );

      // Insert photos if provided
      if (photoIds && photoIds.length > 0) {
        for (let i = 0; i < photoIds.length; i++) {
          await client.query(
            `INSERT INTO vehicle_photos (vehicle_id, photo_url, is_primary, display_order)
             VALUES ($1, $2, $3, $4)`,
            [vehicleId, photoIds[i], i === 0, i + 1]
          );
        }
      }

      await client.query("COMMIT");

      console.log(`✅ Vehicle created by owner ${userId}: ${vehicleId}`);

      res.status(201).json({
        message: "Vehicle created, pending approval",
        vehicleId: vehicleId,
        status: "pending",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      
      if (error.code === "23505") {
        return res.status(400).json({
          error: "License plate already exists",
        });
      }
      
      console.error("Create vehicle error:", error);
      next(error);
    } finally {
      client.release();
    }
  }

  /**
   * Get owner's vehicles
   */
  async getMyVehicles(req, res, next) {
    try {
      const userId = req.user.userId;
      const { status = "all", sortBy = "name" } = req.query;

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
      };

      query += ` ORDER BY ${sortFields[sortBy] || "v.name"} DESC`;

      const result = await pool.query(query, params);

      res.json({
        vehicles: result.rows.map((vehicle) => ({
          id: vehicle.vehicle_id,
          name: vehicle.name,
          status: vehicle.status,
          pricePerDay: vehicle.price_per_day,
          rating: parseFloat(vehicle.average_rating),
          totalRentals: vehicle.total_rentals,
          primaryPhoto: vehicle.primary_photo,
          createdAt: vehicle.created_at,
          lastVerified: vehicle.last_verified_at,
          verificationStatus: vehicle.verification_status,
          nextVerificationDue: vehicle.next_verification_due,
        })),
      });
    } catch (error) {
      console.error("Get my vehicles error:", error);
      next(error);
    }
  }

  /**
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
           WHERE vehicle_id = v.vehicle_id) as photos
         FROM vehicles v
         WHERE v.vehicle_id = $1 AND v.owner_id = $2`,
        [id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: "Vehicle not found or you don't own this vehicle",
        });
      }

      const vehicle = result.rows[0];

      res.json({
        vehicle: {
          id: vehicle.vehicle_id,
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
          },
          performance: {
            totalRentals: vehicle.total_rentals,
            rating: parseFloat(vehicle.average_rating),
            reviewCount: vehicle.review_count,
          },
          rules: vehicle.rules || {},
          status: vehicle.status,
          verificationStatus: vehicle.verification_status,
          verificationNotes: vehicle.verification_notes,
          lastVerified: vehicle.last_verified_at,
          nextVerificationDue: vehicle.next_verification_due,
          createdAt: vehicle.created_at,
          updatedAt: vehicle.updated_at,
        },
      });
    } catch (error) {
      console.error("Get my vehicle error:", error);
      next(error);
    }
  }

  /**
   * Update vehicle
   */
  async updateVehicle(req, res, next) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const userId = req.user.userId;
      const { id } = req.params;
      const { name, description, pricePerDay, features, rules } = req.body;

      const vehicleResult = await client.query(
        "SELECT * FROM vehicles WHERE vehicle_id = $1 AND owner_id = $2",
        [id, userId]
      );

      if (vehicleResult.rows.length === 0) {
        return res.status(404).json({
          error: "Vehicle not found or you don't own this vehicle",
        });
      }

      await client.query(
        `UPDATE vehicles 
         SET name = COALESCE($1, name),
             description = COALESCE($2, description),
             price_per_day = COALESCE($3, price_per_day),
             features = COALESCE($4, features),
             rules = COALESCE($5, rules),
             updated_at = NOW()
         WHERE vehicle_id = $6`,
        [
          name,
          description,
          pricePerDay,
          features ? JSON.stringify(features) : null,
          rules ? JSON.stringify(rules) : null,
          id,
        ]
      );

      await client.query("COMMIT");

      res.json({
        message: "Vehicle updated successfully",
        vehicleId: id,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Update vehicle error:", error);
      next(error);
    } finally {
      client.release();
    }
  }

  /**
   * Delete/deactivate vehicle
   */
  async deleteVehicle(req, res, next) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const userId = req.user.userId;
      const { id } = req.params;

      const vehicleResult = await client.query(
        "SELECT * FROM vehicles WHERE vehicle_id = $1 AND owner_id = $2",
        [id, userId]
      );

      if (vehicleResult.rows.length === 0) {
        return res.status(404).json({
          error: "Vehicle not found or you don't own this vehicle",
        });
      }

      await client.query(
        "UPDATE vehicles SET status = 'stopped', updated_at = NOW() WHERE vehicle_id = $1",
        [id]
      );

      await client.query("COMMIT");

      res.json({
        message: "Vehicle deactivated successfully",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Delete vehicle error:", error);
      next(error);
    } finally {
      client.release();
    }
  }

  /**
   * Upload vehicle photos
   */
  async uploadPhotos(req, res, next) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const userId = req.user.userId;
      const { id } = req.params;
      const { photoUrls } = req.body;

      if (!photoUrls || !Array.isArray(photoUrls)) {
        return res.status(400).json({
          error: "photoUrls array is required",
        });
      }

      const vehicleResult = await client.query(
        "SELECT * FROM vehicles WHERE vehicle_id = $1 AND owner_id = $2",
        [id, userId]
      );

      if (vehicleResult.rows.length === 0) {
        return res.status(404).json({
          error: "Vehicle not found or you don't own this vehicle",
        });
      }

      // Get current max display order
      const orderResult = await client.query(
        "SELECT COALESCE(MAX(display_order), 0) as max_order FROM vehicle_photos WHERE vehicle_id = $1",
        [id]
      );

      let nextOrder = orderResult.rows[0].max_order + 1;

      for (const photoUrl of photoUrls) {
        await client.query(
          "INSERT INTO vehicle_photos (vehicle_id, photo_url, display_order) VALUES ($1, $2, $3)",
          [id, photoUrl, nextOrder]
        );
        nextOrder++;
      }

      await client.query("COMMIT");

      res.status(201).json({
        message: "Photos uploaded successfully",
        photoUrls: photoUrls,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Upload photos error:", error);
      next(error);
    } finally {
      client.release();
    }
  }
   async submitVerificationPhotos(req, res, next) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const userId = req.user.userId;
      const { id } = req.params; // vehicle_id
      const { photoUrls } = req.body;

      if (!photoUrls || !Array.isArray(photoUrls) || photoUrls.length < 3) {
        return res.status(400).json({
          error: "Please provide at least 3 verification photos",
        });
      }

      // Verify ownership
      const vehicleResult = await client.query(
        "SELECT * FROM vehicles WHERE vehicle_id = $1 AND owner_id = $2",
        [id, userId]
      );

      if (vehicleResult.rows.length === 0) {
        return res.status(404).json({
          error: "Vehicle not found or you don't own this vehicle",
        });
      }

      const vehicle = vehicleResult.rows[0];

      // Check if verification is needed
      const now = new Date();
      const nextDue = new Date(vehicle.next_verification_due);

      if (nextDue > now) {
        const daysUntilDue = Math.ceil((nextDue - now) / (1000 * 60 * 60 * 24));
        return res.status(400).json({
          error: `Verification not due yet. Next verification due in ${daysUntilDue} days.`,
          nextVerificationDue: vehicle.next_verification_due,
        });
      }

      // Insert verification submission
      const verificationId = uuidv4();
      await client.query(
        `INSERT INTO vehicle_verification_photos 
         (verification_id, vehicle_id, photo_urls, verification_status)
         VALUES ($1, $2, $3, 'pending')`,
        [verificationId, id, JSON.stringify(photoUrls)]
      );

      // Update vehicle verification status
      await client.query(
        `UPDATE vehicles 
         SET verification_status = 'pending',
             updated_at = NOW()
         WHERE vehicle_id = $1`,
        [id]
      );

      await client.query("COMMIT");

      console.log(
        `✅ Owner ${userId} submitted verification photos for vehicle: ${id}`
      );

      res.status(201).json({
        message:
          "Verification photos submitted successfully. Pending admin review.",
        verificationId: verificationId,
        status: "pending",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Submit verification photos error:", error);
      next(error);
    } finally {
      client.release();
    }
  }
    async getVerificationStatus(req, res, next) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;

      const vehicleResult = await pool.query(
        "SELECT * FROM vehicles WHERE vehicle_id = $1 AND owner_id = $2",
        [id, userId]
      );

      if (vehicleResult.rows.length === 0) {
        return res.status(404).json({
          error: "Vehicle not found or you don't own this vehicle",
        });
      }

      const vehicle = vehicleResult.rows[0];
      const now = new Date();
      const nextDue = new Date(vehicle.next_verification_due);
      const daysUntilDue = Math.ceil((nextDue - now) / (1000 * 60 * 60 * 24));

      // Get latest verification submission
      const latestVerification = await pool.query(
        `SELECT * FROM vehicle_verification_photos 
         WHERE vehicle_id = $1 
         ORDER BY submitted_at DESC 
         LIMIT 1`,
        [id]
      );

      res.json({
        vehicleId: id,
        verificationStatus: vehicle.verification_status,
        lastVerified: vehicle.last_verified_at,
        nextVerificationDue: vehicle.next_verification_due,
        daysUntilDue: daysUntilDue,
        isOverdue: daysUntilDue < 0,
        needsVerification: daysUntilDue <= 7,
        latestSubmission:
          latestVerification.rows.length > 0
            ? {
                id: latestVerification.rows[0].verification_id,
                submittedAt: latestVerification.rows[0].submitted_at,
                status: latestVerification.rows[0].verification_status,
                verifiedAt: latestVerification.rows[0].verified_at,
                notes: latestVerification.rows[0].notes,
              }
            : null,
      });
    } catch (error) {
      console.error("Get verification status error:", error);
      next(error);
    }
  }

}

module.exports = new OwnerVehicleController();