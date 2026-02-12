const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const { connectDB } = require("./config/database");
const { connectRedis } = require("./config/redis");
const { connectRabbitMQ } = require("./config/rabbitmq");
const { initializeSocket } = require("./config/socket");
const socketAuthMiddleware = require("./middleware/socket.auth");
const setupChatSocket = require("./sockets/chat.socket");
const conversationRoutes = require("./routes/conversation.routes");
const messageRoutes = require("./routes/message.routes");
const eventConsumer = require("./consumers/event.consumer");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT;

// security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN.split(","),
    credentials: true,
  })
);

// rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);

// body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// REST API routes
app.use("/chat/conversations", conversationRoutes);
app.use("/chat", messageRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    service: "Chat Service",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

// start server
const startServer = async () => {
  try {
    await connectDB();

    await connectRedis();

    await connectRabbitMQ();

    // start event consumer
    await eventConsumer.startConsuming();

    // initialize Socket.IO
    const io = initializeSocket(server);

    // Socket.IO authentication middleware
    io.use(socketAuthMiddleware);

    // setup chat socket handlers
    setupChatSocket(io);

    server.listen(PORT, () => {
      console.log(`Chat Service running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
      console.log(`REST API: http://localhost:${PORT}/chat`);
      console.log(`WebSocket: ws://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
