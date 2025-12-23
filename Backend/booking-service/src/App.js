// Backend/booking-service/src/App.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const path = require("path");

const bookingRoutes = require("./routes/booking_routes");
const ownerBookingRoutes = require("./routes/owner_booking_routes");
const errorHandler = require("./middleware/errorHandler");
const { runMigrations } = require("./utils/migrationRunner");
const BookingGrpcServer = require("./grpc/booking_grpc_server");
const { startNoShowChecker } = require("./utils/no_show_checker");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "booking-service",
    timestamp: new Date().toISOString(),
  });
});

// Load Swagger documentation
let swaggerDocument;
try {
  const yamlPath = path.join(__dirname, "../wiz-booking.yaml");
  swaggerDocument = YAML.load(yamlPath);
  swaggerDocument.servers = [
    { url: process.env.BASE_URL || "http://localhost:3004" },
  ];
} catch (error) {
  console.warn("wiz-booking.yaml not found — Swagger UI disabled");
  swaggerDocument = { info: { title: "API Docs Unavailable" } };
}

// Routes
app.use("/bookings", bookingRoutes);
app.use("/bookings/owner", ownerBookingRoutes);

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use("/", (req, res) => res.redirect("/api-docs"));

// Error handler
app.use(errorHandler);

// Initialize database and start servers
let grpcServer = null;

async function startServer() {
  try {
    // Run migrations first
    console.log("🔄 Running database migrations...");
    await runMigrations();

    // Start HTTP server
    const PORT = process.env.PORT || 3004;
    app.listen(PORT, () => {
      console.log(`✅ Booking Service HTTP running on port ${PORT}`);
      console.log(`📖 Swagger UI: http://localhost:${PORT}/api-docs`);
    });

    // Start gRPC server
    const GRPC_PORT = process.env.GRPC_PORT || 50052;
    grpcServer = new BookingGrpcServer();
    grpcServer.start(GRPC_PORT);

    // Start no-show checker (runs every hour)
    startNoShowChecker();
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully...");
  if (grpcServer) {
    grpcServer.stop();
  }
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully...");
  if (grpcServer) {
    grpcServer.stop();
  }
  process.exit(0);
});
