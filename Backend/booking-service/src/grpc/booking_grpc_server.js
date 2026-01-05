// Backend/booking-service/src/grpc/booking_grpc_server.js
// ✅ UPDATED: Added payment integration handlers

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

  // ==================== REVIEW-RELATED HANDLERS ====================

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
      const isEligibleForReview =
        booking.status === "completed" || booking.status === "return_submitted";
      const isCustomer = booking.customer_id === user_id;

      if (!isEligibleForReview) {
        return callback(null, {
          valid: false,
          message: `Cannot review booking with status: ${booking.status}`,
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

  // ==================== PAYMENT INTEGRATION HANDLERS ====================

  async getBookingDetails(call, callback) {
    try {
      const { booking_id } = call.request;

      const result = await pool.query(
        `SELECT 
          booking_id, 
          customer_id, 
          vehicle_id, 
          status,
          rental_price,
          insurance_fee,
          total_amount,
          deposit_amount,
          remaining_payment,
          deposit_paid,
          deposit_transaction_id,
          final_payment_paid,
          final_payment_transaction_id,
          start_date,
          end_date,
          duration_days
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
        rental_price: booking.rental_price,
        insurance_fee: booking.insurance_fee,
        total_amount: booking.total_amount,
        deposit_amount: booking.deposit_amount,
        remaining_payment: booking.remaining_payment,
        deposit_paid: booking.deposit_paid,
        final_payment_paid: booking.final_payment_paid,
        start_date: booking.start_date.toISOString(),
        end_date: booking.end_date.toISOString(),
        duration_days: booking.duration_days,
      });
    } catch (error) {
      console.error("❌ gRPC getBookingDetails error:", error);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message,
      });
    }
  }

  async updateBookingPaymentStatus(call, callback) {
    try {
      const { booking_id, payment_type, paid, transaction_id } = call.request;

      if (!["deposit", "final_payment"].includes(payment_type)) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: "payment_type must be 'deposit' or 'final_payment'",
        });
      }

      const field =
        payment_type === "deposit" ? "deposit_paid" : "final_payment_paid";
      const txField =
        payment_type === "deposit"
          ? "deposit_transaction_id"
          : "final_payment_transaction_id";

      await pool.query(
        `UPDATE bookings 
         SET ${field} = $1, ${txField} = $2, updated_at = NOW()
         WHERE booking_id = $3`,
        [paid, transaction_id, booking_id]
      );

      console.log(
        `✅ Updated booking ${booking_id} payment status: ${payment_type} = ${paid}`
      );

      callback(null, {
        success: true,
        message: `Payment status updated: ${payment_type}`,
      });
    } catch (error) {
      console.error("❌ gRPC updateBookingPaymentStatus error:", error);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message,
      });
    }
  }

  // ✅ NEW: Update booking after deposit payment
  async updateBookingAfterDepositPayment(call, callback) {
    try {
      const { booking_id, transaction_id } = call.request;

      // Update booking: deposit_paid = true, status = "pending"
      const result = await pool.query(
        `UPDATE bookings 
         SET deposit_paid = true,
             deposit_transaction_id = $1,
             status = 'pending',
             updated_at = NOW()
         WHERE booking_id = $2
         AND status = 'pending_payment'
         RETURNING booking_id, status`,
        [transaction_id, booking_id]
      );

      if (result.rows.length === 0) {
        return callback({
          code: grpc.status.FAILED_PRECONDITION,
          message: "Booking not found or not in pending_payment status",
        });
      }

      console.log(
        `✅ Booking ${booking_id} updated after deposit payment: status = pending`
      );

      callback(null, {
        success: true,
        message: "Booking updated after deposit payment",
        new_status: "pending",
      });
    } catch (error) {
      console.error("❌ gRPC updateBookingAfterDepositPayment error:", error);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message,
      });
    }
  }

  // ✅ NEW: Update booking after final payment
  async updateBookingAfterFinalPayment(call, callback) {
    try {
      const { booking_id, transaction_id } = call.request;

      // Update booking: final_payment_paid = true
      const result = await pool.query(
        `UPDATE bookings 
         SET final_payment_paid = true,
             final_payment_transaction_id = $1,
             updated_at = NOW()
         WHERE booking_id = $2
         AND status = 'booking'
         RETURNING booking_id, status`,
        [transaction_id, booking_id]
      );

      if (result.rows.length === 0) {
        return callback({
          code: grpc.status.FAILED_PRECONDITION,
          message: "Booking not found or not in booking status",
        });
      }

      console.log(
        `✅ Booking ${booking_id} updated after final payment: fully paid`
      );

      callback(null, {
        success: true,
        message: "Booking updated after final payment",
        new_status: "booking",
      });
    } catch (error) {
      console.error("❌ gRPC updateBookingAfterFinalPayment error:", error);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message,
      });
    }
  }

  start(port = 50052) {
    this.server.addService(bookingProto.BookingService.service, {
      VerifyBookingForReview: this.verifyBookingForReview.bind(this),
      MarkAsReviewed: this.markAsReviewed.bind(this),
      GetBookingDetails: this.getBookingDetails.bind(this),
      UpdateBookingPaymentStatus: this.updateBookingPaymentStatus.bind(this),
      UpdateBookingAfterDepositPayment:
        this.updateBookingAfterDepositPayment.bind(this),
      UpdateBookingAfterFinalPayment:
        this.updateBookingAfterFinalPayment.bind(this),
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
