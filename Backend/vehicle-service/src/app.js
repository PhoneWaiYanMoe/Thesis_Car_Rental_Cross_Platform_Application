// Backend/vehicle-service/src/app.js
const dotenv = require("dotenv");

const env = process.env.NODE_ENV || "local";

dotenv.config({
  path: `.env.${env}`,
});

const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const path = require("path");

const vehicleRoutes = require("./routes/vehicle_routes");
const errorHandler = require("./middleware/errorHandler");
const { runMigrations } = require("./utils/migrationRunner");
const VehicleGrpcServer = require("./grpc/vehicle_grpc_server");
const eventEmitter = require("./utils/eventEmitter");
const eventHandlers = require("./handlers/eventHandlers");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "vehicle-service",
    timestamp: new Date().toISOString(),
  });
});

// Load Swagger documentation
let swaggerDocument;
try {
  const yamlPath = path.join(__dirname, "../wiz-vehicle.yaml");
  swaggerDocument = YAML.load(yamlPath);
  swaggerDocument.servers = [
    { url: process.env.BASE_URL || "http://localhost:3002" },
  ];
} catch (error) {
  console.warn("⚠️ wiz-vehicle.yaml not found – Swagger UI disabled");
  swaggerDocument = { info: { title: "API Docs Unavailable" } };
}

// Routes
app.use("/vehicles", vehicleRoutes);

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
    console.log("📄 Running database migrations...");
    await runMigrations();

    // ✅ Connect to RabbitMQ event bus
    console.log("🔌 Connecting to event bus...");
    await eventEmitter.connect();

    // ✅ Subscribe to events from other services
    const eventsToSubscribe = [
      "request.vehicle_deactivation_approved",
      "request.vehicle_deactivation_denied",
      "request.vehicle_reactivation_approved",
      "request.vehicle_reactivation_denied",
      "request.vehicle_verification_approved",
      "request.vehicle_verification_denied",
      "request.vehicle_banned",
      "request.vehicle_unbanned",
      "booking.completed",
    ];

    await eventEmitter.subscribe(eventsToSubscribe, (event) => {
      eventHandlers.handleEvent(event);
    });

    // Start HTTP server
    const PORT = process.env.PORT || 3002;
    app.listen(PORT, () => {
      console.log(`✅ Vehicle Service HTTP running on port ${PORT}`);
      console.log(`📖 Swagger UI: http://localhost:${PORT}/api-docs`);
    });

    // Start gRPC server
    const GRPC_PORT = process.env.GRPC_PORT || 50055;
    grpcServer = new VehicleGrpcServer();
    grpcServer.start(GRPC_PORT);
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully...");

  if (grpcServer) {
    grpcServer.stop();
  }

  await eventEmitter.close();

  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down gracefully...");

  if (grpcServer) {
    grpcServer.stop();
  }

  await eventEmitter.close();

  process.exit(0);
});
