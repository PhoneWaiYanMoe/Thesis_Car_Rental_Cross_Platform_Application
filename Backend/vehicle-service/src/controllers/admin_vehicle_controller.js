// Backend/vehicle-service/src/controllers/admin_vehicle_controller.js
const pool = require("../config/database");
const eventEmitter = require("../utils/eventEmitter");

class AdminVehicleController {
  /**
   * GET /admin/vehicles
   * Get all vehicles with comprehensive filtering, sorting, and pagination
   */
  async getAllVehicles(req, res, next) {
    try {
      const {
        status = "all",
        verificationStatus,
        vehicleType,
        ownerId,
        vehicleId,
        search,
        sortBy = "created_at",
        sortOrder = "DESC",
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

      // Filter by status
      if (status !== "all") {
        query += ` AND v.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      // Filter by verification status
      if (verificationStatus) {
        query += ` AND v.verification_status = $${paramIndex}`;
        params.push(verificationStatus);
        paramIndex++;
      }

      // Filter by vehicle type
      if (vehicleType) {
        query += ` AND v.vehicle_type = $${paramIndex}`;
        params.push(vehicleType);
        paramIndex++;
      }

      // Filter by owner ID
      if (ownerId) {
        query += ` AND v.owner_id = $${paramIndex}`;
        params.push(ownerId);
        paramIndex++;
      }

      // Filter by vehicle ID
      if (vehicleId) {
        query += ` AND v.vehicle_id = $${paramIndex}`;
        params.push(vehicleId);
        paramIndex++;
      }

      // Search by vehicle name
      if (search) {
        query += ` AND (v.name ILIKE $${paramIndex} OR v.license_plate ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      // Sorting
      const sortFields = {
        name: "v.name",
        created_at: "v.created_at",
        rentals: "v.total_rentals",
        rating: "v.average_rating",
        price: "v.price_per_day",
        next_verification_due: "v.next_verification_due",
        revenue: "v.total_revenue_earned",
      };

      const sortField = sortFields[sortBy] || "v.created_at";
      const order = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

      query += ` ORDER BY ${sortField} ${order}`;
      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

      const result = await pool.query(query, params);

      // Get total count
      let countQuery = "SELECT COUNT(*) FROM vehicles v WHERE 1=1";
      const countParams = [];
      let countIndex = 1;

      if (status !== "all") {
        countQuery += ` AND v.status = $${countIndex}`;
        countParams.push(status);
        countIndex++;
      }

      if (verificationStatus) {
        countQuery += ` AND v.verification_status = $${countIndex}`;
        countParams.push(verificationStatus);
        countIndex++;
      }

      if (vehicleType) {
        countQuery += ` AND v.vehicle_type = $${countIndex}`;
        countParams.push(vehicleType);
        countIndex++;
      }

      if (ownerId) {
        countQuery += ` AND v.owner_id = $${countIndex}`;
        countParams.push(ownerId);
        countIndex++;
      }

      if (vehicleId) {
        countQuery += ` AND v.vehicle_id = $${countIndex}`;
        countParams.push(vehicleId);
        countIndex++;
      }

      if (search) {
        countQuery += ` AND (v.name ILIKE $${countIndex} OR v.license_plate ILIKE $${countIndex})`;
        countParams.push(`%${search}%`);
        countIndex++;
      }

      const countResult = await pool.query(countQuery, countParams);

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
          totalRevenue: parseInt(vehicle.total_revenue_earned || 0),
          primaryPhoto: vehicle.primary_photo,
          createdAt: vehicle.created_at,
          lastVerified: vehicle.last_verified_at,
          nextVerificationDue: vehicle.next_verification_due,
          verificationNotes: vehicle.verification_notes,
          bannedReason: vehicle.banned_reason,
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
      console.error("❌ Get all vehicles error:", error);
      next(error);
    }
  }

  /**
   * GET /admin/vehicles/approved
   * Get all approved vehicles (verification_status = 'approved')
   */
  async getApprovedVehicles(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = "created_at",
        sortOrder = "DESC",
      } = req.query;

      const sortFields = {
        name: "v.name",
        created_at: "v.created_at",
        rentals: "v.total_rentals",
        rating: "v.average_rating",
        price: "v.price_per_day",
      };

      const sortField = sortFields[sortBy] || "v.created_at";
      const order = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

      const query = `
        SELECT 
          v.*,
          (SELECT photo_url FROM vehicle_photos 
           WHERE vehicle_id = v.vehicle_id AND is_primary = true 
           LIMIT 1) as primary_photo
        FROM vehicles v
        WHERE v.verification_status = 'approved'
        ORDER BY ${sortField} ${order}
        LIMIT $1 OFFSET $2
      `;

      const result = await pool.query(query, [
        parseInt(limit),
        (parseInt(page) - 1) * parseInt(limit),
      ]);

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM vehicles WHERE verification_status = 'approved'`,
      );

      res.json({
        vehicles: result.rows.map((v) => ({
          id: v.vehicle_id,
          name: v.name,
          ownerId: v.owner_id,
          status: v.status,
          verificationStatus: v.verification_status,
          vehicleType: v.vehicle_type,
          pricePerDay: v.price_per_day,
          rating: parseFloat(v.average_rating),
          totalRentals: v.total_rentals,
          primaryPhoto: v.primary_photo,
          createdAt: v.created_at,
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
      console.error("❌ Get approved vehicles error:", error);
      next(error);
    }
  }

  /**
   * GET /admin/vehicles/by-status/:status
   * Get vehicles by specific status (active, deactivated, banned, stopped)
   */
  async getVehiclesByStatus(req, res, next) {
    try {
      const { status } = req.params;
      const {
        page = 1,
        limit = 20,
        sortBy = "created_at",
        sortOrder = "DESC",
      } = req.query;

      const validStatuses = [
        "pending",
        "active",
        "deactivated",
        "stopped",
        "banned",
      ];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          error: "Invalid status",
          validStatuses,
        });
      }

      const sortFields = {
        name: "v.name",
        created_at: "v.created_at",
        rentals: "v.total_rentals",
        rating: "v.average_rating",
        price: "v.price_per_day",
      };

      const sortField = sortFields[sortBy] || "v.created_at";
      const order = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

      const query = `
        SELECT 
          v.*,
          (SELECT photo_url FROM vehicle_photos 
           WHERE vehicle_id = v.vehicle_id AND is_primary = true 
           LIMIT 1) as primary_photo
        FROM vehicles v
        WHERE v.status = $1
        ORDER BY ${sortField} ${order}
        LIMIT $2 OFFSET $3
      `;

      const result = await pool.query(query, [
        status,
        parseInt(limit),
        (parseInt(page) - 1) * parseInt(limit),
      ]);

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM vehicles WHERE status = $1`,
        [status],
      );

      res.json({
        vehicles: result.rows.map((v) => ({
          id: v.vehicle_id,
          name: v.name,
          ownerId: v.owner_id,
          status: v.status,
          verificationStatus: v.verification_status,
          vehicleType: v.vehicle_type,
          pricePerDay: v.price_per_day,
          rating: parseFloat(v.average_rating),
          totalRentals: v.total_rentals,
          totalRevenue: parseInt(v.total_revenue_earned || 0),
          primaryPhoto: v.primary_photo,
          createdAt: v.created_at,
          bannedReason: v.banned_reason,
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
      console.error("❌ Get vehicles by status error:", error);
      next(error);
    }
  }

  /**
   * GET /admin/vehicles/top-rated
   * Get top rated vehicles sorted by rating
   */
  async getTopRatedVehicles(req, res, next) {
    try {
      const { page = 1, limit = 20, minRating = 0 } = req.query;

      const query = `
        SELECT 
          v.*,
          (SELECT photo_url FROM vehicle_photos 
           WHERE vehicle_id = v.vehicle_id AND is_primary = true 
           LIMIT 1) as primary_photo
        FROM vehicles v
        WHERE v.average_rating >= $1 AND v.status = 'active'
        ORDER BY v.average_rating DESC, v.review_count DESC
        LIMIT $2 OFFSET $3
      `;

      const result = await pool.query(query, [
        parseFloat(minRating),
        parseInt(limit),
        (parseInt(page) - 1) * parseInt(limit),
      ]);

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM vehicles WHERE average_rating >= $1 AND status = 'active'`,
        [parseFloat(minRating)],
      );

      res.json({
        vehicles: result.rows.map((v) => ({
          id: v.vehicle_id,
          name: v.name,
          ownerId: v.owner_id,
          vehicleType: v.vehicle_type,
          pricePerDay: v.price_per_day,
          rating: parseFloat(v.average_rating),
          reviewCount: v.review_count,
          totalRentals: v.total_rentals,
          primaryPhoto: v.primary_photo,
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
      console.error("❌ Get top rated vehicles error:", error);
      next(error);
    }
  }

  /**
   * GET /admin/vehicles/by-type/:vehicleType
   * Filter vehicles by type
   */
  async getVehiclesByType(req, res, next) {
    try {
      const { vehicleType } = req.params;
      const {
        page = 1,
        limit = 20,
        sortBy = "created_at",
        sortOrder = "DESC",
      } = req.query;

      const validTypes = ["sedan", "suv", "hatchback", "van"];
      if (!validTypes.includes(vehicleType.toLowerCase())) {
        return res.status(400).json({
          error: "Invalid vehicle type",
          validTypes,
        });
      }

      const sortFields = {
        name: "v.name",
        created_at: "v.created_at",
        rentals: "v.total_rentals",
        rating: "v.average_rating",
        price: "v.price_per_day",
      };

      const sortField = sortFields[sortBy] || "v.created_at";
      const order = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

      const query = `
        SELECT 
          v.*,
          (SELECT photo_url FROM vehicle_photos 
           WHERE vehicle_id = v.vehicle_id AND is_primary = true 
           LIMIT 1) as primary_photo
        FROM vehicles v
        WHERE v.vehicle_type = $1
        ORDER BY ${sortField} ${order}
        LIMIT $2 OFFSET $3
      `;

      const result = await pool.query(query, [
        vehicleType.toLowerCase(),
        parseInt(limit),
        (parseInt(page) - 1) * parseInt(limit),
      ]);

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM vehicles WHERE vehicle_type = $1`,
        [vehicleType.toLowerCase()],
      );

      res.json({
        vehicles: result.rows.map((v) => ({
          id: v.vehicle_id,
          name: v.name,
          ownerId: v.owner_id,
          status: v.status,
          vehicleType: v.vehicle_type,
          pricePerDay: v.price_per_day,
          rating: parseFloat(v.average_rating),
          totalRentals: v.total_rentals,
          primaryPhoto: v.primary_photo,
          createdAt: v.created_at,
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
      console.error("❌ Get vehicles by type error:", error);
      next(error);
    }
  }

  /**
   * GET /admin/vehicles/due-verification
   * Get vehicles sorted by next verification due date
   */
  async getVehiclesDueForVerification(req, res, next) {
    try {
      const { page = 1, limit = 20, daysAhead = 30 } = req.query;

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
        WHERE v.next_verification_due <= NOW() + INTERVAL '${parseInt(daysAhead)} days'
        AND v.status IN ('active', 'deactivated')
        ORDER BY v.next_verification_due ASC
        LIMIT $1 OFFSET $2
      `;

      const result = await pool.query(query, [
        parseInt(limit),
        (parseInt(page) - 1) * parseInt(limit),
      ]);

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM vehicles 
         WHERE next_verification_due <= NOW() + INTERVAL '${parseInt(daysAhead)} days'
         AND status IN ('active', 'deactivated')`,
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
              (1000 * 60 * 60 * 24),
          ),
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
      console.error("❌ Get vehicles due for verification error:", error);
      next(error);
    }
  }

  /**
   * GET /admin/verifications/pending
   * Get pending verification submissions
   */
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
         WHERE verification_status = 'pending'`,
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
          totalPages: Math.ceil(
            parseInt(countResult.rows[0].count) / parseInt(limit),
          ),
        },
      });
    } catch (error) {
      console.error("❌ Get pending verifications error:", error);
      next(error);
    }
  }

  /**
   * POST /admin/verifications/:id/approve
   * Approve periodic verification
   */
  async approveVerification(req, res, next) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const userId = req.user.userId;
      const { id } = req.params;

      const verificationResult = await client.query(
        "SELECT * FROM vehicle_verification_photos WHERE verification_id = $1",
        [id],
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

      await client.query(
        `UPDATE vehicle_verification_photos 
         SET verification_status = 'approved',
             verified_at = NOW(),
             verified_by = $1
         WHERE verification_id = $2`,
        [userId, id],
      );

      await client.query(
        `UPDATE vehicles 
         SET last_verified_at = NOW(),
             next_verification_due = NOW() + INTERVAL '2 months',
             verification_status = 'approved',
             updated_at = NOW()
         WHERE vehicle_id = $1`,
        [verification.vehicle_id],
      );

      await client.query("COMMIT");

      console.log(`✅ Admin ${userId} approved verification: ${id}`);

      // Emit event
      await eventEmitter.emit("vehicle.verification_status_changed", {
        vehicleId: verification.vehicle_id,
        verificationStatus: "approved",
        verificationId: id,
      });

      res.json({
        message: "Verification approved",
        nextVerificationDue: new Date(
          Date.now() + 60 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("❌ Approve verification error:", error);
      next(error);
    } finally {
      client.release();
    }
  }

  /**
   * POST /admin/verifications/:id/reject
   * Reject periodic verification
   */
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

      const verificationResult = await client.query(
        "SELECT * FROM vehicle_verification_photos WHERE verification_id = $1",
        [id],
      );

      if (verificationResult.rows.length === 0) {
        return res.status(404).json({ error: "Verification not found" });
      }

      const verification = verificationResult.rows[0];

      await client.query(
        `UPDATE vehicle_verification_photos 
         SET verification_status = 'rejected',
             verified_at = NOW(),
             verified_by = $1,
             notes = $2
         WHERE verification_id = $3`,
        [userId, reason, id],
      );

      await client.query(
        `UPDATE vehicles 
         SET verification_status = 'rejected',
             verification_notes = $1,
             updated_at = NOW()
         WHERE vehicle_id = $2`,
        [reason, verification.vehicle_id],
      );

      await client.query("COMMIT");

      console.log(`❌ Admin ${userId} rejected verification: ${id}`);

      // Emit event
      await eventEmitter.emit("vehicle.verification_status_changed", {
        vehicleId: verification.vehicle_id,
        verificationStatus: "rejected",
        verificationId: id,
        reason,
      });

      res.json({
        message: "Verification rejected. Owner will be notified.",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("❌ Reject verification error:", error);
      next(error);
    } finally {
      client.release();
    }
  }

  /**
   * PATCH /admin/:id/status
   * Update vehicle status
   */
  async updateVehicleStatus(req, res, next) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const { id } = req.params;
      const { status, reason } = req.body;

      const validStatuses = [
        "pending",
        "active",
        "deactivated",
        "stopped",
        "banned",
      ];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          error: "Invalid status",
          validStatuses: validStatuses,
        });
      }

      // Get old status
      const oldResult = await client.query(
        "SELECT status FROM vehicles WHERE vehicle_id = $1",
        [id],
      );

      if (oldResult.rows.length === 0) {
        return res.status(404).json({ error: "Vehicle not found" });
      }

      const oldStatus = oldResult.rows[0].status;

      await client.query(
        `UPDATE vehicles 
         SET status = $1,
             banned_reason = $2,
             updated_at = NOW()
         WHERE vehicle_id = $3`,
        [status, status === "banned" ? reason : null, id],
      );

      await client.query("COMMIT");

      console.log(`✅ Admin updated vehicle ${id} status to: ${status}`);

      // Emit event
      await eventEmitter.emit("vehicle.status_changed", {
        vehicleId: id,
        oldStatus,
        newStatus: status,
        reason: reason || null,
      });

      res.json({
        message: "Vehicle status updated",
        newStatus: status,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("❌ Update vehicle status error:", error);
      next(error);
    } finally {
      client.release();
    }
  }

  /**
   * POST /admin/:id/approve
   * Approve pending vehicle
   */
  async approveVehicle(req, res, next) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const { id } = req.params;

      const vehicleResult = await client.query(
        "SELECT * FROM vehicles WHERE vehicle_id = $1",
        [id],
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
             next_verification_due = NOW() + INTERVAL '2 months',
             updated_at = NOW()
         WHERE vehicle_id = $1`,
        [id],
      );

      await client.query("COMMIT");

      console.log(`✅ Admin approved vehicle: ${id}`);

      // Emit events
      await eventEmitter.emit("vehicle.status_changed", {
        vehicleId: id,
        oldStatus: "pending",
        newStatus: "active",
      });

      await eventEmitter.emit("vehicle.verification_status_changed", {
        vehicleId: id,
        verificationStatus: "approved",
      });

      res.json({
        message: "Vehicle approved and now active",
        vehicleId: id,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("❌ Approve vehicle error:", error);
      next(error);
    } finally {
      client.release();
    }
  }

  /**
   * POST /admin/:id/reject
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
        [id],
      );

      if (vehicleResult.rows.length === 0) {
        return res.status(404).json({ error: "Vehicle not found" });
      }

      await client.query(
        `UPDATE vehicles 
         SET status = 'stopped',
             verification_status = 'rejected',
             rejection_reason = $1,
             verification_notes = $1,
             updated_at = NOW()
         WHERE vehicle_id = $2`,
        [reason, id],
      );

      await client.query("COMMIT");

      console.log(`❌ Admin rejected vehicle: ${id}`);

      // Emit events
      await eventEmitter.emit("vehicle.status_changed", {
        vehicleId: id,
        newStatus: "stopped",
        reason,
      });

      await eventEmitter.emit("vehicle.verification_status_changed", {
        vehicleId: id,
        verificationStatus: "rejected",
        reason,
      });

      res.json({
        message: "Vehicle listing rejected",
        vehicleId: id,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("❌ Reject vehicle error:", error);
      next(error);
    } finally {
      client.release();
    }
  }
}

module.exports = new AdminVehicleController();
