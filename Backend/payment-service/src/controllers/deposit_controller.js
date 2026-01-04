const paymentService = require('../services/payment_service');
const bookingGrpcClient = require('../grpc/booking_grpc_client');

class DepositController {
  async createDepositIntent(req, res, next) {
    try {
      const userId = req.user.userId;
      const { bookingId, provider, paymentMethodId, returnUrl } = req.body;

      // Get booking details from booking service
      const booking = await bookingGrpcClient.getBookingDetails(bookingId);

      if (booking.customer_id !== userId) {
        return res.status(403).json({ error: 'Not authorized for this booking' });
      }

      if (booking.status !== 'pending') {
        return res.status(400).json({
          error: `Cannot process deposit. Booking status: ${booking.status}`,
        });
      }

      // Create payment intent
      const result = await paymentService.createPaymentIntent(
        bookingId,
        userId,
        booking.deposit_amount,
        'deposit',
        provider,
        paymentMethodId
      );

      res.status(201).json({
        intentId: result.intentId || result.orderId,
        clientSecret: result.clientSecret,
        amount: booking.deposit_amount,
        currency: 'VND',
        status: result.status,
        provider: provider,
        paymentUrl: result.paymentUrl, // For VNPay
      });
    } catch (error) {
      console.error('Create deposit intent error:', error);
      next(error);
    }
  }

  async confirmDeposit(req, res, next) {
    try {
      const userId = req.user.userId;
      const { intentId } = req.params;

      // This is typically called by webhook, but can be manual
      // Implementation depends on provider-specific confirmation

      res.json({
        message: 'Deposit confirmation received',
        intentId,
      });
    } catch (error) {
      console.error('Confirm deposit error:', error);
      next(error);
    }
  }
}

module.exports = new DepositController();
