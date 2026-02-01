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

const database = require("./config/database");
const reviewRoutes = require("./routes/review_routes");
const errorHandler = require("./middleware/errorHandler");
const ReviewGrpcServer = require("./grpc/review_grpc_server");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/health", async (req, res) => {
  const dbHealthy = await database.healthCheck();
  res.json({
    status: dbHealthy ? "ok" : "degraded",
    service: "review-service",
    database: dbHealthy ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

// Load Swagger documentation
let swaggerDocument;
try {
  const yamlPath = path.join(__dirname, "../wiz-review.yaml");
  swaggerDocument = YAML.load(yamlPath);
  swaggerDocument.servers = [
    { url: process.env.BASE_URL || "http://localhost:3005" },
  ];
} catch (error) {
  console.warn("wiz-review.yaml not found — Swagger UI disabled");
  swaggerDocument = { info: { title: "API Docs Unavailable" } };
}

// Routes
app.use("/reviews", reviewRoutes);

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use("/", (req, res) => res.redirect("/api-docs"));

// Error handler
app.use(errorHandler);

// Initialize database and start servers
let grpcServer = null;

async function startServer() {
  try {
    // Connect to MongoDB with retry logic
    console.log("🔄 Connecting to MongoDB...");
    let retries = 5;
    while (retries > 0) {
      try {
        await database.connect();
        break;
      } catch (error) {
        retries--;
        if (retries === 0) {
          console.error("❌ Failed to connect to MongoDB after 5 attempts");
          throw error;
        }
        console.log(`⏳ Retrying MongoDB connection... (${5 - retries}/5)`);
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }

    // Start HTTP server
    const PORT = process.env.PORT || 3005;
    app.listen(PORT, () => {
      console.log(`✅ Review Service HTTP running on port ${PORT}`);
      console.log(`📖 Swagger UI: http://localhost:${PORT}/api-docs`);
    });

    // Start gRPC server
    const GRPC_PORT = process.env.GRPC_PORT || 50054;
    grpcServer = new ReviewGrpcServer();
    grpcServer.start(GRPC_PORT);
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
async function shutdown() {
  console.log("🛑 Shutting down gracefully...");

  if (grpcServer) {
    grpcServer.stop();
  }

  await database.disconnect();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
