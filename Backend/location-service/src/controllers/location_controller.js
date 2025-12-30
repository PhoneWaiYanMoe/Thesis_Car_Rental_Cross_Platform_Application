// Backend/location-service/src/controllers/location_controller.js

const nominatimService = require("../services/nominatim_service");
const cacheService = require("../services/cache_service");
const pool = require("../config/database");

// ✅ Try to load LocationIQ service, fallback to Nominatim if not available
let locationiqService;
try {
  locationiqService = require("../services/locationiq_service");
} catch (error) {
  console.log("ℹ️  LocationIQ service not available, using Nominatim");
  locationiqService = null;
}

// ✅ Smart service selection: Use LocationIQ if API key available and service exists, fallback to Nominatim
const geocodingService =
  locationiqService && process.env.LOCATIONIQ_API_KEY
    ? locationiqService
    : nominatimService;

console.log(
  `🗺️  Using geocoding service: ${
    locationiqService && process.env.LOCATIONIQ_API_KEY
      ? "LocationIQ"
      : "Nominatim"
  }`
);

class LocationController {
  async searchLocation(req, res, next) {
    try {
      const { q, limit = 10 } = req.query;

      if (!q || q.trim().length === 0) {
        return res
          .status(400)
          .json({ error: "Query parameter 'q' is required" });
      }

      const cacheKey = `search:${q}:${limit}`;
      const cached = await cacheService.get(cacheKey);

      if (cached) {
        console.log("✅ Cache hit for:", q);
        return res.json(JSON.parse(cached));
      }

      console.log(
        `🔍 Searching location: "${q}" using ${geocodingService.constructor.name}`
      );

      const results = await geocodingService.search(q, limit);

      await cacheService.set(cacheKey, JSON.stringify(results), 3600);

      console.log(`✅ Found ${results.length} results for: "${q}"`);

      res.json(results);
    } catch (error) {
      console.error("❌ Search error:", error);

      // Provide user-friendly error messages
      if (error.message.includes("Rate limit")) {
        return res.status(429).json({
          error: "Too many requests. Please wait a moment and try again.",
        });
      } else if (error.message.includes("API key")) {
        return res.status(500).json({
          error:
            "Location service configuration error. Please contact support.",
        });
      }

      next(error);
    }
  }

  async reverseGeocode(req, res, next) {
    try {
      const { lat, lon } = req.query;

      if (!lat || !lon) {
        return res
          .status(400)
          .json({ error: "Parameters 'lat' and 'lon' are required" });
      }

      const latitude = parseFloat(lat);
      const longitude = parseFloat(lon);

      if (isNaN(latitude) || isNaN(longitude)) {
        return res.status(400).json({ error: "Invalid coordinates" });
      }

      // Validate coordinate ranges
      if (
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
      ) {
        return res
          .status(400)
          .json({ error: "Coordinates out of valid range" });
      }

      const cacheKey = `reverse:${latitude}:${longitude}`;
      const cached = await cacheService.get(cacheKey);

      if (cached) {
        console.log("✅ Cache hit for reverse geocode");
        return res.json(JSON.parse(cached));
      }

      console.log(`📍 Reverse geocoding: (${latitude}, ${longitude})`);

      const result = await geocodingService.reverse(latitude, longitude);

      await cacheService.set(cacheKey, JSON.stringify(result), 86400);

      console.log(`✅ Reverse geocode result: ${result.displayName}`);

      res.json(result);
    } catch (error) {
      console.error("❌ Reverse geocode error:", error);
      next(error);
    }
  }

  async getPlaceDetails(req, res, next) {
    try {
      const { placeId } = req.params;

      if (!placeId) {
        return res.status(400).json({ error: "Place ID is required" });
      }

      const cacheKey = `details:${placeId}`;
      const cached = await cacheService.get(cacheKey);

      if (cached) {
        console.log("✅ Cache hit for place details");
        return res.json(JSON.parse(cached));
      }

      console.log(`🏢 Getting place details: ${placeId}`);

      const result = (await geocodingService.getDetails)
        ? await geocodingService.getDetails(placeId)
        : await nominatimService.getDetails(placeId);

      await cacheService.set(cacheKey, JSON.stringify(result), 86400);

      res.json(result);
    } catch (error) {
      console.error("❌ Get details error:", error);
      next(error);
    }
  }

