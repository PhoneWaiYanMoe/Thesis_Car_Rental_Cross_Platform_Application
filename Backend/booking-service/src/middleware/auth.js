// Backend/booking-service/src/middleware/auth.js
const jwt = require("jsonwebtoken");

exports.authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};


/**
 * Require admin role
 */
exports.requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: "Authentication required",
    });
  }

  if (req.user.role !== "admin" && req.user.role !== "support") {
    return res.status(403).json({
      success: false,
      error: "Admin or support access required",
    });
  }

  next();
};

/**
 * Require owner role (or admin)
 */
exports.requireOwner = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: "Authentication required",
    });
  }

  if (req.user.role !== "owner" && req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      error: "Owner access required",
    });
  }

  next();
};
