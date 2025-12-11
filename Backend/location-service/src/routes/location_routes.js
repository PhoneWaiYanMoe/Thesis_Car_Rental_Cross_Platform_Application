const express = require("express");
const router = express.Router();
const locationController = require("../controllers/location_controller");
const { authenticate } = require("../middleware/auth");

// Public routes
router.get("/search", locationController.searchLocation);
router.get("/reverse", locationController.reverseGeocode);
router.get("/details/:placeId", locationController.getPlaceDetails);

// Protected routes (require authentication)
router.get("/history", authenticate, locationController.getSearchHistory);
router.post("/history", authenticate, locationController.saveToHistory);
router.delete("/history/:id", authenticate, locationController.deleteFromHistory);
router.delete("/history", authenticate, locationController.clearHistory);

// Service area check
router.post("/check-service-area", locationController.checkServiceArea);

// Distance calculation
router.post("/calculate-distance", locationController.calculateDistance);

module.exports = router;