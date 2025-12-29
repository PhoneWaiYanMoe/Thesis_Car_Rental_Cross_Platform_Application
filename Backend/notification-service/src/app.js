const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const { connectRabbitMQ } = require("./config/rabbitmq");
const { initializeFirebase } = require("./config/firebase");
const eventConsumer = require("./consumers/event.consumer");

const app = express();
const PORT = process.env.PORT || 3007;

// security middleware
app.use(helmet());
app.use(cors());

// rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
});
app.use(limiter);

// body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    service: "Notification Service",
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
    // initialize Firebase (for push notifications)
    initializeFirebase();

    // connect to RabbitMQ
    await connectRabbitMQ();

    // start consuming events
    await eventConsumer.startConsuming();

    app.listen(PORT, () => {
      console.log(`Notification Service running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
