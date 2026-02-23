const jwt = require("jsonwebtoken");

const socketAuthMiddleware = (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication token required"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    socket.userEmail = decoded.email;
    socket.userType = decoded.role;

    console.log(`Socket authenticated: User ${decoded.userId}`);
    next();
  } catch (error) {
    console.error("Socket authentication failed:", error.message);
    next(new Error("Authentication failed"));
  }
};

module.exports = socketAuthMiddleware;
