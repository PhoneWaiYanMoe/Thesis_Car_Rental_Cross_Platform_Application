// Backend/user-service/src/routes/favorites_routes.js
const express = require("express");
const router = express.Router();
const favoritesController = require("../controllers/favorites_controller");
const { authenticate } = require("../middleware/auth");

// All favorites routes require authentication
router.use(authenticate);

// Get user's favorites
router.get("/", favoritesController.getFavorites);

// Add vehicle to favorites
router.post("/", favoritesController.addFavorite);

// Remove vehicle from favorites
router.delete("/:vehicleId", favoritesController.removeFavorite);

// Check if vehicle is favorited
router.get("/check/:vehicleId", favoritesController.checkFavorite);

// Get favorite count
router.get("/count", favoritesController.getFavoriteCount);

module.exports = router;
