// Backend/user-service/src/middleware/roleCheck.js
const jwt = require("jsonwebtoken");

/**
 * Middleware to require admin role
 */
exports.requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }

  next();
};

/**
 * Middleware to require support or admin role
 */
exports.requireSupport = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (!["admin", "support"].includes(req.user.role)) {
    return res.status(403).json({
      error: "Support or admin access required",
    });
  }

  next();
};

/**
 * Middleware to require owner role
 */
exports.requireOwner = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (req.user.role !== "owner") {
    return res.status(403).json({ error: "Owner access required" });
  }

  next();
};

/**
 * Middleware for optional authentication
 * Continues even if no token is provided
 */
exports.optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    // No token provided, continue without user
    return next();
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    // Invalid token, continue without user
    next();
  }
};
