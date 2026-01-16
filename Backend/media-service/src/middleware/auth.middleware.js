const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access token required",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ FIX: Log the decoded token to see what fields it contains
    console.log("🔐 Decoded JWT:", decoded);

    // ✅ FIX: Handle both 'id' and 'userId' fields (different services may use different field names)
    req.user = {
      id: decoded.id || decoded.userId || decoded.user_id,
      email: decoded.email,
      type: decoded.type || decoded.role || decoded.userType,
      ...decoded, // Keep all original fields
    };

    console.log(
      "👤 Authenticated user:",
      req.user.id,
      req.user.email,
      req.user.type
    );

    // ✅ SAFETY CHECK: Ensure user ID exists
    if (!req.user.id) {
      console.error("❌ No user ID found in JWT token!");
      console.error("❌ Token payload:", decoded);
      return res.status(403).json({
        success: false,
        message: "Invalid token: missing user ID",
      });
    }

    next();
  } catch (error) {
    console.error("❌ JWT verification error:", error.message);
    return res.status(403).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

module.exports = { authenticateToken };
