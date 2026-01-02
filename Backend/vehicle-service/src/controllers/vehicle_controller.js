// Backend/vehicle-service/src/controllers/vehicle_controller.js
const pool = require("../config/database");

class VehicleController {
  /**
   * Search vehicles (public)
   * Filter by location, type, price, dates, etc.
   */
  async searchVehicles(req, res, next) {
    try {
      const {
        vehicleType,
        transmission,
        fuelType,
        minSeats,
        maxPrice,
        minPrice,
        city,
        district,
        startDate,
        endDate,
        sortBy = "price",
        page = 1,
        limit = 20,
      } = req.query;

      console.log("🔍 Search query:", { city, district, startDate, endDate });

      // ✅ Build base query - check availability ONLY if dates provided
      let query = `
        SELECT 
          v.*,
          (SELECT photo_url FROM vehicle_photos 
           WHERE vehicle_id = v.vehicle_id AND is_primary = true 
           LIMIT 1) as primary_photo
      `;

      // ✅ Only check availability if dates are provided
      if (startDate && endDate) {
        query += `,
          (SELECT COUNT(*) FROM vehicle_unavailability 
           WHERE vehicle_id = v.vehicle_id 
           AND start_date <= $1 AND end_date >= $2) as unavailable_count
        `;
      } else {
        query += `, 0 as unavailable_count`;
      }

      query += `
        FROM vehicles v
        WHERE v.status = 'active'
      `;

      const params = [];
      let paramIndex = 1;

      // Date availability check params (if dates provided)
      if (startDate && endDate) {
        params.push(endDate, startDate);
        paramIndex += 2;
      }

      // Filters
      if (vehicleType) {
        query += ` AND v.vehicle_type = $${paramIndex}`;
        params.push(vehicleType);
        paramIndex++;
      }

      if (transmission) {
        query += ` AND v.transmission = $${paramIndex}`;
        params.push(transmission);
        paramIndex++;
      }

      if (fuelType) {
        query += ` AND v.fuel_type = $${paramIndex}`;
        params.push(fuelType);
        paramIndex++;
      }

      if (minSeats) {
        query += ` AND v.seats >= $${paramIndex}`;
        params.push(parseInt(minSeats));
        paramIndex++;
      }

      if (minPrice) {
        query += ` AND v.price_per_day >= $${paramIndex}`;
        params.push(parseInt(minPrice));
        paramIndex++;
      }

      if (maxPrice) {
        query += ` AND v.price_per_day <= $${paramIndex}`;
        params.push(parseInt(maxPrice));
        paramIndex++;
      }

      // ✅ Location filters with partial matching - GLOBAL SEARCH ENABLED
      if (city && city.trim() !== "") {
        query += ` AND (
          v.location->>'city' ILIKE ${paramIndex} OR 
          v.location->>'address' ILIKE ${paramIndex} OR
          v.location->>'country' ILIKE ${paramIndex}
        )`;
        params.push(`%${city}%`);
        paramIndex++;
      }

      if (district && district.trim() !== "") {
        query += ` AND (
          v.location->>'district' ILIKE ${paramIndex} OR 
          v.location->>'address' ILIKE ${paramIndex}
        )`;
        params.push(`%${district}%`);
        paramIndex++;
      }

      // Sorting
      const sortFields = {
        price: "v.price_per_day ASC",
        "price-desc": "v.price_per_day DESC",
        rating: "v.average_rating DESC",
        rentals: "v.total_rentals DESC",
        newest: "v.created_at DESC",
      };

      query += ` ORDER BY ${sortFields[sortBy] || sortFields.price}`;
      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

      console.log("📝 SQL params:", params);
      console.log("🔍 Full query:", query);

      const result = await pool.query(query, params);

      console.log(`✅ Found ${result.rows.length} vehicles`);

      // ✅ Debug: Log first vehicle if found
      if (result.rows.length > 0) {
        console.log("📦 Sample vehicle:", {
          name: result.rows[0].name,
          location: result.rows[0].location,
          unavailable_count: result.rows[0].unavailable_count,
        });
      } else {
        console.log("⚠️ No vehicles found - checking database...");

        // Debug query: Check total vehicles in database
        const debugResult = await pool.query(
          "SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'active') as active FROM vehicles"
        );
        console.log("📊 Database stats:", debugResult.rows[0]);

        // Check if there are any unavailability records for the date range
        if (startDate && endDate) {
          const unavailDebug = await pool.query(
            `SELECT COUNT(*) as count 
             FROM vehicle_unavailability 
             WHERE start_date <= $1 AND end_date >= $2`,
            [endDate, startDate]
          );
          console.log(
            "📅 Unavailability records in date range:",
            unavailDebug.rows[0]
          );
        }
      }

      // Count total (for pagination)
      let countQuery = "SELECT COUNT(*) FROM vehicles WHERE status = 'active'";
      const countParams = [];
      let countParamIndex = 1;

      // Add same filters to count query
      if (vehicleType) {
        countQuery += ` AND vehicle_type = $${countParamIndex}`;
        countParams.push(vehicleType);
        countParamIndex++;
      }

      if (transmission) {
        countQuery += ` AND transmission = $${countParamIndex}`;
        countParams.push(transmission);
        countParamIndex++;
      }

      if (fuelType) {
        countQuery += ` AND fuel_type = $${countParamIndex}`;
        countParams.push(fuelType);
        countParamIndex++;
      }

      if (minSeats) {
        countQuery += ` AND seats >= $${countParamIndex}`;
        countParams.push(parseInt(minSeats));
        countParamIndex++;
      }

      if (minPrice) {
        countQuery += ` AND price_per_day >= $${countParamIndex}`;
        countParams.push(parseInt(minPrice));
        countParamIndex++;
      }

      if (maxPrice) {
        countQuery += ` AND price_per_day <= $${countParamIndex}`;
        countParams.push(parseInt(maxPrice));
        countParamIndex++;
      }

      if (city) {
        countQuery += ` AND (location->>'city' ILIKE $${countParamIndex} OR location->>'address' ILIKE $${countParamIndex})`;
        countParams.push(`%${city}%`);
        countParamIndex++;
      }

      if (district) {
        countQuery += ` AND (location->>'district' ILIKE $${countParamIndex} OR location->>'address' ILIKE $${countParamIndex})`;
        countParams.push(`%${district}%`);
        countParamIndex++;
      }

      const countResult = await pool.query(countQuery, countParams);

      res.json({
        vehicles: result.rows.map((vehicle) => ({
          id: vehicle.vehicle_id,
          name: vehicle.name,
          vehicleType: vehicle.vehicle_type,
          transmission: vehicle.transmission,
          fuelType: vehicle.fuel_type,
          seats: vehicle.seats,
          year: vehicle.year,
          pricePerDay: vehicle.price_per_day,
          rating: parseFloat(vehicle.average_rating),
          totalRentals: vehicle.total_rentals,
          primaryPhoto: vehicle.primary_photo,
          location: vehicle.location,
          instantBooking: vehicle.instant_booking,
          driverSupported: vehicle.driver_supported,
          deliveryAvailable: vehicle.delivery_available,
          isAvailable: vehicle.unavailable_count === 0,
        })),
        pagination: {
          total: parseInt(countResult.rows[0].count),
          page: parseInt(page),
          limit: parseInt(limit),
        },
      });
    } catch (error) {
      console.error("❌ Search vehicles error:", error);
      next(error);
    }
  }

