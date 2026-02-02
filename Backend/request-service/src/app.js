const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const swaggerUi = require("swagger-ui-express");

const env = process.env.NODE_ENV || "local";

dotenv.config({
  path: `.env.${env}`,
});

const pool = require("./config/database");
const rabbitmqConnection = require("./config/rabbitmq");
const eventConsumer = require("./services/event-consumer.service");
const Request = require("./models/Request");
const RequestAction = require("./models/RequestAction");
const RequestAttachment = require("./models/RequestAttachment");
const requestRoutes = require("./routes/request.routes");
const analyticsRoutes = require("./routes/analytics.routes");
const {
  errorHandler,
  notFoundHandler,
} = require("./middleware/error-handler.middleware");
const swaggerSpec = require("./config/swagger");

const app = express();

// middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger UI
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Request Service API Documentation",
  }),
);

// Swagger JSON endpoint
app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// routes
app.use("/requests", requestRoutes);
app.use("/analytics", analyticsRoutes);

// health check
app.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "Request Service",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// error handling
app.use(notFoundHandler);
app.use(errorHandler);

// initialize database and start server
const startServer = async () => {
  try {
    // create tables
    await Request.createTable();
    await RequestAction.createTable();
    await RequestAttachment.createTable();

    // connect to RabbitMQ
    await rabbitmqConnection.connect();

    // start event consumer
    await eventConsumer.startConsuming();

    const PORT = process.env.PORT || 3010;
    app.listen(PORT, () => {
      console.log(`✓ Request Service running on port ${PORT}`);
      console.log(`✓ API Base URL: http://localhost:${PORT}/requests`);
      console.log(`✓ API Documentation: http://localhost:${PORT}/api-docs`);
      console.log(`✓ Health Check: http://localhost:${PORT}/health`);
      console.log(`✓ Authentication: JWT Bearer token required`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received, closing connections...`);

  try {
    await pool.end();
    await rabbitmqConnection.close();
    console.log("✓ All connections closed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during shutdown:", error);
    process.exit(1);
  }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

startServer();

module.exports = app;
