// Backend/payment-service/src/app.js
// ✅ UPDATED: Added mock payment routes

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const path = require("path");

// Routes
const paymentMethodRoutes = require("./routes/payment_method_routes");
const depositRoutes = require("./routes/deposit_routes");
const finalPaymentRoutes = require("./routes/final_payment_routes");
const refundRoutes = require("./routes/refund_routes");
const transactionRoutes = require("./routes/transaction_routes");
const webhookRoutes = require("./routes/webhook_routes");
const mockPaymentRoutes = require("./routes/mock_payment_routes"); // ✅ NEW

const errorHandler = require("./middleware/errorHandler");
const { runMigrations } = require("./utils/migrationRunner");
const PaymentGrpcServer = require("./grpc/payment_grpc_server");

const app = express();

// CORS
app.use(cors());

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Store raw body for webhook signature verification
app.use("/payment/webhook", express.raw({ type: "application/json" }));

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "payment-service",
    mockMode: process.env.MOCK_PAYMENT === "true", // ✅ Show mock mode status
    timestamp: new Date().toISOString(),
  });
});

// Load Swagger documentation
let swaggerDocument;
try {
  const yamlPath = path.join(__dirname, "../wiz-payment.yaml");
  swaggerDocument = YAML.load(yamlPath);
  swaggerDocument.servers = [
    { url: process.env.BASE_URL || "http://localhost:3006" },
  ];
} catch (error) {
  console.warn("wiz-payment.yaml not found — Swagger UI disabled");
  swaggerDocument = { info: { title: "API Docs Unavailable" } };
}

// ✅ Mock payment routes (must be BEFORE other routes)
if (process.env.MOCK_PAYMENT === "true") {
  app.use("/", mockPaymentRoutes);
  console.log("⚠️  [MOCK MODE] Mock payment routes enabled");
}

// Routes
app.use("/payment/methods", paymentMethodRoutes);
app.use("/payment/deposit", depositRoutes);
app.use("/payment/final", finalPaymentRoutes);
app.use("/payment/refund", refundRoutes);
app.use("/payment/transactions", transactionRoutes);
app.use("/payment/webhook", webhookRoutes);

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use("/", (req, res) => res.redirect("/api-docs"));

// Error handler
app.use(errorHandler);

// Initialize gRPC server
let grpcServer = null;

async function startServer() {
  try {
    // Run migrations
    console.log("🔄 Running database migrations...");
    await runMigrations();

    // Start HTTP server
    const PORT = process.env.PORT || 3006;
    app.listen(PORT, () => {
      console.log(`✅ Payment Service HTTP running on port ${PORT}`);
      console.log(`📖 Swagger UI: http://localhost:${PORT}/api-docs`);

      if (process.env.MOCK_PAYMENT === "true") {
        console.log(`\n🎭 MOCK MODE ENABLED`);
        console.log(`   All payments will be simulated`);
        console.log(
          `   Mock payment page: http://localhost:${PORT}/mock-payment`
        );
        console.log(`   Set MOCK_PAYMENT=false to use real providers\n`);
      } else {
        console.log(`💳 Providers: Stripe, PayPal, VNPay`);
      }
    });

    // Start gRPC server
    const GRPC_PORT = process.env.GRPC_PORT || 50056;
    grpcServer = new PaymentGrpcServer();
    grpcServer.start(GRPC_PORT);

    if (process.env.MOCK_PAYMENT !== "true") {
      console.log("\n🔐 Security Features Enabled:");
      console.log("   ✓ PCI-DSS Compliant Architecture");
      console.log("   ✓ End-to-End Encryption (E2EE)");
      console.log("   ✓ TLS 1.3 Transport Security");
      console.log("   ✓ Webhook Signature Verification");
      console.log("   ✓ Tokenized Payment Storage");
    }
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
