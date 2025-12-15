const { v4: uuidv4 } = require("uuid");
const pool = require("../config/database");

class VehicleController {
  // Get all vehicles (with filters)
  async getAllVehicles(req, res, next) {
    try {
      const { status, vehicleType, ownerId, search, sortBy = 'created_at', order = 'DESC' } = req.query;

      let query = `
        SELECT v.*, 
               json_agg(DISTINCT jsonb_build_object('name', vf.feature_name)) FILTER (WHERE vf.feature_name IS NOT NULL) as features,
               json_agg(DISTINCT jsonb_build_object('url', vi.image_url, 'isPrimary', vi.is_primary)) FILTER (WHERE vi.image_url IS NOT NULL) as images,
               u.full_name as owner_name
        FROM vehicles v
        LEFT JOIN vehicle_features vf ON v.vehicle_id = vf.vehicle_id
        LEFT JOIN vehicle_images vi ON v.vehicle_id = vi.vehicle_id
        LEFT JOIN users u ON v.owner_id = u.user_id
        WHERE 1=1
      `;

      const params = [];
      let paramIndex = 1;

      if (status) {
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
        query += ` AND (v.name ILIKE $${paramIndex} OR v.location ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      query += ` GROUP BY v.vehicle_id, u.full_name`;
      query += ` ORDER BY v.${sortBy} ${order}`;

      const result = await pool.query(query, params);

      res.json({
        vehicles: result.rows,
        total: result.rows.length
      });
    } catch (error) {
      console.error("Get vehicles error:", error);
      next(error);
    }
  }

  // Get vehicle by ID
  async getVehicleById(req, res, next) {
    try {
      const { id } = req.params;

      const result = await pool.query(
        `SELECT v.*, 
                json_agg(DISTINCT jsonb_build_object('name', vf.feature_name)) FILTER (WHERE vf.feature_name IS NOT NULL) as features,
                json_agg(DISTINCT jsonb_build_object('url', vi.image_url, 'isPrimary', vi.is_primary)) FILTER (WHERE vi.image_url IS NOT NULL) as images,
                u.full_name as owner_name, u.email as owner_email, u.phone as owner_phone
         FROM vehicles v
         LEFT JOIN vehicle_features vf ON v.vehicle_id = vf.vehicle_id
         LEFT JOIN vehicle_images vi ON v.vehicle_id = vi.vehicle_id
         LEFT JOIN users u ON v.owner_id = u.user_id
         WHERE v.vehicle_id = $1
         GROUP BY v.vehicle_id, u.full_name, u.email, u.phone`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Vehicle not found" });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Get vehicle error:", error);
      next(error);
    }
  }

  // Create vehicle (owner or admin)
  async createVehicle(req, res, next) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const {
        name,
        vehicleType,
        seater,
        fuelType,
        transmission,
        year,
        pricePerDay,
        mileage,
        location,
        availability,
        insuranceType,
        features,
        images
      } = req.body;

      const vehicleId = uuidv4();
      const ownerId = req.user.userId; // From JWT token

      // Insert vehicle
      const result = await client.query(
        `INSERT INTO vehicles (
          vehicle_id, owner_id, name, vehicle_type, seater, fuel_type, 
          transmission, year, price_per_day, mileage, location, 
          availability, insurance_type
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *`,
        [
          vehicleId, ownerId, name, vehicleType, seater, fuelType,
          transmission, year, pricePerDay, mileage, location,
          availability, insuranceType
        ]
      );

      // Insert features
      if (features && features.length > 0) {
        for (const feature of features) {
          await client.query(
            'INSERT INTO vehicle_features (vehicle_id, feature_name) VALUES ($1, $2)',
            [vehicleId, feature]
          );
        }
      }

      // Insert images
      if (images && images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          await client.query(
            'INSERT INTO vehicle_images (vehicle_id, image_url, is_primary) VALUES ($1, $2, $3)',
            [vehicleId, images[i], i === 0] // First image is primary
          );
        }
      }

      await client.query('COMMIT');

      res.status(201).json({
        message: "Vehicle created successfully",
        vehicle: result.rows[0]
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error("Create vehicle error:", error);
      next(error);
    } finally {
      client.release();
    }
  }

  // Update vehicle (owner only)
  async updateVehicle(req, res, next) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Check ownership
      const ownerCheck = await pool.query(
        'SELECT owner_id FROM vehicles WHERE vehicle_id = $1',
        [id]
      );

      if (ownerCheck.rows.length === 0) {
        return res.status(404).json({ error: "Vehicle not found" });
      }

      if (ownerCheck.rows[0].owner_id !== req.user.userId && req.user.role !== 'admin') {
        return res.status(403).json({ error: "Not authorized to update this vehicle" });
      }

      // Build dynamic update query
      const fields = [];
      const values = [];
      let paramIndex = 1;

      Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined) {
          fields.push(`${key} = $${paramIndex}`);
          values.push(updates[key]);
          paramIndex++;
        }
      });

      if (fields.length === 0) {
        return res.status(400).json({ error: "No fields to update" });
      }

      fields.push(`updated_at = NOW()`);
      values.push(id);

      const query = `UPDATE vehicles SET ${fields.join(', ')} WHERE vehicle_id = $${paramIndex} RETURNING *`;
      const result = await pool.query(query, values);

      res.json({
        message: "Vehicle updated successfully",
        vehicle: result.rows[0]
      });
    } catch (error) {
      console.error("Update vehicle error:", error);
      next(error);
    }
  }

  // Update vehicle status (admin only)
  async updateVehicleStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const result = await pool.query(
        'UPDATE vehicles SET status = $1, updated_at = NOW() WHERE vehicle_id = $2 RETURNING *',
        [status, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Vehicle not found" });
      }

      res.json({
        message: "Vehicle status updated successfully",
        vehicle: result.rows[0]
      });
    } catch (error) {
      console.error("Update status error:", error);
      next(error);
    }
  }

  // Delete vehicle (owner or admin)
  async deleteVehicle(req, res, next) {
    try {
      const { id } = req.params;

      // Check ownership
      const ownerCheck = await pool.query(
        'SELECT owner_id FROM vehicles WHERE vehicle_id = $1',
        [id]
      );

      if (ownerCheck.rows.length === 0) {
        return res.status(404).json({ error: "Vehicle not found" });
      }

      if (ownerCheck.rows[0].owner_id !== req.user.userId && req.user.role !== 'admin') {
        return res.status(403).json({ error: "Not authorized to delete this vehicle" });
      }

      await pool.query('DELETE FROM vehicles WHERE vehicle_id = $1', [id]);

      res.json({ message: "Vehicle deleted successfully" });
    } catch (error) {
      console.error("Delete vehicle error:", error);
      next(error);
    }
  }

  // Get statistics (admin only)
  async getStatistics(req, res, next) {
    try {
      const stats = await pool.query(`
        SELECT 
          COUNT(*) as total_vehicles,
          COUNT(*) FILTER (WHERE status = 'normal') as active_vehicles,
          COUNT(*) FILTER (WHERE status = 'stopped') as stopped_vehicles,
          COUNT(*) FILTER (WHERE status = 'banned') as banned_vehicles,
          AVG(rating) as average_rating,
          SUM(total_rentals) as total_rentals,
          COUNT(DISTINCT vehicle_type) as vehicle_types,
          COUNT(DISTINCT owner_id) as total_owners
        FROM vehicles
      `);

      res.json(stats.rows[0]);
    } catch (error) {
      console.error("Get statistics error:", error);
      next(error);
    }
  }
}

module.exports = new VehicleController();