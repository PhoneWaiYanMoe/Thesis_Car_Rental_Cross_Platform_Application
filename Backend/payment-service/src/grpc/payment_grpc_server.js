// Backend/payment-service/src/grpc/payment_grpc_server.js
// ✅ UPDATED: Integrated webhook flow for automatic booking status updates

const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");
const pool = require("../config/database");
const paymentService = require("../services/payment_service");
const bookingGrpcClient = require("./booking_grpc_client");

const PROTO_PATH = path.join(__dirname, "../../proto/payment.proto");
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const paymentProto = grpc.loadPackageDefinition(packageDefinition).payment;

class PaymentGrpcServer {
  constructor() {
    this.server = new grpc.Server();
  }

  // ==================== PAYMENT INTENT CREATION ====================

  async createDepositIntent(call, callback) {
    try {
      const { booking_id, user_id, amount, provider, payment_method_id } =
        call.request;

      console.log(
        `📝 Creating deposit intent: ${booking_id}, ${amount} VND, ${provider}`
      );

      // Create payment intent
      const result = await paymentService.createPaymentIntent(
        booking_id,
        user_id,
        amount,
        "deposit",
        provider,
        payment_method_id || null
      );

      callback(null, {
        intent_id: result.intentId || result.orderId || "",
        client_secret: result.clientSecret || "",
        payment_url: result.paymentUrl || "",
        status: result.status || "pending",
        provider: provider,
        amount: amount,
        currency: "VND",
        message: "Deposit payment intent created successfully",
      });
    } catch (error) {
      console.error("❌ gRPC createDepositIntent error:", error);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message,
      });
    }
  }

  async createFinalPaymentIntent(call, callback) {
    try {
      const { booking_id, user_id, amount, provider, payment_method_id } =
        call.request;

      console.log(
        `📝 Creating final payment intent: ${booking_id}, ${amount} VND, ${provider}`
      );

      const result = await paymentService.createPaymentIntent(
        booking_id,
        user_id,
        amount,
        "final_payment",
        provider,
        payment_method_id || null
      );

      callback(null, {
        intent_id: result.intentId || result.orderId || "",
        client_secret: result.clientSecret || "",
        payment_url: result.paymentUrl || "",
        status: result.status || "pending",
        provider: provider,
        amount: amount,
        currency: "VND",
        message: "Final payment intent created successfully",
      });
    } catch (error) {
      console.error("❌ gRPC createFinalPaymentIntent error:", error);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message,
      });
    }
  }

  // ==================== PAYMENT STATUS & VERIFICATION ====================

  async verifyPaymentStatus(call, callback) {
    try {
      const { booking_id } = call.request;

      const result = await pool.query(
        `SELECT 
          SUM(CASE WHEN type = 'deposit' AND status = 'succeeded' THEN amount ELSE 0 END) as deposit_paid,
          SUM(CASE WHEN type = 'final_payment' AND status = 'succeeded' THEN amount ELSE 0 END) as final_paid,
          MAX(CASE WHEN type = 'deposit' THEN amount ELSE 0 END) as deposit_amount,
          MAX(CASE WHEN type = 'final_payment' THEN amount ELSE 0 END) as final_amount
         FROM transactions
         WHERE booking_id = $1`,
        [booking_id]
      );

      const row = result.rows[0];

      callback(null, {
        deposit_paid: row.deposit_paid > 0,
        final_payment_paid: row.final_paid > 0,
        deposit_amount: parseInt(row.deposit_amount) || 0,
        final_payment_amount: parseInt(row.final_amount) || 0,
        status:
          row.final_paid > 0
            ? "fully_paid"
            : row.deposit_paid > 0
            ? "deposit_paid"
            : "unpaid",
      });
    } catch (error) {
      console.error("❌ gRPC verifyPaymentStatus error:", error);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message,
      });
    }
  }

  async getTransactionDetails(call, callback) {
    try {
      const { transaction_id } = call.request;

      const result = await pool.query(
        "SELECT * FROM transactions WHERE transaction_id = $1",
        [transaction_id]
      );

      if (result.rows.length === 0) {
        return callback({
          code: grpc.status.NOT_FOUND,
          message: "Transaction not found",
        });
      }

      const tx = result.rows[0];

      callback(null, {
        transaction_id: tx.transaction_id,
        booking_id: tx.booking_id,
        user_id: tx.user_id,
        type: tx.type,
        amount: tx.amount,
        status: tx.status,
        provider: tx.provider,
      });
    } catch (error) {
      console.error("❌ gRPC getTransactionDetails error:", error);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message,
      });
    }
  }

  // ==================== REFUND PROCESSING ====================

  async processRefund(call, callback) {
    try {
      const { booking_id, user_id, amount, reason, notes } = call.request;

      const result = await paymentService.processRefund(
        booking_id,
        user_id,
        amount,
        reason,
        notes
      );

      callback(null, {
        success: true,
        refund_id: result.refundId,
        amount: result.amount,
        status: result.status,
        message: "Refund processed successfully",
      });
    } catch (error) {
      console.error("❌ gRPC processRefund error:", error);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message,
      });
    }
  }

  // ✅ NEW: Webhook handler to update booking after successful payment
  async handlePaymentSuccess(call, callback) {
    try {
      const { transaction_id, booking_id, payment_type } = call.request;

      console.log(
        `🎯 Handling payment success: ${booking_id}, type: ${payment_type}`
      );

      // Update booking status via Booking Service gRPC
      if (payment_type === "deposit") {
        await bookingGrpcClient.updateBookingAfterDepositPayment(
          booking_id,
          transaction_id
        );
        console.log(
          `✅ Booking ${booking_id} status updated to 'pending' after deposit payment`
        );
      } else if (payment_type === "final_payment") {
        await bookingGrpcClient.updateBookingAfterFinalPayment(
          booking_id,
          transaction_id
        );
        console.log(
          `✅ Booking ${booking_id} marked as fully paid after final payment`
        );
      }

      callback(null, {
        success: true,
        message: "Booking updated after payment success",
      });
    } catch (error) {
      console.error("❌ gRPC handlePaymentSuccess error:", error);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message,
      });
    }
  }

  start(port = 50056) {
    this.server.addService(paymentProto.PaymentService.service, {
      CreateDepositIntent: this.createDepositIntent.bind(this),
      CreateFinalPaymentIntent: this.createFinalPaymentIntent.bind(this),
      VerifyPaymentStatus: this.verifyPaymentStatus.bind(this),
      GetTransactionDetails: this.getTransactionDetails.bind(this),
      ProcessRefund: this.processRefund.bind(this),
      HandlePaymentSuccess: this.handlePaymentSuccess.bind(this),
    });

    this.server.bindAsync(
      `0.0.0.0:${port}`,
      grpc.ServerCredentials.createInsecure(),
      (err, port) => {
        if (err) {
          console.error("❌ Failed to start gRPC server:", err);
          return;
        }
        console.log(`✅ Payment gRPC server running on port ${port}`);
      }
    );
  }

  stop() {
    this.server.tryShutdown(() => {
      console.log("gRPC server stopped");
    });
  }
}

module.exports = PaymentGrpcServer;
