const { paypalConfig } = require('../config/payment_providers');
const paypal = require('@paypal/checkout-server-sdk');

class PayPalService {
  /**
   * Create PayPal order
   */
  async createOrder(amount, currency, metadata) {
    try {
      const request = new paypal.orders.OrdersCreateRequest();
      request.prefer('return=representation');
      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: currency,
            value: (amount / 100).toFixed(2), // PayPal uses decimal
          },
          description: metadata.description || 'Wiz Car Rental Payment',
          custom_id: metadata.bookingId,
        }],
        application_context: {
          return_url: metadata.returnUrl,
          cancel_url: metadata.cancelUrl,
        },
      });

      const response = await paypalConfig.client.execute(request);
      const order = response.result;

      console.log(`✅ PayPal Order created: ${order.id}`);

      return {
        orderId: order.id,
        status: order.status,
        amount: amount,
        currency: currency,
        approvalUrl: order.links.find(link => link.rel === 'approve')?.href,
      };
    } catch (error) {
      console.error('❌ PayPal createOrder error:', error);
      throw new Error(`PayPal error: ${error.message}`);
    }
  }

  /**
   * Capture PayPal order
   */
  async captureOrder(orderId) {
    try {
      const request = new paypal.orders.OrdersCaptureRequest(orderId);
      request.requestBody({});

      const response = await paypalConfig.client.execute(request);
      const capture = response.result;

      console.log(`✅ PayPal Order captured: ${orderId}`);

      return {
        orderId: capture.id,
        status: capture.status,
        captureId: capture.purchase_units[0].payments.captures[0].id,
      };
    } catch (error) {
      console.error('❌ PayPal captureOrder error:', error);
      throw new Error(`PayPal error: ${error.message}`);
    }
  }

  /**
   * Create refund
   */
  async createRefund(captureId, amount, currency) {
    try {
      const request = new paypal.payments.CapturesRefundRequest(captureId);
      request.requestBody({
        amount: {
          value: (amount / 100).toFixed(2),
          currency_code: currency,
        },
      });

      const response = await paypalConfig.client.execute(request);
      const refund = response.result;

      console.log(`✅ PayPal Refund created: ${refund.id}`);

      return {
        refundId: refund.id,
        status: refund.status,
        amount: amount,
        currency: currency,
      };
    } catch (error) {
      console.error('❌ PayPal createRefund error:', error);
      throw new Error(`PayPal error: ${error.message}`);
    }
  }
}

module.exports = new PayPalService();