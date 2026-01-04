const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const PROTO_PATH = path.join(__dirname, '../../proto/booking.proto');
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
    const bookingServiceUrl = process.env.BOOKING_SERVICE_GRPC_URL || 'localhost:50052';

    this.client = new bookingProto.BookingService(
      bookingServiceUrl,
      grpc.credentials.createInsecure()
    );

    console.log(`📡 Booking gRPC client connected to ${bookingServiceUrl}`);
  }

  getBookingDetails(bookingId) {
    return new Promise((resolve, reject) => {
      this.client.GetBookingDetails(
        { booking_id: bookingId },
        (error, response) => {
          if (error) {
            console.error('❌ gRPC getBookingDetails error:', error);
            reject(error);
          } else {
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
            console.error('❌ gRPC updateBookingPaymentStatus error:', error);
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