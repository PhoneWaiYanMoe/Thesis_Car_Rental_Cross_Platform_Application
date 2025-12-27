const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./config/database");
const rabbitmqConnection = require("./config/rabbitmq");
const { Request, RequestAction } = require("./models/Request");
const requestRoutes = require("./routes/request.routes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.use("/", requestRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    service: "request-service",
    timestamp: new Date().toISOString(),
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Create tables
    await Request.createTable();
    await RequestAction.createTable();

    // Connect to RabbitMQ
    await rabbitmqConnection.connect();

    const PORT = process.env.PORT || 3010;
    app.listen(PORT, () => {
      console.log(`Request Service running on port ${PORT}`);
      console.log(`Base URL: http://localhost:${PORT}/`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, closing connections...");
  await pool.end();
  await rabbitmqConnection.close();
  process.exit(0);
});

startServer();

module.exports = app;