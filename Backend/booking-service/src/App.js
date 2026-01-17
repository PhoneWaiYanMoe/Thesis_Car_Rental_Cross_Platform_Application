require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const path = require("path");

const { connectRabbitMQ } = require("./config/rabbitmq");

const app = express();

/* ================================
   📹 SWAGGER SETUP
================================ */

let swaggerDocument;

try {
  const yamlPath = path.join(__dirname, "../wiz-booking.yaml");
  swaggerDocument = YAML.load(yamlPath);
  console.log("📘 Swagger YAML loaded successfully");
} catch (error) {
  console.warn("⚠️  wiz-booking.yaml not found – Swagger disabled");
  swaggerDocument = {
    openapi: "3.0.0",
    info: {
      title: "Booking Service API",
      description: "Swagger file not found",
      version: "1.0.0",
    },
  };
}

/* ================================
   📹 MIDDLEWARE
================================ */

app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ================================
   🔍 REQUEST LOGGER (DEBUG)
================================ */

app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`\n📥 [${timestamp}] ${req.method} ${req.url}`);
  console.log(`   Headers:`, {
    authorization: req.headers.authorization ? "Present ✅" : "Missing ❌",
    "content-type": req.headers["content-type"],
  });
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`   Body:`, JSON.stringify(req.body, null, 2));
  }
  next();
});

/* ================================
   📹 SWAGGER UI
================================ */

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    explorer: true,
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Wiz Booking Service API",
  }),
);

/* ================================
   📹 ROUTES
================================ */

const bookingRoutes = require("./routes/booking_routes");
app.use("/bookings", bookingRoutes);

try {
  const ownerBookingRoutes = require("./routes/owner_booking_routes");
  app.use("/bookings/owner", ownerBookingRoutes); // ✅ FIXED: Now matches Swagger
  console.log("✅ Owner booking routes registered at /bookings/owner");
} catch (error) {
  console.log("⚠️  Owner booking routes not found, skipping...");
}

/* ================================
   📹 HEALTH CHECK
================================ */

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    service: "booking-service",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

/* ================================
   📹 404 HANDLER
================================ */

app.use((req, res) => {
  console.log(`❌ 404 Not Found: ${req.method} ${req.url}`);
  res.status(404).json({
    success: false,
    message: "Route not found",
    requestedUrl: req.url,
    requestedMethod: req.method,
  });
});

/* ================================
   📹 ERROR HANDLER
================================ */

app.use((err, req, res, next) => {
  console.error("❌ Error:", err);
  console.error("   Stack:", err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

/* ================================
   📹 SERVER START
================================ */

const startServer = async () => {
  try {
    const PORT = process.env.PORT || 3004;
    const GRPC_PORT = process.env.GRPC_PORT || 50052;

    console.log("\n📄 Initializing Booking Service...");

    // RabbitMQ
    await connectRabbitMQ();
    console.log("✅ RabbitMQ connected");

    // gRPC Server
    const BookingGrpcServer = require("./grpc/booking_grpc_server");
    const grpcServer = new BookingGrpcServer();
    grpcServer.start(GRPC_PORT);

    // HTTP Server
    app.listen(PORT, () => {
      console.log("\n✅ Booking Service started");
      console.log(`📡 HTTP: http://localhost:${PORT}`);
      console.log(`📡 gRPC: localhost:${GRPC_PORT}`);
      console.log(`📚 Swagger: http://localhost:${PORT}/api-docs`);
      console.log(`🏥 Health: http://localhost:${PORT}/health`);
      console.log("\n📋 Available routes:");
      console.log("   - GET  /bookings/verification/me");
      console.log("   - POST /bookings/verification");
      console.log("   - POST /bookings");
      console.log("   - GET  /bookings/my-bookings");
      console.log("   - GET  /bookings/owner/bookings ⭐");
      console.log("   - POST /bookings/owner/:id/accept");
      console.log("   - POST /bookings/owner/:id/reject");
      console.log("   - POST /bookings/owner/:id/confirm-return\n");
    });
  } catch (error) {
    console.error("❌ Failed to start Booking Service:", error);
    process.exit(1);
  }
};

/* ================================
   📹 GRACEFUL SHUTDOWN
================================ */

process.on("SIGINT", () => {
  console.log("\n⚠️  Shutting down Booking Service...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n⚠️  Shutting down Booking Service...");
  process.exit(0);
});

startServer();

module.exports = app;
