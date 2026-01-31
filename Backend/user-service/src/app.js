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

// Routes
const authRoutes = require("./routes/auth_routes");
const locationRoutes = require("./routes/location_routes");
const favoritesRoutes = require("./routes/favorites_routes"); // ✅ NEW

const errorHandler = require("./middleware/errorHandler");
const { runMigrations } = require("./utils/migrationRunner");
const UserGrpcServer = require("./grpc/user_grpc_server");

const app = express();

app.use(express.static(path.join(__dirname, "public")));
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
  console.warn("wiz-auth.yaml not found — Swagger UI disabled");
  swaggerDocument = { info: { title: "API Docs Unavailable" } };
}

// Routes
app.use("/auth", authRoutes);
app.use("/location", locationRoutes);
app.use("/favorites", favoritesRoutes); // ✅ NEW

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use("/", (req, res) => res.redirect("/api-docs"));

// Error handler
app.use(errorHandler);

// Initialize gRPC server
let grpcServer = null;

// START SERVER WITH MIGRATIONS AND GRPC
async function startServer() {
  try {
    console.log("🔄 Running database migrations...");
    await runMigrations();

    // ✅ Connect to RabbitMQ
    console.log("🔄 Connecting to RabbitMQ...");
    await connectRabbitMQ();

    // Start HTTP server
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
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
