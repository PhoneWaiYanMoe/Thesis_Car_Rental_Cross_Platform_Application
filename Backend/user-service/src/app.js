// Backend/user-service/src/app.js
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
const passport = require("./config/passport");
const { connectRabbitMQ } = require("./config/rabbitmq");
const eventConsumer = require("./services/event_consumer");
// const seedAdmin = require("./seed/admin_seed");     // ← commented out or remove if not needed at startup

// Routes
const authRoutes = require("./routes/auth_routes");
const userRoutes = require("./routes/user_routes");
const locationRoutes = require("./routes/location_routes");
const favoritesRoutes = require("./routes/favorites_routes");
const deviceRoutes = require("./routes/device_routes");
const paymentRoutes = require("./routes/payment_routes");
const analyticsRoutes = require("./routes/analytics_routes");
const publicDeviceRoutes = require("./routes/public_device_routes");

const errorHandler = require("./middleware/errorHandler");
const UserGrpcServer = require("./grpc/user_grpc_server");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "user-service",
    timestamp: new Date().toISOString(),
  });
});

let swaggerDocument;
try {
  const yamlPath = path.join(__dirname, "../wiz-auth.yaml");
  swaggerDocument = YAML.load(yamlPath);
  swaggerDocument.servers = [
    { url: process.env.BASE_URL || "http://localhost:3001" },
  ];
} catch (error) {
  console.warn("wiz-auth.yaml not found – Swagger UI disabled");
  swaggerDocument = {
    openapi: "3.0.0",
    info: {
      title: "User Service API",
      version: "1.0.0",
      description:
        "User management, authentication, devices, and payment methods",
    },
  };
}

// Routes
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/api/users", publicDeviceRoutes); // For notification service
app.use("/location", locationRoutes);
app.use("/favorites", favoritesRoutes);
app.use("/devices", deviceRoutes);
app.use("/payments", paymentRoutes);
app.use("/analytics", analyticsRoutes);

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Error handler
app.use(errorHandler);

// Initialize gRPC server
let grpcServer = null;

// START SERVER (NO MIGRATIONS HERE ANYMORE)
async function startServer() {
  try {
    // ────────────────────────────────────────────────
    // Migrations & seeding are now run MANUALLY / in CI/CD
    // ────────────────────────────────────────────────
    // console.log("📄 Running database migrations...");
    // await runMigrations();

    // console.log("📄 Seeding admin user...");
    // await seedAdmin();

    // Connect to RabbitMQ
    console.log("📄 Connecting to RabbitMQ...");
    await connectRabbitMQ();

    // Start event consumer
    console.log("📄 Starting event consumer...");
    await eventConsumer.startConsuming();

    // Start HTTP server
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ User Service HTTP running on port ${PORT}`);
      console.log(`📖 Swagger UI: http://localhost:${PORT}/api-docs`);
    });

    // Start gRPC server
    const GRPC_PORT = process.env.GRPC_PORT || 50053;
    grpcServer = new UserGrpcServer();
    grpcServer.start(GRPC_PORT);
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

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