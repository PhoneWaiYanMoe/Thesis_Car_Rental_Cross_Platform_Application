const nominatimService = require("../services/nominatim_service");
const cacheService = require("../services/cache_service");
const pool = require("../config/database");

class LocationController {
  async searchLocation(req, res, next) {
    try {
      const { q, limit = 10 } = req.query;

      if (!q || q.trim().length === 0) {
        return res.status(400).json({ error: "Query parameter 'q' is required" });
      }

      const cacheKey = `search:${q}:${limit}`;
      const cached = await cacheService.get(cacheKey);
      
      if (cached) {
        console.log("✅ Cache hit for:", q);
        return res.json(JSON.parse(cached));
      }

      const results = await nominatimService.search(q, limit);

      await cacheService.set(cacheKey, JSON.stringify(results), 3600);

      res.json(results);
    } catch (error) {
      console.error("❌ Search error:", error);
      next(error);
    }
  }

  async reverseGeocode(req, res, next) {
    try {
      const { lat, lon } = req.query;

      if (!lat || !lon) {
        return res.status(400).json({ error: "Parameters 'lat' and 'lon' are required" });
      }

      const latitude = parseFloat(lat);
      const longitude = parseFloat(lon);

      if (isNaN(latitude) || isNaN(longitude)) {
        return res.status(400).json({ error: "Invalid coordinates" });
      }

      const cacheKey = `reverse:${latitude}:${longitude}`;
      const cached = await cacheService.get(cacheKey);
      
      if (cached) {
        console.log("✅ Cache hit for reverse geocode");
        return res.json(JSON.parse(cached));
      }

      const result = await nominatimService.reverse(latitude, longitude);

      await cacheService.set(cacheKey, JSON.stringify(result), 86400);

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
        return res.json(JSON.parse(cached));
      }

      const result = await nominatimService.getDetails(placeId);

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

      const result = await pool.query(
        `SELECT id, display_name, short_name, subtitle, latitude, longitude, created_at 
         FROM location_history 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2`,
        [userId, limit]
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
      const { displayName, shortName, subtitle, latitude, longitude } = req.body;

      if (!displayName || !latitude || !longitude) {
        return res.status(400).json({ 
          error: "displayName, latitude, and longitude are required" 
        });
      }

      const existing = await pool.query(
        `SELECT id FROM location_history 
         WHERE user_id = $1 AND latitude = $2 AND longitude = $3`,
        [userId, latitude, longitude]
      );

      if (existing.rows.length > 0) {
        await pool.query(
          `UPDATE location_history 
           SET created_at = NOW() 
           WHERE id = $1`,
          [existing.rows[0].id]
        );

        return res.json({ message: "History updated", id: existing.rows[0].id });
      }

      const result = await pool.query(
        `INSERT INTO location_history 
         (user_id, display_name, short_name, subtitle, latitude, longitude) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING id`,
        [userId, displayName, shortName, subtitle, latitude, longitude]
      );

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

      res.status(201).json({ 
        message: "Location saved to history", 
        id: result.rows[0].id 
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

      await pool.query(
        `DELETE FROM location_history WHERE id = $1 AND user_id = $2`,
        [id, userId]
      );

      res.json({ message: "Location deleted from history" });
    } catch (error) {
      console.error("❌ Delete history error:", error);
      next(error);
    }
  }

  async clearHistory(req, res, next) {
    try {
      const userId = req.user.userId;

      await pool.query(
        `DELETE FROM location_history WHERE user_id = $1`,
        [userId]
      );

      res.json({ message: "History cleared" });
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
          error: "latitude and longitude are required" 
        });
      }

      // TODO: Implement service area logic based on your business rules
      // For now, assume Ho Chi Minh City is the service area
      const hcmCenter = { lat: 10.8231, lon: 106.6297 };
      const maxDistance = 50; // 50km radius

      const distance = nominatimService.calculateDistance(
        latitude, 
        longitude, 
        hcmCenter.lat, 
        hcmCenter.lon
      );

      const inServiceArea = distance <= maxDistance;

      res.json({
        inServiceArea,
        distance: Math.round(distance * 100) / 100,
        message: inServiceArea 
          ? "Location is within service area" 
          : `Location is ${Math.round(distance)}km away from service area`
      });
    } catch (error) {
      console.error("❌ Check service area error:", error);
      next(error);
    }
  }

  // Calculate distance between two points
  async calculateDistance(req, res, next) {
    try {
      const { lat1, lon1, lat2, lon2 } = req.body;

      if (!lat1 || !lon1 || !lat2 || !lon2) {
        return res.status(400).json({ 
          error: "lat1, lon1, lat2, and lon2 are required" 
        });
      }

      const distance = nominatimService.calculateDistance(
        parseFloat(lat1),
        parseFloat(lon1),
        parseFloat(lat2),
        parseFloat(lon2)
      );

      res.json({
        distance: Math.round(distance * 100) / 100,
        unit: "km"
      });
    } catch (error) {
      console.error("❌ Calculate distance error:", error);
      next(error);
    }
  }
}

module.exports = new LocationController();