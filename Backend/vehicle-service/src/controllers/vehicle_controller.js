// Backend/vehicle-service/src/controllers/vehicle_controller.js

const pool = require("../config/database");
const { getUserInfo, getUsersInfo } = require("../grpc/user_grpc_client");

class VehicleController {
  /**
   * Search vehicles (public) - WITH OWNER INFO
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

      // Build main query
      let query = `
        SELECT 
          v.*,
          (SELECT photo_url FROM vehicle_photos 
           WHERE vehicle_id = v.vehicle_id AND is_primary = true 
           LIMIT 1) as primary_photo
      `;

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

      // Availability overlap check parameters
      if (startDate && endDate) {
        params.push(endDate, startDate); // $1 = endDate, $2 = startDate for overlap
        paramIndex += 2;
      }

      // Apply filters
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

      // Location search (partial match on city, district, address)
      if (city && city.trim()) {
        query += ` AND (
          v.location->>'city' ILIKE $${paramIndex} OR 
          v.location->>'address' ILIKE $${paramIndex} OR
          v.location->>'country' ILIKE $${paramIndex}
        )`;
        params.push(`%${city.trim()}%`);
        paramIndex++;
      }
      if (district && district.trim()) {
        query += ` AND (
          v.location->>'district' ILIKE $${paramIndex} OR 
          v.location->>'address' ILIKE $${paramIndex}
        )`;
        params.push(`%${district.trim()}%`);
        paramIndex++;
      }

      // Sorting
      const sortFields = {
        price: "v.price_per_day ASC",
        "price-desc": "v.price_per_day DESC",
        rating: "v.average_rating DESC NULLS LAST",
        rentals: "v.total_rentals DESC",
        newest: "v.created_at DESC",
      };
      query += ` ORDER BY ${sortFields[sortBy] || sortFields.price}`;
      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

      const result = await pool.query(query, params);
      console.log(`✅ Found ${result.rows.length} vehicles`);

      // === BATCH FETCH OWNER INFO ===
      const ownerIds = [...new Set(result.rows.map((v) => v.owner_id))];
      const ownersMap = new Map();

      if (ownerIds.length > 0) {
        try {
          console.log(
            `📞 Fetching info for ${ownerIds.length} owners via gRPC...`
          );
          const users = await getUsersInfo(ownerIds);

          users.forEach((user) => {
            ownersMap.set(user.userId, {
              name: user.fullName || "Vehicle Owner",
              avatar: user.avatarUrl || null,
            });
          });

          console.log(
            `✅ Successfully loaded ${ownersMap.size} owner profiles`
          );
        } catch (error) {
          console.warn(
            "⚠️ gRPC batch fetch failed – using default owner info:",
            error.message
          );
          // Fallback: default for all
          ownerIds.forEach((id) => {
            ownersMap.set(id, { name: "Vehicle Owner", avatar: null });
          });
        }
      }

      // === COUNT QUERY FOR PAGINATION ===
      let countQuery = "SELECT COUNT(*) FROM vehicles WHERE status = 'active'";
      const countParams = [];
      let cIdx = 1;

      // Reapply same filters to count query
      if (vehicleType) {
        countQuery += ` AND vehicle_type = $${cIdx++}`;
        countParams.push(vehicleType);
      }
      if (transmission) {
        countQuery += ` AND transmission = $${cIdx++}`;
        countParams.push(transmission);
      }
      if (fuelType) {
        countQuery += ` AND fuel_type = $${cIdx++}`;
        countParams.push(fuelType);
      }
      if (minSeats) {
        countQuery += ` AND seats >= $${cIdx++}`;
        countParams.push(parseInt(minSeats));
      }
      if (minPrice) {
        countQuery += ` AND price_per_day >= $${cIdx++}`;
        countParams.push(parseInt(minPrice));
      }
      if (maxPrice) {
        countQuery += ` AND price_per_day <= $${cIdx++}`;
        countParams.push(parseInt(maxPrice));
      }
      if (city && city.trim()) {
        countQuery += ` AND (location->>'city' ILIKE $${cIdx} OR location->>'address' ILIKE $${cIdx} OR location->>'country' ILIKE $${cIdx})`;
        countParams.push(`%${city.trim()}%`);
        cIdx++;
      }
      if (district && district.trim()) {
        countQuery += ` AND (location->>'district' ILIKE $${cIdx} OR location->>'address' ILIKE $${cIdx})`;
        countParams.push(`%${district.trim()}%`);
        cIdx++;
      }

      const countResult = await pool.query(countQuery, countParams);

      // === BUILD RESPONSE ===
      res.json({
        vehicles: result.rows.map((vehicle) => {
          const ownerInfo = ownersMap.get(vehicle.owner_id) || {
            name: "Vehicle Owner",
            avatar: null,
          };

          return {
            id: vehicle.vehicle_id,
            name: vehicle.name,
            vehicleType: vehicle.vehicle_type,
            transmission: vehicle.transmission,
            fuelType: vehicle.fuel_type,
            seats: vehicle.seats,
            year: vehicle.year,
            pricePerDay: vehicle.price_per_day,
            rating: parseFloat(vehicle.average_rating || 0),
            totalRentals: vehicle.total_rentals || 0,
            primaryPhoto: vehicle.primary_photo,
            location: vehicle.location,
            instantBooking: vehicle.instant_booking,
            driverSupported: vehicle.driver_supported,
            deliveryAvailable: vehicle.delivery_available,
            isAvailable: vehicle.unavailable_count === 0,
            ownerId: vehicle.owner_id,
            ownerName: ownerInfo.name,
            ownerAvatar: ownerInfo.avatar,
          };
        }),
        pagination: {
          total: parseInt(countResult.rows[0].count),
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(
            parseInt(countResult.rows[0].count) / parseInt(limit)
          ),
        },
      });
    } catch (error) {
      console.error("❌ Search vehicles error:", error);
      next(error);
    }
  }

  /**
   * Get vehicle details by ID (public) - WITH OWNER INFO
   */
  async getVehicleById(req, res, next) {
    try {
      const { id } = req.params;

      const result = await pool.query(
        `SELECT 
          v.*,
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
        return res
          .status(404)
          .json({ error: "Vehicle not found or not available" });
      }

      const vehicle = result.rows[0];

      // === FETCH SINGLE OWNER INFO WITH FALLBACK ===
      let ownerName = "Vehicle Owner";
      let ownerAvatar = null;

      try {
        console.log(`📞 Fetching owner info for user ${vehicle.owner_id}...`);
        const user = await getUserInfo(vehicle.owner_id);
        ownerName = user.fullName || ownerName;
        ownerAvatar = user.avatarUrl || ownerAvatar;
        console.log(`✅ Owner loaded: ${ownerName}`);
      } catch (error) {
        console.warn(
          "⚠️ Failed to fetch owner info via gRPC – using defaults:",
          error.message
        );
      }

      res.json({
        vehicle: {
          id: vehicle.vehicle_id,
          ownerId: vehicle.owner_id,
          ownerName,
          ownerAvatar,
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
            instantBooking: vehicle.instant_booking,
            driverSupported: vehicle.driver_supported,
            deliveryAvailable: vehicle.delivery_available,
            unavailablePeriods: vehicle.unavailable_periods || [],
          },
          performance: {
            totalRentals: vehicle.total_rentals || 0,
            rating: parseFloat(vehicle.average_rating || 0),
            reviewCount: vehicle.review_count || 0,
          },
          rules: vehicle.rules || {},
          createdAt: vehicle.created_at,
        },
      });
    } catch (error) {
      console.error("❌ Get vehicle by ID error:", error);
      next(error);
    }
  }

  /**
   * Check vehicle availability for specific dates
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

      const vehicleResult = await pool.query(
        "SELECT vehicle_id, name, price_per_day FROM vehicles WHERE vehicle_id = $1 AND status = 'active'",
        [id]
      );

      if (vehicleResult.rows.length === 0) {
        return res
          .status(404)
          .json({ error: "Vehicle not found or not available" });
      }

      const unavailableResult = await pool.query(
        `SELECT start_date, end_date, reason 
         FROM vehicle_unavailability 
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
          ? "Vehicle is available for the selected dates"
          : "Vehicle is not available for the selected dates",
        unavailablePeriods: unavailableResult.rows,
      });
    } catch (error) {
      console.error("❌ Check availability error:", error);
      next(error);
    }
  }
}

module.exports = new VehicleController();
