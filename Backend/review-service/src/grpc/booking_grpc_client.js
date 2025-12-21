const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");

// You'll need to copy booking.proto from booking-service
const PROTO_PATH = path.join(__dirname, "../../proto/booking.proto");

class BookingGrpcClient {
  constructor() {
    try {
      const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      });

      const bookingProto = grpc.loadPackageDefinition(packageDefinition).booking;

      const bookingServiceUrl =
        process.env.BOOKING_SERVICE_GRPC_URL || "localhost:50052";

      this.client = new bookingProto.BookingService(
        bookingServiceUrl,
        grpc.credentials.createInsecure()
      );

      console.log(`📡 Booking gRPC client connected to ${bookingServiceUrl}`);
    } catch (error) {
      console.error("❌ Failed to initialize Booking gRPC client:", error.message);
      this.client = null;
    }
  }

  // Verify booking exists and is completed
  async verifyBooking(bookingId, userId) {
    if (!this.client) {
      console.warn("⚠️  Booking gRPC client not available");
      return { valid: false, message: "Service unavailable" };
    }

    return new Promise((resolve, reject) => {
      this.client.VerifyBookingForReview(
        { booking_id: bookingId, user_id: userId },
        (error, response) => {
          if (error) {
            console.error("❌ gRPC verifyBooking error:", error);
            reject(error);
          } else {
            resolve(response);
          }
        }
      );
    });
  }

  // Get booking details
  async getBookingDetails(bookingId) {
    if (!this.client) {
      console.warn("⚠️  Booking gRPC client not available");
      return null;
    }

    return new Promise((resolve, reject) => {
      this.client.GetBookingDetails(
        { booking_id: bookingId },
        (error, response) => {
          if (error) {
            console.error("❌ gRPC getBookingDetails error:", error);
            reject(error);
          } else {
            resolve(response);
          }
        }
      );
    });
  }

  // Mark booking as reviewed
  async markBookingReviewed(bookingId, reviewType) {
    if (!this.client) {
      console.warn("⚠️  Booking gRPC client not available");
      return { success: false };
    }

    return new Promise((resolve, reject) => {
      this.client.MarkAsReviewed(
        { booking_id: bookingId, review_type: reviewType },
        (error, response) => {
          if (error) {
            console.error("❌ gRPC markBookingReviewed error:", error);
            reject(error);
          } else {
            resolve(response);
          }
        }
      );
    });
  }
}

module.exports = new BookingGrpcClient();