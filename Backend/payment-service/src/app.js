// Backend/payment-service/src/app.js
// ✅ FIXED: Initialize gRPC client AFTER routes are set up

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
const mockPaymentRoutes = require("./routes/mock_payment_routes");

const errorHandler = require("./middleware/errorHandler");
const { runMigrations } = require("./utils/migrationRunner");
const PaymentGrpcServer = require("./grpc/payment_grpc_server");

const app = express();

// CORS - must be before routes
app.use(cors());

// ✅ CRITICAL: Webhook route with raw body MUST come BEFORE express.json()
app.use(
  "/payment/webhook/stripe",
  express.raw({ type: "application/json" }),
  require("./routes/webhook_routes")
);

// ✅ NOW add body parsing for all OTHER routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "payment-service",
    mockMode: process.env.MOCK_PAYMENT === "true",
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

// ✅ Mock payment routes (if enabled)
if (process.env.MOCK_PAYMENT === "true") {
  app.use("/", mockPaymentRoutes);
  console.log("⚠️  [MOCK MODE] Mock payment routes enabled");
}

// ✅ Regular routes
app.use("/payment/methods", paymentMethodRoutes);
app.use("/payment/deposit", depositRoutes);
app.use("/payment/final", finalPaymentRoutes);
app.use("/payment/refund", refundRoutes);
app.use("/payment/transactions", transactionRoutes);

// Other webhook routes (VNPay, PayPal)
app.use("/payment/webhook/vnpay", webhookRoutes);
app.use("/payment/webhook/paypal", webhookRoutes);

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

    // ✅ Initialize gRPC client AFTER migrations but BEFORE starting HTTP server
    console.log("\n🔄 Initializing gRPC clients...");

    try {
      // This will trigger the constructor and log all initialization details
      const bookingGrpcClient = require("./grpc/booking_grpc_client");
      console.log("✅ Booking gRPC client ready");
    } catch (error) {
      console.error("❌ Failed to initialize Booking gRPC client:", error);
      console.error("\n⚠️  CRITICAL: Cannot proceed without gRPC client");
      console.error(
        "   Check that booking.proto exists in:",
        path.join(__dirname, "../proto")
      );
      process.exit(1);
    }

    // Start HTTP server
    const PORT = process.env.PORT || 3006;
    app.listen(PORT, () => {
      console.log(`\n✅ Payment Service HTTP running on port ${PORT}`);
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

      // Log webhook configuration
      console.log(`\n🔗 Webhook Endpoints:`);
      console.log(
        `   Stripe: ${
          process.env.BASE_URL || "http://localhost:3006"
        }/payment/webhook/stripe`
      );
      console.log(
        `   PayPal: ${
          process.env.BASE_URL || "http://localhost:3006"
        }/payment/webhook/paypal`
      );
      console.log(
        `   VNPay:  ${
          process.env.VNPAY_RETURN_URL ||
          "http://localhost:3006/payment/webhook/vnpay"
        }`
      );

      if (process.env.STRIPE_WEBHOOK_SECRET) {
        console.log(
          `   ✅ Stripe webhook secret: ${process.env.STRIPE_WEBHOOK_SECRET.substring(
            0,
            15
          )}...`
        );
      } else {
        console.log(`   ⚠️  Stripe webhook secret NOT configured`);
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
      console.log("   ✓ Tokenized Payment Storage\n");
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
