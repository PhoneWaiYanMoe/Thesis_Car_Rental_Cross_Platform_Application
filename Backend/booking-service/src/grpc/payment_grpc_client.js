// Backend/booking-service/src/grpc/payment_grpc_client.js
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");

const PROTO_PATH = path.join(__dirname, "../../proto/payment.proto");
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const paymentProto = grpc.loadPackageDefinition(packageDefinition).payment;

class PaymentGrpcClient {
  constructor() {
    const paymentServiceUrl =
      process.env.PAYMENT_SERVICE_GRPC_URL || "localhost:50056";

    this.client = new paymentProto.PaymentService.service(
      paymentServiceUrl,
      grpc.credentials.createInsecure()
    );

    console.log(`📡 Payment gRPC client connected to ${paymentServiceUrl}`);
  }

  /**
   * Create deposit payment intent
   */
  createDepositIntent(bookingId, userId, amount, provider, paymentMethodId) {
    return new Promise((resolve, reject) => {
      this.client.CreateDepositIntent(
        {
          booking_id: bookingId,
          user_id: userId,
          amount: amount,
          provider: provider,
          payment_method_id: paymentMethodId || "",
        },
        (error, response) => {
          if (error) {
            console.error("❌ gRPC createDepositIntent error:", error);
            reject(error);
          } else {
            console.log(`✅ Deposit intent created: ${response.intent_id}`);
            resolve(response);
          }
        }
      );
    });
  }

  /**
   * Create final payment intent
   */
  createFinalPaymentIntent(
    bookingId,
    userId,
    amount,
    provider,
    paymentMethodId
  ) {
    return new Promise((resolve, reject) => {
      this.client.CreateFinalPaymentIntent(
        {
          booking_id: bookingId,
          user_id: userId,
          amount: amount,
          provider: provider,
          payment_method_id: paymentMethodId || "",
        },
        (error, response) => {
          if (error) {
            console.error("❌ gRPC createFinalPaymentIntent error:", error);
            reject(error);
          } else {
            console.log(
              `✅ Final payment intent created: ${response.intent_id}`
            );
            resolve(response);
          }
        }
      );
    });
  }

  /**
   * Verify payment status
   */
  verifyPaymentStatus(bookingId) {
    return new Promise((resolve, reject) => {
      this.client.VerifyPaymentStatus(
        { booking_id: bookingId },
        (error, response) => {
          if (error) {
            console.error("❌ gRPC verifyPaymentStatus error:", error);
            reject(error);
          } else {
            resolve(response);
          }
        }
      );
    });
  }
}

module.exports = new PaymentGrpcClient();
