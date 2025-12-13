const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");
const nominatimService = require("../services/nominatim_service");
const cacheService = require("../services/cache_service");
const pool = require("../config/database");

// Load proto file
const PROTO_PATH = path.join(__dirname, "../../proto/location.proto");
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const locationProto = grpc.loadPackageDefinition(packageDefinition).location;

class LocationGrpcServer {
  constructor() {
    this.server = new grpc.Server();
  }

  // ==================== EXISTING METHODS ====================

  async searchLocation(call, callback) {
    try {
      const { query, limit } = call.request;

      if (!query || query.trim().length === 0) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: "Query parameter is required",
        });
      }

      const cacheKey = `search:${query}:${limit || 10}`;
      const cached = await cacheService.get(cacheKey);

      if (cached) {
        console.log("✅ gRPC Cache hit for:", query);
        return callback(null, { results: JSON.parse(cached) });
      }

      const results = await nominatimService.search(query, limit || 10);
      await cacheService.set(cacheKey, JSON.stringify(results), 3600);

      callback(null, { results });
    } catch (error) {
      console.error("❌ gRPC searchLocation error:", error);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message,
      });
    }
  }

  async reverseGeocode(call, callback) {
    try {
      const { latitude, longitude } = call.request;

      if (!latitude || !longitude) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: "Latitude and longitude are required",
        });
      }

      const cacheKey = `reverse:${latitude}:${longitude}`;
      const cached = await cacheService.get(cacheKey);

      if (cached) {
        console.log("✅ gRPC Cache hit for reverse geocode");
        return callback(null, JSON.parse(cached));
      }

      const result = await nominatimService.reverse(latitude, longitude);
      await cacheService.set(cacheKey, JSON.stringify(result), 86400);

      callback(null, result);
    } catch (error) {
      console.error("❌ gRPC reverseGeocode error:", error);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message,
      });
    }
  }

  async getPlaceDetails(call, callback) {
    try {
      const { place_id } = call.request;

      if (!place_id) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: "Place ID is required",
        });
      }

      const cacheKey = `details:${place_id}`;
      const cached = await cacheService.get(cacheKey);

      if (cached) {
        return callback(null, JSON.parse(cached));
      }

      const result = await nominatimService.getDetails(place_id);
      await cacheService.set(cacheKey, JSON.stringify(result), 86400);

      callback(null, result);
    } catch (error) {
      console.error("❌ gRPC getPlaceDetails error:", error);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message,
      });
    }
  }

  async calculateDistance(call, callback) {
    try {
      const { lat1, lon1, lat2, lon2 } = call.request;

      if (!lat1 || !lon1 || !lat2 || !lon2) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: "All coordinates are required",
        });
      }

      const distance = nominatimService.calculateDistance(
        lat1,
        lon1,
        lat2,
        lon2
      );

      callback(null, {
        distance: Math.round(distance * 100) / 100,
        unit: "km",
      });
    } catch (error) {
      console.error("❌ gRPC calculateDistance error:", error);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message,
      });
    }
  }

  async checkServiceArea(call, callback) {
    try {
      const { latitude, longitude } = call.request;

      if (!latitude || !longitude) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: "Latitude and longitude are required",
        });
      }

      const hcmCenter = { lat: 10.8231, lon: 106.6297 };
      const maxDistance = 50;

      const distance = nominatimService.calculateDistance(
        latitude,
        longitude,
        hcmCenter.lat,
        hcmCenter.lon
      );

      const inServiceArea = distance <= maxDistance;

      callback(null, {
        in_service_area: inServiceArea,
        distance: Math.round(distance * 100) / 100,
        message: inServiceArea
          ? "Location is within service area"
          : `Location is ${Math.round(distance)}km away from service area`,
      });
    } catch (error) {
      console.error("❌ gRPC checkServiceArea error:", error);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message,
      });
    }
  }

  // ==================== HISTORY METHODS ====================

  async getSearchHistory(call, callback) {
    try {
      const { user_id, limit = 10 } = call.request;

      if (!user_id) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: "User ID is required",
        });
      }

      const result = await pool.query(
        `SELECT id, display_name, short_name, subtitle, latitude, longitude, 
                to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at
         FROM location_history 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2`,
        [user_id, limit]
      );

      console.log(
        `✅ gRPC: Loaded ${result.rows.length} history items for user ${user_id}`
      );

      callback(null, { items: result.rows });
    } catch (error) {
      console.error("❌ gRPC getSearchHistory error:", error);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message,
      });
    }
  }

  async saveToHistory(call, callback) {
    try {
      const {
        user_id,
        display_name,
        short_name,
        subtitle,
        latitude,
        longitude,
      } = call.request;

      if (!user_id || !display_name || !latitude || !longitude) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message:
            "user_id, display_name, latitude, and longitude are required",
        });
      }

      // Check if location already exists
      const existing = await pool.query(
        `SELECT id FROM location_history 
         WHERE user_id = $1 AND latitude = $2 AND longitude = $3`,
        [user_id, latitude, longitude]
      );

      if (existing.rows.length > 0) {
        // Update timestamp
        await pool.query(
          `UPDATE location_history 
           SET created_at = NOW() 
           WHERE id = $1`,
          [existing.rows[0].id]
        );

        console.log(`✅ gRPC: Updated history for user ${user_id}`);
        callback(null, {
          success: true,
          message: "History updated",
          id: existing.rows[0].id,
        });
        return;
      }

      // Insert new history item
      const result = await pool.query(
        `INSERT INTO location_history 
         (user_id, display_name, short_name, subtitle, latitude, longitude) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING id`,
        [user_id, display_name, short_name, subtitle, latitude, longitude]
      );

      // Keep only last 10 items
      await pool.query(
        `DELETE FROM location_history 
         WHERE user_id = $1 
         AND id NOT IN (
           SELECT id FROM location_history 
           WHERE user_id = $1 
           ORDER BY created_at DESC 
           LIMIT 10
         )`,
        [user_id]
      );

      console.log(`✅ gRPC: Saved location to history for user ${user_id}`);
      callback(null, {
        success: true,
        message: "Location saved to history",
        id: result.rows[0].id,
      });
    } catch (error) {
      console.error("❌ gRPC saveToHistory error:", error);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message,
      });
    }
  }

  async deleteFromHistory(call, callback) {
    try {
      const { user_id, id } = call.request;

      if (!user_id || !id) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: "user_id and id are required",
        });
      }

      await pool.query(
        `DELETE FROM location_history WHERE id = $1 AND user_id = $2`,
        [id, user_id]
      );

      console.log(`✅ gRPC: Deleted history item ${id} for user ${user_id}`);
      callback(null, {
        success: true,
        message: "Location deleted from history",
      });
    } catch (error) {
      console.error("❌ gRPC deleteFromHistory error:", error);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message,
      });
    }
  }

  async clearHistory(call, callback) {
    try {
      const { user_id } = call.request;

      if (!user_id) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: "User ID is required",
        });
      }

      await pool.query(`DELETE FROM location_history WHERE user_id = $1`, [
        user_id,
      ]);

      console.log(`✅ gRPC: Cleared history for user ${user_id}`);
      callback(null, {
        success: true,
        message: "History cleared",
      });
    } catch (error) {
      console.error("❌ gRPC clearHistory error:", error);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message,
      });
    }
  }

  start(port = 50051) {
    // Add service implementation
    this.server.addService(locationProto.LocationService.service, {
      SearchLocation: this.searchLocation.bind(this),
      ReverseGeocode: this.reverseGeocode.bind(this),
      GetPlaceDetails: this.getPlaceDetails.bind(this),
      CalculateDistance: this.calculateDistance.bind(this),
      CheckServiceArea: this.checkServiceArea.bind(this),
      // History methods
      GetSearchHistory: this.getSearchHistory.bind(this),
      SaveToHistory: this.saveToHistory.bind(this),
      DeleteFromHistory: this.deleteFromHistory.bind(this),
      ClearHistory: this.clearHistory.bind(this),
    });

    this.server.bindAsync(
      `0.0.0.0:${port}`,
      grpc.ServerCredentials.createInsecure(),
      (err, port) => {
        if (err) {
          console.error("❌ Failed to start gRPC server:", err);
          return;
        }
        console.log(`✅ Location gRPC server running on port ${port}`);
      }
    );
  }

  stop() {
    this.server.tryShutdown(() => {
      console.log("gRPC server stopped");
    });
  }
}

module.exports = LocationGrpcServer;
