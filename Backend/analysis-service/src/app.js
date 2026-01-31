const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { testConnection, syncDatabase } = require("./config/database");

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    service: "analytics-service",
    uptime: process.uptime(),
    timestamp: new Date(),
  });
});

// Basic route
app.get("/", (req, res) => {
  res.json({
    message: "Analytics Service API",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      analytics: "/api/analytics"
    }
  });
});

// Analytics routes (to be implemented)
app.get("/api/analytics", (req, res) => {
  res.json({
    message: "Analytics endpoints will be implemented here"
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    message: "Internal server error",
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const PORT = process.env.PORT || 3009;

const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ Failed to connect to database. Exiting...');
      process.exit(1);
    }

    // Sync database
    await syncDatabase();

    // Start listening
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Analytics Service running on http://0.0.0.0:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🗄️  Database: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
