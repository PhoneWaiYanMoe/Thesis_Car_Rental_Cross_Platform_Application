// Backend/booking-service/src/app.js
// Updated to include event listener and admin routes

const dotenv = require("dotenv");

const env = process.env.NODE_ENV || "local";

dotenv.config({
  path: `.env.${env}`,
});

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const path = require("path");

const { connectRabbitMQ } = require("./config/rabbitmq");
const eventListener = require("./utils/eventListener"); // ✅ NEW

const app = express();

/* ================================
   📘 SWAGGER SETUP
================================ */

let swaggerDocument;

try {
  const yamlPath = path.join(__dirname, "../wiz-booking.yaml");
  swaggerDocument = YAML.load(yamlPath);
  console.log("📘 Swagger YAML loaded successfully");
} catch (error) {
  console.warn("⚠️  wiz-booking.yaml not found — Swagger disabled");
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
   📘 MIDDLEWARE
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
   📋 REQUEST LOGGER (DEBUG)
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
   📘 SWAGGER UI
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
   📘 ROUTES
================================ */

// Customer booking routes
const bookingRoutes = require("./routes/booking_routes");
app.use("/bookings", bookingRoutes);

// Owner booking routes
try {
  const ownerBookingRoutes = require("./routes/owner_booking_routes");
  app.use("/bookings/owner", ownerBookingRoutes);
  console.log("✅ Owner booking routes registered at /bookings/owner");
} catch (error) {
  console.log("⚠️  Owner booking routes not found, skipping...");
}

// Analytics routes
try {
  const analyticsRoutes = require("./routes/analytics_routes");
  app.use("/analytics", analyticsRoutes);
  console.log("✅ Analytics routes registered at /analytics");
} catch (error) {
  console.log("⚠️  Analytics routes not found, skipping...");
}

// ✅ NEW: Admin booking routes
try {
  const adminBookingRoutes = require("./routes/admin_booking_routes");
  app.use("/admin", adminBookingRoutes);
  console.log("✅ Admin booking routes registered at /admin");
} catch (error) {
  console.log("⚠️  Admin booking routes not found, skipping...");
}

/* ================================
   📘 HEALTH CHECK
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
   📘 404 HANDLER
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
   📘 ERROR HANDLER
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
   📘 SERVER START
================================ */

const startServer = async () => {
  try {
    const PORT = process.env.PORT || 3004;
    const GRPC_PORT = process.env.GRPC_PORT || 50052;

    console.log("\n🔄 Initializing Booking Service...");

    // Run database migrations
    const { runMigrations } = require("./utils/migrationRunner");
    await runMigrations();
    console.log("✅ Database migrations completed");

    // Connect to RabbitMQ
    await connectRabbitMQ();
    console.log("✅ RabbitMQ connected");

    // ✅ NEW: Start event listener
    await eventListener.startListening();
    console.log("✅ Event listener started");

    // Start gRPC Server
    const BookingGrpcServer = require("./grpc/booking_grpc_server");
    const grpcServer = new BookingGrpcServer();
    grpcServer.start(GRPC_PORT);

    // Start HTTP Server
    app.listen(PORT, () => {
      console.log("\n✅ Booking Service started");
      console.log(`📡 HTTP: http://localhost:${PORT}`);
      console.log(`📡 gRPC: localhost:${GRPC_PORT}`);
      console.log(`📚 Swagger: http://localhost:${PORT}/api-docs`);
      console.log(`🏥 Health: http://localhost:${PORT}/health`);
      console.log("\n📋 Available routes:");
      console.log("   Customer Routes:");
      console.log("   - GET  /bookings/verification/me");
      console.log("   - POST /bookings/verification");
      console.log("   - POST /bookings");
      console.log("   - GET  /bookings/my-bookings");
      console.log("   - POST /bookings/:id/sign-contract");
      console.log("   - POST /bookings/:id/pay-final");
      console.log("   - POST /bookings/:id/confirm-pickup");
      console.log("   - POST /bookings/:id/confirm-return");
      console.log("   - POST /bookings/:id/cancel");
      console.log("   - GET  /bookings/:id");
      console.log("\n   Owner Routes:");
      console.log("   - GET  /bookings/owner/bookings");
      console.log("   - POST /bookings/owner/:id/accept");
      console.log("   - POST /bookings/owner/:id/reject");
      console.log("   - POST /bookings/owner/:id/confirm-return");
      console.log("\n   Analytics Routes:");
      console.log("   - GET  /analytics/bookings/stats");
      console.log("   - GET  /analytics/bookings/owner/:ownerId/stats");
      console.log("   - GET  /analytics/bookings/vehicle/:vehicleId/stats");
      console.log("\n   ✨ Admin Routes (NEW):");
      console.log("   - GET  /admin/bookings (with pagination & filters)");
      console.log("   - GET  /admin/bookings/by-status");
      console.log("   - GET  /admin/bookings/search");
      console.log("   - GET  /admin/bookings/stats");
      console.log("   - GET  /admin/bookings/:id\n");
    });
  } catch (error) {
    console.error("❌ Failed to start Booking Service:", error);
    process.exit(1);
  }
};

/* ================================
   📘 GRACEFUL SHUTDOWN
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
