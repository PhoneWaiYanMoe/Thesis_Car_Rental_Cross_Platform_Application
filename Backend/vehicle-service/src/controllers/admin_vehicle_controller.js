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