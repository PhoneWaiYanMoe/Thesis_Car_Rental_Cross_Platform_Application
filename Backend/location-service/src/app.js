require("dotenv").config();
const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const path = require("path");

const locationRoutes = require("./routes/location_routes");
const errorHandler = require("./middleware/errorHandler");
const LocationGrpcServer = require("./grpc/location_grpc_server");
const { runMigrations } = require("./utils/migrationRunner");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "location-service",
    timestamp: new Date().toISOString(),
  });
});

// Swagger documentation
let swaggerDocument;
try {
  const yamlPath = path.join(__dirname, "../wiz-location.yaml");
  swaggerDocument = YAML.load(yamlPath);
  swaggerDocument.servers = [
    { url: process.env.BASE_URL || "http://localhost:3003" },
  ];
} catch (error) {
  console.warn("wiz-location.yaml not found — Swagger UI disabled");
  swaggerDocument = { info: { title: "API Docs Unavailable" } };
}

// Routes
app.use("/location", locationRoutes);

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
    await runMigrations();

    // Start HTTP server
    const PORT = process.env.PORT || 3003;
    app.listen(PORT, () => {
      console.log(`Location Service HTTP running on port ${PORT}`);
      console.log(`Open: http://localhost:${PORT}/api-docs`);
    });

    // Start gRPC server
    const GRPC_PORT = process.env.GRPC_PORT || 50051;
    grpcServer = new LocationGrpcServer();
    grpcServer.start(GRPC_PORT);
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
