class ReceiptGenerator {
  /**
   * Generate receipt data (for PDF or email)
   */
  generateReceipt(transaction, booking, user) {
    const receiptData = {
      receiptId: `RCP-${transaction.transaction_id.substring(0, 8).toUpperCase()}`,
      transactionId: transaction.transaction_id,
      date: new Date().toISOString(),
      
      // Customer info
      customer: {
        name: user.full_name,
        email: user.email,
        userId: user.user_id,
      },

      // Booking info
      booking: {
        bookingId: booking.booking_id,
        vehicleName: booking.vehicle_name,
        startDate: booking.start_date,
        endDate: booking.end_date,
        duration: booking.duration_days,
      },

      // Payment details
      payment: {
        type: transaction.type,
        amount: transaction.amount,
        currency: transaction.currency,
        provider: transaction.provider,
        status: transaction.status,
        paidAt: transaction.completed_at,
      },

      // Line items
      items: [
        {
          description: `Vehicle Rental (${booking.duration_days} days)`,
          amount: booking.rental_price,
        },
        {
          description: `Insurance (${booking.insurance_coverage}% coverage)`,
          amount: booking.insurance_fee,
        },
      ],

      // Totals
      subtotal: booking.rental_price,
      insuranceFee: booking.insurance_fee,
      total: booking.total_amount,
      paid: transaction.amount,
      
      // Receipt URL (would be actual PDF in production)
      receiptUrl: `https://cdn.wiz.com/receipts/${transaction.transaction_id}.pdf`,
    };

    return receiptData;
  }

  /**
   * Generate refund receipt
   */
  generateRefundReceipt(refund, originalTransaction) {
    return {
      receiptId: `REF-${refund.refund_id.substring(0, 8).toUpperCase()}`,
      refundId: refund.refund_id,
      date: new Date().toISOString(),
      originalTransactionId: originalTransaction.transaction_id,
      
      refund: {
        amount: refund.amount,
        reason: refund.reason,
        status: refund.status,
        estimatedArrival: refund.estimated_arrival,
      },
      
      receiptUrl: `https://cdn.wiz.com/refunds/${refund.refund_id}.pdf`,
    };
  }
}

module.exports = new ReceiptGenerator();