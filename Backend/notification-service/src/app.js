const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const { connectDB } = require("./config/database");
const { connectRabbitMQ } = require("./config/rabbitmq");
const { initializeFirebase } = require("./config/firebase");
const notificationRoutes = require("./routes/notification.routes");
const eventConsumer = require("./consumers/event.consumer");
const notificationService = require("./services/notification.service");

const app = express();
const PORT = process.env.PORT || 3007;

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/notifications", notificationRoutes);

// Health check
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

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Initialize Firebase (optional - for push notifications)
    initializeFirebase();

    // Connect to RabbitMQ
    await connectRabbitMQ();

    // Start consuming events
    await eventConsumer.startConsuming();

    // Start retry mechanism for failed notifications (every 5 minutes)
    setInterval(() => {
      notificationService.retryFailedNotifications();
    }, 5 * 60 * 1000);

    app.listen(PORT, () => {
      console.log(`Notification Service running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
      console.log(`Base URL: http://localhost:${PORT}/notifications`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
