// Backend/user-service/src/routes/location_routes.js
const express = require("express");
const router = express.Router();
const locationGrpcClient = require("../grpc/location_grpc_client");
const pool = require("../config/database");
const jwt = require("jsonwebtoken");

// ==================== PUBLIC ROUTES ====================

// Search for locations
router.get("/search", async (req, res, next) => {
  try {
    const { q, limit } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: "Query parameter 'q' is required" });
    }

    const results = await locationGrpcClient.searchLocation(
      q,
      parseInt(limit) || 10
    );
    res.json(results);
  } catch (error) {
    console.error("Search error:", error);
    next(error);
  }
});

// Reverse geocoding
router.get("/reverse", async (req, res, next) => {
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

    const result = await locationGrpcClient.reverseGeocode(latitude, longitude);
    res.json(result);
  } catch (error) {
    console.error("Reverse geocode error:", error);
    next(error);
  }
});

// Get place details
router.get("/details/:placeId", async (req, res, next) => {
  try {
    const { placeId } = req.params;

    if (!placeId) {
      return res.status(400).json({ error: "Place ID is required" });
    }

    const result = await locationGrpcClient.getPlaceDetails(placeId);
    res.json(result);
  } catch (error) {
    console.error("Get details error:", error);
    next(error);
  }
});

// Calculate distance
router.post("/calculate-distance", async (req, res, next) => {
  try {
    const { lat1, lon1, lat2, lon2 } = req.body;

    if (!lat1 || !lon1 || !lat2 || !lon2) {
      return res.status(400).json({
        error: "lat1, lon1, lat2, and lon2 are required",
      });
    }

    const result = await locationGrpcClient.calculateDistance(
      parseFloat(lat1),
      parseFloat(lon1),
      parseFloat(lat2),
      parseFloat(lon2)
    );
    res.json(result);
  } catch (error) {
    console.error("Calculate distance error:", error);
    next(error);
  }
});

// Check service area
router.post("/check-service-area", async (req, res, next) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        error: "latitude and longitude are required",
      });
    }

    const result = await locationGrpcClient.checkServiceArea(
      parseFloat(latitude),
      parseFloat(longitude)
    );
    res.json(result);
  } catch (error) {
    console.error("Check service area error:", error);
    next(error);
  }
});

// ==================== HISTORY ROUTES (WITH OPTIONAL AUTH) ====================

// Helper function to get user from token (optional)
const getOptionalUser = (req) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
};

// Get search history (optional auth)
router.get("/history", async (req, res, next) => {
  try {
    const user = getOptionalUser(req);

    if (!user) {
      return res.json([]);
    }

    const { limit = 10 } = req.query;

    const items = await locationGrpcClient.getSearchHistory(
      user.userId,
      parseInt(limit)
    );

    console.log(
      `📚 Loaded ${items.length} history items via gRPC for user ${user.userId}`
    );
    res.json(items);
  } catch (error) {
    console.error("Get history error:", error);
    res.json([]);
  }
});

// Save to history (optional auth)
router.post("/history", async (req, res, next) => {
  try {
    const user = getOptionalUser(req);

    if (!user) {
      console.log("History save attempted without auth");
      return res.status(200).json({
        message: "History not saved (authentication required)",
        saved: false,
      });
    }

    const { displayName, shortName, subtitle, latitude, longitude } = req.body;

    console.log("History save request:", {
      displayName,
      shortName,
      subtitle,
      latitude,
      longitude,
      latitudeType: typeof latitude,
      longitudeType: typeof longitude,
    });

    if (!displayName || displayName.trim() === "" || latitude === undefined || latitude === null || longitude === undefined || longitude === null) {
      console.log("Validation failed:", {
        hasDisplayName: !!displayName,
        displayNameEmpty: displayName?.trim() === "",
        hasLatitude: latitude !== undefined && latitude !== null,
        hasLongitude: longitude !== undefined && longitude !== null,
      });
      return res.status(400).json({
        error: "displayName, latitude, and longitude are required",
      });
    }

    const response = await locationGrpcClient.saveToHistory(
      user.userId,
      displayName,
      shortName || "",
      subtitle || "",
      latitude,
      longitude
    );

    console.log(
      `Saved location to history via gRPC for user ${user.userId}`
    );
    res.status(201).json({
      message: response.message,
      id: response.id,
      saved: response.success,
    });
  } catch (error) {
    console.error("Save history error:", error);
    res.status(200).json({
      message: "History not saved (error occurred)",
      saved: false,
    });
  }
});

// Delete from history (requires auth)
router.delete("/history/:id", async (req, res, next) => {
  try {
    const user = getOptionalUser(req);

    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { id } = req.params;

    await locationGrpcClient.deleteFromHistory(user.userId, parseInt(id));

    res.json({ message: "Location deleted from history" });
  } catch (error) {
    console.error("Delete history error:", error);
    next(error);
  }
});

// Clear all history (requires auth)
router.delete("/history", async (req, res, next) => {
  try {
    const user = getOptionalUser(req);

    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    await locationGrpcClient.clearHistory(user.userId);

    res.json({ message: "History cleared" });
  } catch (error) {
    console.error("Clear history error:", error);
    next(error);
  }
});

module.exports = router;
