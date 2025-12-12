const express = require("express");
const router = express.Router();
const locationGrpcClient = require("../grpc/location_grpc_client");

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
    console.error("❌ Search error:", error);
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
    console.error("❌ Reverse geocode error:", error);
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
    console.error("❌ Get details error:", error);
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
    console.error("❌ Calculate distance error:", error);
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
    console.error("❌ Check service area error:", error);
    next(error);
  }
});

module.exports = router;
