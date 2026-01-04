const paymentService = require('../services/payment_service');
const bookingGrpcClient = require('../grpc/booking_grpc_client');

class RefundController {
  async processRefund(req, res, next) {
    try {
      const userId = req.user.userId;
      const { bookingId, amount, reason, notes } = req.body;

      // Get booking details
      const booking = await bookingGrpcClient.getBookingDetails(bookingId);

      // Only customer, owner, or admin can request refund
      const userRole = req.user.role;
      const isAuthorized = 
        booking.customer_id === userId ||
        booking.owner_id === userId ||
        ['admin', 'customer-support'].includes(userRole);

      if (!isAuthorized) {
        return res.status(403).json({ error: 'Not authorized to process refund' });
      }

      // Process refund
      const result = await paymentService.processRefund(
        bookingId,
        userId,
        amount,
        reason,
        notes
      );

      res.status(201).json({
        refundId: result.refundId,
        amount: result.amount,
        status: result.status,
        estimatedArrival: result.estimatedArrival,
        message: 'Refund initiated. Funds will arrive in 5-10 business days.',
      });
    } catch (error) {
      console.error('Process refund error:', error);
      next(error);
    }
  }

  async getRefundStatus(req, res, next) {
    try {
      const userId = req.user.userId;
      const { refundId } = req.params;

      const result = await pool.query(
        `SELECT r.*, t.booking_id
         FROM refunds r
         JOIN transactions t ON r.transaction_id = t.transaction_id
         WHERE r.refund_id = $1`,
        [refundId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Refund not found' });
      }

      const refund = result.rows[0];

      res.json({
        refundId: refund.refund_id,
        bookingId: refund.booking_id,
        amount: refund.amount,
        status: refund.status,
        reason: refund.reason,
        initiatedAt: refund.initiated_at,
        completedAt: refund.completed_at,
        estimatedArrival: refund.estimated_arrival,
      });
    } catch (error) {
      console.error('Get refund status error:', error);
      next(error);
    }
  }
}

module.exports = new RefundController();
