const paymentService = require("../services/payment_service");
const bookingGrpcClient = require("../grpc/booking_grpc_client");

class FinalPaymentController {
  async createFinalPaymentIntent(req, res, next) {
    try {
      const userId = req.user.userId;
      const { bookingId, provider, paymentMethodId, returnUrl } = req.body;

      // Get booking details
      const booking = await bookingGrpcClient.getBookingDetails(bookingId);

      if (booking.customer_id !== userId) {
        return res
          .status(403)
          .json({ error: "Not authorized for this booking" });
      }

      if (booking.status !== "booking") {
        return res.status(400).json({
          error: `Cannot process final payment. Booking status: ${booking.status}`,
        });
      }

      // Check if deposit is paid
      // This should be verified via gRPC call to payment service itself
      // For now, we'll trust the booking service

      // Create payment intent
      const result = await paymentService.createPaymentIntent(
        bookingId,
        userId,
        booking.remaining_payment,
        "final_payment",
        provider,
        paymentMethodId,
        { ownerId: booking.owner_id, vehicleId: booking.vehicle_id },
      );

      res.status(201).json({
        intentId: result.intentId || result.orderId,
        clientSecret: result.clientSecret,
        amount: booking.remaining_payment,
        currency: "VND",
        status: result.status,
        provider: provider,
        paymentUrl: result.paymentUrl, // For VNPay
      });
    } catch (error) {
      console.error("Create final payment intent error:", error);
      next(error);
    }
  }

  async confirmFinalPayment(req, res, next) {
    try {
      const { intentId } = req.params;

      res.json({
        message: "Final payment confirmation received",
        intentId,
      });
    } catch (error) {
      console.error("Confirm final payment error:", error);
      next(error);
    }
  }
}

module.exports = new FinalPaymentController();
