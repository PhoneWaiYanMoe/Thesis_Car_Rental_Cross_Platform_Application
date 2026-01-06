const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");

const PROTO_PATH = path.join(__dirname, "../../proto/booking.proto");
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const bookingProto = grpc.loadPackageDefinition(packageDefinition).booking;

class BookingGrpcClient {
  constructor() {
    const bookingServiceUrl =
      process.env.BOOKING_SERVICE_GRPC_URL || "localhost:50052";

    // Use DNS resolver for Docker networking
    const target = bookingServiceUrl.includes(':') 
      ? bookingServiceUrl 
      : `${bookingServiceUrl}:50052`;

    this.client = new bookingProto.BookingService(
      target,
      grpc.credentials.createInsecure(),
      {
        // Add retry and keepalive options for better connection handling
        'grpc.keepalive_time_ms': 30000,
        'grpc.keepalive_timeout_ms': 5000,
        'grpc.keepalive_permit_without_calls': true,
        'grpc.http2.max_pings_without_data': 0,
        'grpc.http2.min_time_between_pings_ms': 10000,
        'grpc.http2.min_ping_interval_without_data_ms': 300000,
      }
    );

    console.log(`📡 Booking gRPC client configured for ${target}`);
  }

  // ==================== EXISTING METHODS ====================

  getBookingDetails(bookingId) {
    return new Promise((resolve, reject) => {
      this.client.GetBookingDetails(
        { booking_id: bookingId },
        (error, response) => {
          if (error) {
            console.error("❌ gRPC getBookingDetails error:", error);
            reject(error);
          } else {
            console.log(`✅ Retrieved booking details: ${bookingId}`, {
              status: response.status,
              total: response.total_amount,
              deposit: response.deposit_amount,
              remaining: response.remaining_payment,
              deposit_paid: response.deposit_paid,
            });
            resolve(response);
          }
        }
      );
    });
  }

  updateBookingPaymentStatus(bookingId, paymentType, paid, transactionId) {
    return new Promise((resolve, reject) => {
      this.client.UpdateBookingPaymentStatus(
        {
          booking_id: bookingId,
          payment_type: paymentType,
          paid: paid,
          transaction_id: transactionId,
        },
        (error, response) => {
          if (error) {
            console.error("❌ gRPC updateBookingPaymentStatus error:", error);
            reject(error);
          } else {
            console.log(
              `✅ Updated booking payment: ${bookingId} - ${paymentType} = ${paid}`
            );
            resolve(response);
          }
        }
      );
    });
  }

  // ✅ NEW: Update booking after deposit payment (status: pending_payment → pending)
  updateBookingAfterDepositPayment(bookingId, transactionId) {
    return new Promise((resolve, reject) => {
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
            reject(error);
          } else {
            console.log(
              `✅ Booking ${bookingId} updated after deposit payment: status = ${response.new_status}`
            );
            resolve(response);
          }
        }
      );
    });
  }

  // ✅ NEW: Update booking after final payment (remains in 'booking' status, but fully paid)
  updateBookingAfterFinalPayment(bookingId, transactionId) {
    return new Promise((resolve, reject) => {
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
              `✅ Booking ${bookingId} updated after final payment: status = ${response.new_status}`
            );
            resolve(response);
          }
        }
      );
    });
  }
}

module.exports = new BookingGrpcClient();
