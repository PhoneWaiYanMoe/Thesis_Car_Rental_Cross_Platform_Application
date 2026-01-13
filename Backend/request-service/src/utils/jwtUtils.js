const jwt = require("jsonwebtoken");

class JWTUtils {
  // generate JWT token
  static generateToken(payload, expiresIn = "24h") {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
  }

  // verify and decode jwt token
  static verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        throw new Error("Token has expired");
      }
      if (error.name === "JsonWebTokenError") {
        throw new Error("Invalid token");
      }
      throw error;
    }
  }

  // decode token without verification (for debugging)
  static decodeToken(token) {
    return jwt.decode(token);
  }
}

module.exports = JWTUtils;