  /**
   * Get vehicle details by ID (public)
   */
  async getVehicleById(req, res, next) {
    try {
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
         WHERE v.vehicle_id = $1 AND v.status = 'active'`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: "Vehicle not found or not available",
        });
      }

      const vehicle = result.rows[0];

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
            rating: parseFloat(vehicle.average_rating),
            reviewCount: vehicle.review_count,
          },
          rules: vehicle.rules || {},
          createdAt: vehicle.created_at,
        },
      });
    } catch (error) {
      console.error("Get vehicle error:", error);
      next(error);
    }
  }

  /**
   * Check vehicle availability for dates
   */
  async checkAvailability(req, res, next) {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          error: "startDate and endDate are required",
        });
      }

      // Check if vehicle exists and is active
      const vehicleResult = await pool.query(
        "SELECT vehicle_id, name, price_per_day FROM vehicles WHERE vehicle_id = $1 AND status = 'active'",
        [id]
      );

      if (vehicleResult.rows.length === 0) {
        return res.status(404).json({
          error: "Vehicle not found or not available",
        });
      }

      // Check unavailability periods
      const unavailableResult = await pool.query(
        `SELECT * FROM vehicle_unavailability 
         WHERE vehicle_id = $1 
         AND (
           (start_date <= $2 AND end_date >= $2) OR
           (start_date <= $3 AND end_date >= $3) OR
           (start_date >= $2 AND end_date <= $3)
         )`,
        [id, startDate, endDate]
      );

      const isAvailable = unavailableResult.rows.length === 0;

      res.json({
        vehicleId: id,
        isAvailable,
        message: isAvailable
          ? "Vehicle is available for selected dates"
          : "Vehicle is not available for selected dates",
        unavailablePeriods: unavailableResult.rows.map((period) => ({
          startDate: period.start_date,
          endDate: period.end_date,
          reason: period.reason,
        })),
      });
    } catch (error) {
      console.error("Check availability error:", error);
      next(error);
    }
  }
}

module.exports = new VehicleController();
