const JWTUtils = require("../utils/jwtUtils");
const { errorResponse } = require("../utils/responseFormatter");

// authentication middleware, which validates JWT token
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json(errorResponse("Access token required"));
    }

    const token = authHeader.substring(7);

    try {
      const decoded = JWTUtils.verifyToken(token);

      req.user = {
        userId: decoded.userId || decoded.id,
        role: decoded.userRole || decoded.role,
        email: decoded.email,
      };

      next();
    } catch (error) {
      return res.status(403).json(errorResponse(error.message));
    }
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(500).json(errorResponse("Authentication failed"));
  }
};

// role-based authorization middleware
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(errorResponse("Unauthorized"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res
        .status(403)
        .json(errorResponse("Forbidden - Insufficient permissions"));
    }

    next();
  };
};

module.exports = {
  authenticate,
  requireRole,
};