  async getSearchHistory(req, res, next) {
    try {
      const userId = req.user.userId;
      const { limit = 10 } = req.query;

      console.log(`📚 Loading history for user: ${userId} (limit: ${limit})`);

      const result = await pool.query(
        `SELECT id, display_name, short_name, subtitle, latitude, longitude, created_at 
         FROM location_history 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2`,
        [userId, limit]
      );

      console.log(
        `✅ Loaded ${result.rows.length} history items for user ${userId}`
      );

      res.json(result.rows);
    } catch (error) {
      console.error("❌ Get history error:", error);
      next(error);
    }
  }

  async saveToHistory(req, res, next) {
    try {
      const userId = req.user.userId;
      const { displayName, shortName, subtitle, latitude, longitude } =
        req.body;

      if (!displayName || !latitude || !longitude) {
        return res.status(400).json({
          error: "displayName, latitude, and longitude are required",
        });
      }

      // Validate coordinates
      const lat = parseFloat(latitude);
      const lon = parseFloat(longitude);

      if (isNaN(lat) || isNaN(lon)) {
        return res.status(400).json({ error: "Invalid coordinates" });
      }

      if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        return res
          .status(400)
          .json({ error: "Coordinates out of valid range" });
      }

      console.log(`💾 Saving to history for user ${userId}: ${displayName}`);

      // Check if location already exists
      const existing = await pool.query(
        `SELECT id FROM location_history 
         WHERE user_id = $1 AND latitude = $2 AND longitude = $3`,
        [userId, lat, lon]
      );

      if (existing.rows.length > 0) {
        // Update timestamp to move to top
        await pool.query(
          `UPDATE location_history 
           SET created_at = NOW(),
               display_name = $1,
               short_name = $2,
               subtitle = $3
           WHERE id = $4`,
          [
            displayName,
            shortName || displayName,
            subtitle || "",
            existing.rows[0].id,
          ]
        );

        console.log(`✅ Updated existing history item: ${existing.rows[0].id}`);

        return res.json({
          message: "History updated",
          id: existing.rows[0].id,
        });
      }

      // Insert new history item
      const result = await pool.query(
        `INSERT INTO location_history 
         (user_id, display_name, short_name, subtitle, latitude, longitude) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING id`,
        [
          userId,
          displayName,
          shortName || displayName,
          subtitle || "",
          lat,
          lon,
        ]
      );

      // Keep only last 10 items per user
      await pool.query(
        `DELETE FROM location_history 
         WHERE user_id = $1 
         AND id NOT IN (
           SELECT id FROM location_history 
           WHERE user_id = $1 
           ORDER BY created_at DESC 
           LIMIT 10
         )`,
        [userId]
      );

      console.log(`✅ Saved new history item: ${result.rows[0].id}`);

      res.status(201).json({
        message: "Location saved to history",
        id: result.rows[0].id,
      });
    } catch (error) {
      console.error("❌ Save history error:", error);
      next(error);
    }
  }

  async deleteFromHistory(req, res, next) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;

      console.log(`🗑️  Deleting history item ${id} for user ${userId}`);

      const result = await pool.query(
        `DELETE FROM location_history 
         WHERE id = $1 AND user_id = $2 
         RETURNING id`,
        [id, userId]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({
          error:
            "History item not found or you don't have permission to delete it",
        });
      }

      console.log(`✅ Deleted history item: ${id}`);

      res.json({ message: "Location deleted from history" });
    } catch (error) {
      console.error("❌ Delete history error:", error);
      next(error);
    }
  }

  async clearHistory(req, res, next) {
    try {
      const userId = req.user.userId;

      console.log(`🗑️  Clearing all history for user ${userId}`);

      const result = await pool.query(
        `DELETE FROM location_history WHERE user_id = $1 RETURNING id`,
        [userId]
      );

      console.log(
        `✅ Cleared ${result.rowCount} history items for user ${userId}`
      );

      res.json({
        message: "History cleared",
        deletedCount: result.rowCount,
      });
    } catch (error) {
      console.error("❌ Clear history error:", error);
      next(error);
    }
  }

  async checkServiceArea(req, res, next) {
    try {
      const { latitude, longitude } = req.body;

      if (!latitude || !longitude) {
        return res.status(400).json({
          error: "latitude and longitude are required",
        });
      }

      const lat = parseFloat(latitude);
      const lon = parseFloat(longitude);

      if (isNaN(lat) || isNaN(lon)) {
        return res.status(400).json({ error: "Invalid coordinates" });
      }

      console.log(`📍 Checking service area for: (${lat}, ${lon})`);

      // Check against defined service areas from database
      const serviceAreas = await pool.query(
        `SELECT name, center_lat, center_lon, radius_km 
         FROM service_areas 
         WHERE is_active = true`
      );

      if (serviceAreas.rows.length === 0) {
        // Fallback to default Ho Chi Minh City area
        const hcmCenter = { lat: 10.8231, lon: 106.6297 };
        const maxDistance = 50; // 50km radius

        const distance = geocodingService.calculateDistance(
          lat,
          lon,
          hcmCenter.lat,
          hcmCenter.lon
        );

        const inServiceArea = distance <= maxDistance;

        console.log(
          `✅ Distance from HCM center: ${distance.toFixed(2)}km - ${
            inServiceArea ? "IN" : "OUT OF"
          } service area`
        );

        return res.json({
          inServiceArea,
          distance: Math.round(distance * 100) / 100,
          message: inServiceArea
            ? "Location is within service area"
            : `Location is ${Math.round(distance)}km away from service area`,
        });
      }

      // Check all active service areas
      let closestArea = null;
      let minDistance = Infinity;

      for (const area of serviceAreas.rows) {
        const distance = geocodingService.calculateDistance(
          lat,
          lon,
          area.center_lat,
          area.center_lon
        );

        if (distance < minDistance) {
          minDistance = distance;
          closestArea = {
            name: area.name,
            distance: distance,
            inArea: distance <= area.radius_km,
          };
        }
      }

      console.log(
        `✅ Closest service area: ${closestArea.name} (${minDistance.toFixed(
          2
        )}km)`
      );

      res.json({
        inServiceArea: closestArea.inArea,
        distance: Math.round(minDistance * 100) / 100,
        serviceArea: closestArea.name,
        message: closestArea.inArea
          ? `Location is within ${closestArea.name} service area`
          : `Location is ${Math.round(minDistance)}km from ${closestArea.name}`,
      });
    } catch (error) {
      console.error("❌ Check service area error:", error);
      next(error);
    }
  }

  async calculateDistance(req, res, next) {
    try {
      const { lat1, lon1, lat2, lon2 } = req.body;

      if (!lat1 || !lon1 || !lat2 || !lon2) {
        return res.status(400).json({
          error: "lat1, lon1, lat2, and lon2 are required",
        });
      }

      const distance = geocodingService.calculateDistance(
        parseFloat(lat1),
        parseFloat(lon1),
        parseFloat(lat2),
        parseFloat(lon2)
      );

      console.log(`📏 Calculated distance: ${distance.toFixed(2)}km`);

      res.json({
        distance: Math.round(distance * 100) / 100,
        unit: "km",
      });
    } catch (error) {
      console.error("❌ Calculate distance error:", error);
      next(error);
    }
  }

  // ✅ NEW: Autocomplete endpoint for faster search
  async autocomplete(req, res, next) {
    try {
      const { q, limit = 5 } = req.query;

      if (!q || q.trim().length < 2) {
        return res.json([]);
      }

      const cacheKey = `autocomplete:${q}:${limit}`;
      const cached = await cacheService.get(cacheKey);

      if (cached) {
        return res.json(JSON.parse(cached));
      }

      // Only use autocomplete if LocationIQ is available
      if (geocodingService.autocomplete) {
        console.log(`🔍 Autocomplete: "${q}"`);
        const results = await geocodingService.autocomplete(q, limit);
        await cacheService.set(cacheKey, JSON.stringify(results), 1800); // 30 min cache
        return res.json(results);
      }

      // Fallback to regular search
      const results = await geocodingService.search(q, limit);
      await cacheService.set(cacheKey, JSON.stringify(results), 1800);
      res.json(results);
    } catch (error) {
      console.error("❌ Autocomplete error:", error);
      next(error);
    }
  }
}

module.exports = new LocationController();
