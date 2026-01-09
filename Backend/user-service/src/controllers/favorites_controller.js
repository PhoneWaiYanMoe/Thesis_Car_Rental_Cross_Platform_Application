// Backend/user-service/src/controllers/favorites_controller.js
const pool = require("../config/database");
const vehicleGrpcClient = require("../grpc/vehicle_grpc_client");

class FavoritesController {
  /**
   * Get user's favorite vehicles
   */
  async getFavorites(req, res, next) {
    try {
      const userId = req.user.userId;
      const { page = 1, limit = 20 } = req.query;

      // Get favorite vehicle IDs from database
      const result = await pool.query(
        `SELECT vehicle_id, created_at 
         FROM user_favorite_vehicles 
         WHERE user_id = $1 
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, parseInt(limit), (parseInt(page) - 1) * parseInt(limit)]
      );

      if (result.rows.length === 0) {
        return res.json({
          favorites: [],
          pagination: {
            total: 0,
            page: parseInt(page),
            limit: parseInt(limit),
          },
        });
      }

      // Get total count
      const countResult = await pool.query(
        "SELECT COUNT(*) FROM user_favorite_vehicles WHERE user_id = $1",
        [userId]
      );

      // Fetch vehicle details via gRPC
      const vehicleIds = result.rows.map((row) => row.vehicle_id);
      let vehicles = [];

      try {
        console.log(
          `📞 Fetching ${vehicleIds.length} favorite vehicles via gRPC...`
        );
        vehicles = await vehicleGrpcClient.getVehiclesInfo(vehicleIds);
        console.log(`✅ Fetched ${vehicles.length} vehicle details`);
      } catch (error) {
        console.error(
          "⚠️ Failed to fetch vehicle details via gRPC:",
          error.message
        );
        // Return vehicle IDs without details if gRPC fails
        return res.json({
          favorites: result.rows.map((row) => ({
            vehicleId: row.vehicle_id,
            addedAt: row.created_at,
            vehicleDetails: null,
          })),
          pagination: {
            total: parseInt(countResult.rows[0].count),
            page: parseInt(page),
            limit: parseInt(limit),
          },
          warning: "Could not fetch vehicle details",
        });
      }

      // Map vehicle details with favorite metadata
      const vehicleMap = vehicles.reduce((map, vehicle) => {
        map[vehicle.vehicle_id] = vehicle;
        return map;
      }, {});

      const favorites = result.rows.map((row) => ({
        vehicleId: row.vehicle_id,
        addedAt: row.created_at,
        vehicleDetails: vehicleMap[row.vehicle_id] || null,
      }));

      res.json({
        favorites,
        pagination: {
          total: parseInt(countResult.rows[0].count),
          page: parseInt(page),
          limit: parseInt(limit),
        },
      });
    } catch (error) {
      console.error("Get favorites error:", error);
      next(error);
    }
  }

  /**
   * Add vehicle to favorites
   */
  async addFavorite(req, res, next) {
    try {
      const userId = req.user.userId;
      const { vehicleId } = req.body;

      if (!vehicleId) {
        return res.status(400).json({
          error: "vehicleId is required",
        });
      }

      // Verify vehicle exists via gRPC
      try {
        const vehicle = await vehicleGrpcClient.getVehicleInfo(vehicleId);

        if (vehicle.status !== "active") {
          return res.status(400).json({
            error: "Cannot favorite inactive vehicle",
            vehicleStatus: vehicle.status,
          });
        }
      } catch (error) {
        console.error("Vehicle verification failed:", error);
        return res.status(404).json({
          error: "Vehicle not found",
        });
      }

      // Add to favorites
      try {
        await pool.query(
          `INSERT INTO user_favorite_vehicles (user_id, vehicle_id)
           VALUES ($1, $2)
           ON CONFLICT (user_id, vehicle_id) DO NOTHING`,
          [userId, vehicleId]
        );

        console.log(
          `✅ User ${userId} added vehicle ${vehicleId} to favorites`
        );

        res.status(201).json({
          message: "Vehicle added to favorites",
          vehicleId: vehicleId,
        });
      } catch (dbError) {
        console.error("Database error:", dbError);
        return res.status(500).json({
          error: "Failed to add favorite",
        });
      }
    } catch (error) {
      console.error("Add favorite error:", error);
      next(error);
    }
  }

  /**
   * Remove vehicle from favorites
   */
  async removeFavorite(req, res, next) {
    try {
      const userId = req.user.userId;
      const { vehicleId } = req.params;

      const result = await pool.query(
        "DELETE FROM user_favorite_vehicles WHERE user_id = $1 AND vehicle_id = $2 RETURNING vehicle_id",
        [userId, vehicleId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: "Vehicle not in favorites",
        });
      }

      console.log(
        `✅ User ${userId} removed vehicle ${vehicleId} from favorites`
      );

      res.json({
        message: "Vehicle removed from favorites",
        vehicleId: vehicleId,
      });
    } catch (error) {
      console.error("Remove favorite error:", error);
      next(error);
    }
  }

  /**
   * Check if vehicle is favorited
   */
  async checkFavorite(req, res, next) {
    try {
      const userId = req.user.userId;
      const { vehicleId } = req.params;

      const result = await pool.query(
        "SELECT 1 FROM user_favorite_vehicles WHERE user_id = $1 AND vehicle_id = $2",
        [userId, vehicleId]
      );

      res.json({
        vehicleId: vehicleId,
        isFavorited: result.rows.length > 0,
      });
    } catch (error) {
      console.error("Check favorite error:", error);
      next(error);
    }
  }

  /**
   * Get favorite count
   */
  async getFavoriteCount(req, res, next) {
    try {
      const userId = req.user.userId;

      const result = await pool.query(
        "SELECT COUNT(*) FROM user_favorite_vehicles WHERE user_id = $1",
        [userId]
      );

      res.json({
        count: parseInt(result.rows[0].count),
      });
    } catch (error) {
      console.error("Get favorite count error:", error);
      next(error);
    }
  }
}

module.exports = new FavoritesController();
