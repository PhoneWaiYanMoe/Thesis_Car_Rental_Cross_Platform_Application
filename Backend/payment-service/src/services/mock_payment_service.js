// Backend/payment-service/src/services/mock_payment_service.js
// ✅ MOCK PAYMENT SERVICE FOR TESTING
// This simulates successful payment flows without hitting real payment providers

class MockPaymentService {
  /**
   * Mock Stripe payment intent creation
   */
  async createStripePaymentIntent(amount, currency, metadata) {
    const intentId = `mock_stripe_${Date.now()}`;

    console.log(`✅ [MOCK] Stripe payment intent created: ${intentId}`);
    console.log(`   Amount: ${amount} ${currency}`);
    console.log(`   Booking: ${metadata.bookingId}`);

    return {
      intentId: intentId,
      clientSecret: `${intentId}_secret_mock`,
      status: "requires_payment_method",
      amount: amount,
      currency: currency,
    };
  }

  /**
   * Mock PayPal order creation
   */
  async createPayPalOrder(amount, currency, metadata) {
    const orderId = `mock_paypal_${Date.now()}`;

    console.log(`✅ [MOCK] PayPal order created: ${orderId}`);
    console.log(`   Amount: ${amount} ${currency}`);
    console.log(`   Booking: ${metadata.bookingId}`);

    return {
      orderId: orderId,
      status: "CREATED",
      amount: amount,
      currency: currency,
      approvalUrl: `http://localhost:3006/mock-payment?orderId=${orderId}&provider=paypal`,
    };
  }

  /**
   * Mock VNPay payment URL creation
   */
  createVNPayPaymentUrl(amount, orderInfo, ipAddr, returnUrl) {
    const orderId = Date.now().toString();

    console.log(`✅ [MOCK] VNPay payment URL created: ${orderId}`);
    console.log(`   Amount: ${amount} VND`);
    console.log(`   Order: ${orderInfo}`);
    console.log(`   IP: ${ipAddr}`);

    // Create a mock payment URL that redirects to our mock payment page
    const mockPaymentUrl = `http://localhost:3006/mock-payment?orderId=${orderId}&amount=${amount}&provider=vnpay&returnUrl=${encodeURIComponent(
      returnUrl
    )}`;

    return {
      orderId: orderId,
      paymentUrl: mockPaymentUrl,
      amount: amount,
    };
  }

  /**
   * Mock payment confirmation (simulates webhook)
   */
  async mockPaymentSuccess(orderId, provider, bookingId) {
    console.log(`✅ [MOCK] Simulating payment success for order: ${orderId}`);

    // Simulate delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      success: true,
      orderId: orderId,
      transactionNo: `mock_txn_${Date.now()}`,
      provider: provider,
      bookingId: bookingId,
    };
  }

  /**
   * Mock refund processing
   */
  async mockRefund(chargeId, amount, provider) {
    const refundId = `mock_refund_${Date.now()}`;

    console.log(`✅ [MOCK] Refund created: ${refundId}`);
    console.log(`   Amount: ${amount}`);
    console.log(`   Provider: ${provider}`);

    return {
      refundId: refundId,
      status: "succeeded",
      amount: amount,
      currency: "VND",
    };
  }
}

module.exports = new MockPaymentService();
