const pool = require("../config/database");

class AdminVehicleController {
  /**
   * Get all vehicles (Admin only)
   */
  async getAllVehicles(req, res, next) {
    try {
      const {
        status = "all",
        vehicleType,
        ownerId,
        search,
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
        WHERE 1=1
      `;

      const params = [];
      let paramIndex = 1;

      if (status !== "all") {
        query += ` AND v.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      if (vehicleType) {
        query += ` AND v.vehicle_type = $${paramIndex}`;
        params.push(vehicleType);
        paramIndex++;
      }

      if (ownerId) {
        query += ` AND v.owner_id = $${paramIndex}`;
        params.push(ownerId);
        paramIndex++;
      }

      if (search) {
        query += ` AND (v.name ILIKE $${paramIndex} OR v.license_plate ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      const sortFields = {
        name: "v.name",
        rentals: "v.total_rentals",
        rating: "v.average_rating",
        price: "v.price_per_day",
      };

      query += ` ORDER BY ${sortFields[sortBy] || "v.name"} DESC`;
      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, (page - 1) * limit);

      const result = await pool.query(query, params);

      // Get total count
      let countQuery = "SELECT COUNT(*) FROM vehicles v WHERE 1=1";
      const countResult = await pool.query(countQuery);

      res.json({
        vehicles: result.rows.map((vehicle) => ({
          id: vehicle.vehicle_id,
          name: vehicle.name,
          ownerId: vehicle.owner_id,
          status: vehicle.status,
          verificationStatus: vehicle.verification_status,
          vehicleType: vehicle.vehicle_type,
          transmission: vehicle.transmission,
          fuelType: vehicle.fuel_type,
          seats: vehicle.seats,
          pricePerDay: vehicle.price_per_day,
          rating: parseFloat(vehicle.average_rating),
          totalRentals: vehicle.total_rentals,
          primaryPhoto: vehicle.primary_photo,
          createdAt: vehicle.created_at,
          lastVerified: vehicle.last_verified_at,
        })),
        pagination: {
          total: parseInt(countResult.rows[0].count),
          page: parseInt(page),
          limit: parseInt(limit),
        },
      });
    } catch (error) {
      console.error("Get all vehicles error:", error);
      next(error);
    }
  }
  async getVehiclesDueForVerification(req, res, next) {
    try {
      const { page = 1, limit = 20 } = req.query;

      const query = `
        SELECT 
          v.vehicle_id,
          v.owner_id,
          v.name,
          v.license_plate,
          v.last_verified_at,
          v.next_verification_due,
          v.verification_status,
          (SELECT photo_url FROM vehicle_photos 
           WHERE vehicle_id = v.vehicle_id AND is_primary = true 
           LIMIT 1) as primary_photo
        FROM vehicles v
        WHERE v.next_verification_due <= NOW() + INTERVAL '7 days'
        AND v.status = 'active'
        ORDER BY v.next_verification_due ASC
        LIMIT $1 OFFSET $2
      `;

      const result = await pool.query(query, [
        parseInt(limit),
        (parseInt(page) - 1) * parseInt(limit),
      ]);

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM vehicles 
         WHERE next_verification_due <= NOW() + INTERVAL '7 days'
         AND status = 'active'`
      );

      res.json({
        vehicles: result.rows.map((vehicle) => ({
          id: vehicle.vehicle_id,
          ownerId: vehicle.owner_id,
          name: vehicle.name,
          licensePlate: vehicle.license_plate,
          lastVerified: vehicle.last_verified_at,
          nextVerificationDue: vehicle.next_verification_due,
          verificationStatus: vehicle.verification_status,
          primaryPhoto: vehicle.primary_photo,
          daysUntilDue: Math.ceil(
            (new Date(vehicle.next_verification_due) - new Date()) /
              (1000 * 60 * 60 * 24)
          ),
        })),
        pagination: {
          total: parseInt(countResult.rows[0].count),
          page: parseInt(page),
          limit: parseInt(limit),
        },
      });
    } catch (error) {
      console.error("Get vehicles due for verification error:", error);
      next(error);
    }
  }
  async getPendingVerifications(req, res, next) {
    try {
      const { page = 1, limit = 20 } = req.query;

      const query = `
        SELECT 
          vvp.*,
          v.name as vehicle_name,
          v.owner_id,
          v.license_plate
        FROM vehicle_verification_photos vvp
        JOIN vehicles v ON vvp.vehicle_id = v.vehicle_id
        WHERE vvp.verification_status = 'pending'
        ORDER BY vvp.submitted_at DESC
        LIMIT $1 OFFSET $2
      `;

      const result = await pool.query(query, [
        parseInt(limit),
        (parseInt(page) - 1) * parseInt(limit),
      ]);

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM vehicle_verification_photos 
         WHERE verification_status = 'pending'`
      );

      res.json({
        verifications: result.rows.map((v) => ({
          id: v.verification_id,
          vehicleId: v.vehicle_id,
          vehicleName: v.vehicle_name,
          ownerId: v.owner_id,
          licensePlate: v.license_plate,
          photos: v.photo_urls,
          submittedAt: v.submitted_at,
          status: v.verification_status,
        })),
        pagination: {
          total: parseInt(countResult.rows[0].count),
          page: parseInt(page),
          limit: parseInt(limit),
        },
      });
    } catch (error) {
      console.error("Get pending verifications error:", error);
      next(error);
    }
  }
  async approveVerification(req, res, next) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const userId = req.user.userId; // Admin user ID
      const { id } = req.params; // verification_id

      // Get verification details
      const verificationResult = await client.query(
        "SELECT * FROM vehicle_verification_photos WHERE verification_id = $1",
        [id]
      );

      if (verificationResult.rows.length === 0) {
        return res.status(404).json({ error: "Verification not found" });
      }

      const verification = verificationResult.rows[0];

      if (verification.verification_status !== "pending") {
        return res.status(400).json({
          error: `Cannot approve verification with status: ${verification.verification_status}`,
        });
      }

      // Update verification record
      await client.query(
        `UPDATE vehicle_verification_photos 
         SET verification_status = 'approved',
             verified_at = NOW(),
             verified_by = $1
         WHERE verification_id = $2`,
        [userId, id]
      );

      // Update vehicle record - extend verification due date by 2 months
      await client.query(
        `UPDATE vehicles 
         SET last_verified_at = NOW(),
             next_verification_due = NOW() + INTERVAL '2 months',
             verification_status = 'approved',
             updated_at = NOW()
         WHERE vehicle_id = $1`,
        [verification.vehicle_id]
      );

      await client.query("COMMIT");

      console.log(`✅ Admin ${userId} approved verification: ${id}`);

      res.json({
        message: "Verification approved",
        nextVerificationDue: new Date(
          Date.now() + 60 * 24 * 60 * 60 * 1000
        ).toISOString(),
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Approve verification error:", error);
      next(error);
    } finally {
      client.release();
    }
  }
  async rejectVerification(req, res, next) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const userId = req.user.userId;
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason || reason.trim() === "") {
        return res.status(400).json({
          error: "Rejection reason is required",
        });
      }

      // Get verification details
      const verificationResult = await client.query(
        "SELECT * FROM vehicle_verification_photos WHERE verification_id = $1",
        [id]
      );

      if (verificationResult.rows.length === 0) {
        return res.status(404).json({ error: "Verification not found" });
      }

      const verification = verificationResult.rows[0];

      // Update verification record
      await client.query(
        `UPDATE vehicle_verification_photos 
         SET verification_status = 'rejected',
             verified_at = NOW(),
             verified_by = $1,
             notes = $2
         WHERE verification_id = $3`,
        [userId, reason, id]
      );

      // Update vehicle status - may need re-verification
      await client.query(
        `UPDATE vehicles 
         SET verification_status = 'rejected',
             verification_notes = $1,
             updated_at = NOW()
         WHERE vehicle_id = $2`,
        [reason, verification.vehicle_id]
      );

      await client.query("COMMIT");

      console.log(`❌ Admin ${userId} rejected verification: ${id}`);

      res.json({
        message: "Verification rejected. Owner will be notified.",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Reject verification error:", error);
      next(error);
    } finally {
      client.release();
    }
  }

  /**
   * Update vehicle status
   */
  async updateVehicleStatus(req, res, next) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const { id } = req.params;
      const { status, reason } = req.body;

      const validStatuses = ["pending", "active", "stopped", "banned"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          error: "Invalid status",
          validStatuses: validStatuses,
        });
      }

      await client.query(
        `UPDATE vehicles 
         SET status = $1,
             banned_reason = $2,
             updated_at = NOW()
         WHERE vehicle_id = $3`,
        [status, status === "banned" ? reason : null, id]
      );

      await client.query("COMMIT");

      console.log(`✅ Admin updated vehicle ${id} status to: ${status}`);

      res.json({
        message: "Vehicle status updated",
        newStatus: status,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Update vehicle status error:", error);
      next(error);
    } finally {
      client.release();
    }
  }

  /**
   * Approve pending vehicle
   */
  async approveVehicle(req, res, next) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const { id } = req.params;

      const vehicleResult = await client.query(
        "SELECT * FROM vehicles WHERE vehicle_id = $1",
        [id]
      );

      if (vehicleResult.rows.length === 0) {
        return res.status(404).json({ error: "Vehicle not found" });
      }

      const vehicle = vehicleResult.rows[0];

      if (vehicle.status !== "pending") {
        return res.status(400).json({
          error: `Cannot approve vehicle with status: ${vehicle.status}`,
        });
      }

      await client.query(
        `UPDATE vehicles 
         SET status = 'active',
             verification_status = 'approved',
             last_verified_at = NOW(),
             updated_at = NOW()
         WHERE vehicle_id = $1`,
        [id]
      );

      await client.query("COMMIT");

      console.log(`✅ Admin approved vehicle: ${id}`);

      res.json({
        message: "Vehicle approved and now active",
        vehicleId: id,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Approve vehicle error:", error);
      next(error);
    } finally {
      client.release();
    }
  }

  /**
   * Reject pending vehicle
   */
  async rejectVehicle(req, res, next) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const { id } = req.params;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({
          error: "Rejection reason is required",
        });
      }

      const vehicleResult = await client.query(
        "SELECT * FROM vehicles WHERE vehicle_id = $1",
        [id]
      );

      if (vehicleResult.rows.length === 0) {
        return res.status(404).json({ error: "Vehicle not found" });
      }

      await client.query(
        `UPDATE vehicles 
         SET status = 'stopped',
             verification_status = 'rejected',
             rejection_reason = $1,
             updated_at = NOW()
         WHERE vehicle_id = $2`,
        [reason, id]
      );

      await client.query("COMMIT");

      console.log(`❌ Admin rejected vehicle: ${id}`);

      res.json({
        message: "Vehicle listing rejected",
        vehicleId: id,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Reject vehicle error:", error);
      next(error);
    } finally {
      client.release();
    }
  }
}

module.exports = new AdminVehicleController();
