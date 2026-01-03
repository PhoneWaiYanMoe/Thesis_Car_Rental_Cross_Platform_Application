// Backend/booking-service/src/grpc/booking_grpc_server.js
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");
const pool = require("../config/database");
const vehicleGrpcClient = require("./vehicle_grpc_client");

const PROTO_PATH = path.join(__dirname, "../../proto/booking.proto");
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const bookingProto = grpc.loadPackageDefinition(packageDefinition).booking;

class BookingGrpcServer {
  constructor() {
    this.server = new grpc.Server();
  }

  async verifyBookingForReview(call, callback) {
    try {
      const { booking_id, user_id } = call.request;

      const result = await pool.query(
        `SELECT booking_id, customer_id, vehicle_id, status 
         FROM bookings 
         WHERE booking_id = $1`,
        [booking_id]
      );

      if (result.rows.length === 0) {
        return callback(null, {
          valid: false,
          message: "Booking not found",
          is_completed: false,
          is_customer: false,
        });
      }

      const booking = result.rows[0];

      // ✅ UPDATED: Allow reviews for both 'completed' and 'return_submitted'
      const isEligibleForReview =
        booking.status === "completed" || booking.status === "return_submitted";

      const isCustomer = booking.customer_id === user_id;

      if (!isEligibleForReview) {
        return callback(null, {
          valid: false,
          message: `Cannot review booking with status: ${booking.status}. Must be 'completed' or 'return_submitted'.`,
          is_completed: false,
          is_customer: isCustomer,
        });
      }

      if (!isCustomer) {
        return callback(null, {
          valid: false,
          message: "Only the customer can review this booking",
          is_completed: isEligibleForReview,
          is_customer: false,
        });
      }

      callback(null, {
        valid: true,
        message: "Valid for review",
        is_completed: isEligibleForReview,
        is_customer: true,
      });
    } catch (error) {
      console.error("❌ gRPC verifyBookingForReview error:", error);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message,
      });
    }
  }

  async getBookingDetails(call, callback) {
    try {
      const { booking_id } = call.request;

      // Get booking from bookings table
      const result = await pool.query(
        `SELECT booking_id, customer_id, vehicle_id, status 
         FROM bookings 
         WHERE booking_id = $1`,
        [booking_id]
      );

      if (result.rows.length === 0) {
        return callback({
          code: grpc.status.NOT_FOUND,
          message: "Booking not found",
        });
      }

      const booking = result.rows[0];

      // Get vehicle owner ID via gRPC
      let ownerId = null;
      try {
        const vehicle = await vehicleGrpcClient.getVehicleInfo(
          booking.vehicle_id
        );
        ownerId = vehicle.owner_id;
      } catch (error) {
        console.error("⚠️  Could not fetch vehicle owner:", error.message);
        return callback({
          code: grpc.status.INTERNAL,
          message: "Could not fetch vehicle owner information",
        });
      }

      console.log(
        `✅ gRPC: Retrieved booking details for ${booking_id}, owner: ${ownerId}`
      );

      callback(null, {
        booking_id: booking.booking_id,
        customer_id: booking.customer_id,
        owner_id: ownerId,
        vehicle_id: booking.vehicle_id,
        status: booking.status,
      });
    } catch (error) {
      console.error("❌ gRPC getBookingDetails error:", error);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message,
      });
    }
  }

  async markAsReviewed(call, callback) {
    try {
      const { booking_id, review_type } = call.request;

      const field =
        review_type === "vehicle" ? "vehicle_reviewed" : "owner_reviewed";

      await pool.query(
        `UPDATE bookings SET ${field} = true WHERE booking_id = $1`,
        [booking_id]
      );

      console.log(
        `✅ Marked booking ${booking_id} as reviewed (${review_type})`
      );

      callback(null, {
        success: true,
        message: "Marked as reviewed",
      });
    } catch (error) {
      console.error("❌ gRPC markAsReviewed error:", error);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message,
      });
    }
  }

  start(port = 50052) {
    this.server.addService(bookingProto.BookingService.service, {
      VerifyBookingForReview: this.verifyBookingForReview.bind(this),
      GetBookingDetails: this.getBookingDetails.bind(this),
      MarkAsReviewed: this.markAsReviewed.bind(this),
    });

    this.server.bindAsync(
      `0.0.0.0:${port}`,
      grpc.ServerCredentials.createInsecure(),
      (err, port) => {
        if (err) {
          console.error("❌ Failed to start gRPC server:", err);
          return;
        }
        console.log(`✅ Booking gRPC server running on port ${port}`);
      }
    );
  }

  stop() {
    this.server.tryShutdown(() => {
      console.log("gRPC server stopped");
    });
  }
}

module.exports = BookingGrpcServer;
