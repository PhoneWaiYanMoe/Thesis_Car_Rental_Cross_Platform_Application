// Backend/payment-service/src/grpc/booking_grpc_client.js
// ✅ FINAL FIX: Don't check client methods with Object.keys - they're not enumerable

const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");
const fs = require("fs");

const PROTO_PATH = path.join(__dirname, "../../proto/booking.proto");

class BookingGrpcClient {
  constructor() {
    console.log(`\n📡 Initializing Booking gRPC Client`);
    console.log(`   Proto path: ${PROTO_PATH}`);

    // ✅ Check if proto file exists
    if (!fs.existsSync(PROTO_PATH)) {
      console.error(`❌ Proto file not found: ${PROTO_PATH}`);
      throw new Error(`Proto file not found: ${PROTO_PATH}`);
    }

    console.log(`✅ Proto file exists`);

    // ✅ Load proto synchronously
    let packageDefinition;
    try {
      packageDefinition = protoLoader.loadSync(PROTO_PATH, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      });
      console.log(`✅ Proto file loaded successfully`);
    } catch (error) {
      console.error(`❌ Failed to load proto file:`, error);
      throw error;
    }

    // ✅ Load package definition
    const grpcPackage = grpc.loadPackageDefinition(packageDefinition);

    if (!grpcPackage.booking) {
      console.error(`❌ Package 'booking' not found in proto`);
      throw new Error("Package 'booking' not found in proto");
    }

    const bookingProto = grpcPackage.booking;

    if (!bookingProto.BookingService) {
      console.error(`❌ BookingService not found in booking package`);
      throw new Error("BookingService not found in proto");
    }

    console.log(`✅ BookingService loaded from proto`);

    // ✅ Log available service methods (from proto definition)
    if (bookingProto.BookingService.service) {
      const serviceMethods = Object.keys(bookingProto.BookingService.service);
      console.log(`📋 Available service methods: ${serviceMethods.join(", ")}`);

      // Store service definition for later verification
      this.serviceDefinition = bookingProto.BookingService.service;
    }

    // ✅ Create gRPC client
    const bookingServiceUrl =
      process.env.BOOKING_SERVICE_GRPC_URL || "localhost:50052";

    this.client = new bookingProto.BookingService(
      bookingServiceUrl,
      grpc.credentials.createInsecure(),
      {
        "grpc.keepalive_time_ms": 30000,
        "grpc.keepalive_timeout_ms": 5000,
        "grpc.keepalive_permit_without_calls": true,
      }
    );

    console.log(`✅ Booking gRPC client connected to ${bookingServiceUrl}`);

    // ✅ CRITICAL: gRPC client methods are NOT enumerable!
    // Object.keys() won't work. Instead, verify methods directly by checking if they exist
    const requiredMethods = [
      "GetBookingDetails",
      "UpdateBookingAfterDepositPayment",
      "UpdateBookingAfterFinalPayment",
    ];

    let allMethodsPresent = true;
    console.log(`\n🔍 Verifying required gRPC methods:`);

    requiredMethods.forEach((method) => {
      // Check if method exists on client (even if not enumerable)
      if (typeof this.client[method] === "function") {
        console.log(`   ✅ ${method} - available`);
      } else {
        console.log(`   ❌ ${method} - MISSING!`);
        allMethodsPresent = false;
      }
    });

    if (!allMethodsPresent) {
      console.error(`\n❌ Some required methods are missing!`);
      console.error(`   This will cause runtime errors`);
      throw new Error("Required gRPC methods are missing from client");
    }

    console.log(`\n✅ All required gRPC methods verified`);
    console.log(`✅ Booking gRPC client initialization complete\n`);
  }

  // ==================== METHODS ====================

  getBookingDetails(bookingId) {
    return new Promise((resolve, reject) => {
      if (!this.client) {
        return reject(new Error("gRPC client not initialized"));
      }

      if (typeof this.client.GetBookingDetails !== "function") {
        console.error(`❌ GetBookingDetails is not a function`);
        return reject(new Error("GetBookingDetails method not available"));
      }

      this.client.GetBookingDetails(
        { booking_id: bookingId },
        (error, response) => {
          if (error) {
            console.error("❌ gRPC getBookingDetails error:", error);
            reject(error);
          } else {
            console.log(`✅ Retrieved booking details: ${bookingId}`, {
              status: response.status,
              deposit_paid: response.deposit_paid,
            });
            resolve(response);
          }
        }
      );
    });
  }

  updateBookingAfterDepositPayment(bookingId, transactionId) {
    return new Promise((resolve, reject) => {
      console.log(`\n🔄 Calling UpdateBookingAfterDepositPayment via gRPC`);
      console.log(`   Booking ID: ${bookingId}`);
      console.log(`   Transaction ID: ${transactionId}`);

      if (!this.client) {
        const error = new Error("gRPC client not initialized");
        console.error(`❌ ${error.message}`);
        return reject(error);
      }

      if (typeof this.client.UpdateBookingAfterDepositPayment !== "function") {
        console.error(`❌ UpdateBookingAfterDepositPayment is not a function`);
        const error = new Error(
          "Method UpdateBookingAfterDepositPayment not available"
        );
        return reject(error);
      }

      this.client.UpdateBookingAfterDepositPayment(
        {
          booking_id: bookingId,
          transaction_id: transactionId,
        },
        (error, response) => {
          if (error) {
            console.error(
              "❌ gRPC updateBookingAfterDepositPayment error:",
              error
            );
            console.error("   Error code:", error.code);
            console.error("   Error details:", error.details);
            reject(error);
          } else {
            console.log(
              `✅ Booking ${bookingId} updated: status = ${response.new_status}`
            );
            resolve(response);
          }
        }
      );
    });
  }

  updateBookingAfterFinalPayment(bookingId, transactionId) {
    return new Promise((resolve, reject) => {
      console.log(`\n🔄 Calling UpdateBookingAfterFinalPayment via gRPC`);
      console.log(`   Booking ID: ${bookingId}`);
      console.log(`   Transaction ID: ${transactionId}`);

      if (!this.client) {
        return reject(new Error("gRPC client not initialized"));
      }

      if (typeof this.client.UpdateBookingAfterFinalPayment !== "function") {
        console.error(`❌ UpdateBookingAfterFinalPayment is not a function`);
        return reject(
          new Error("UpdateBookingAfterFinalPayment method not available")
        );
      }

      this.client.UpdateBookingAfterFinalPayment(
        {
          booking_id: bookingId,
          transaction_id: transactionId,
        },
        (error, response) => {
          if (error) {
            console.error(
              "❌ gRPC updateBookingAfterFinalPayment error:",
              error
            );
            reject(error);
          } else {
            console.log(
              `✅ Booking ${bookingId} fully paid: status = ${response.new_status}`
            );
            resolve(response);
          }
        }
      );
    });
  }
}

module.exports = new BookingGrpcClient();
