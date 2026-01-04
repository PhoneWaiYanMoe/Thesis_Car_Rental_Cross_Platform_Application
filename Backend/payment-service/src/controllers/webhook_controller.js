const pool = require('../config/database');
const bookingGrpcClient = require('../grpc/booking_grpc_client');
const paymentService = require('../services/payment_service');

class WebhookController {
  async handleStripeWebhook(req, res, next) {
    try {
      const event = req.webhookEvent; // Set by verification middleware

      console.log(`📨 Stripe webhook: ${event.type}`);

      // Check for duplicate events
      const existingEvent = await pool.query(
        'SELECT event_id FROM webhook_events WHERE event_id = $1',
        [event.id]
      );

      if (existingEvent.rows.length > 0) {
        console.log(`⚠️  Duplicate Stripe event: ${event.id}`);
        return res.json({ received: true });
      }

      // Store event
      await pool.query(
        `INSERT INTO webhook_events (event_id, provider, type, payload, processed)
         VALUES ($1, $2, $3, $4, $5)`,
        [event.id, 'stripe', event.type, JSON.stringify(event.data), false]
      );

      // Handle different event types
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event.data.object);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;

        case 'charge.refunded':
          await this.handleRefundCompleted(event.data.object);
          break;
      }

      // Mark as processed
      await pool.query(
        'UPDATE webhook_events SET processed = true, processed_at = NOW() WHERE event_id = $1',
        [event.id]
      );

      res.json({ received: true });
    } catch (error) {
      console.error('❌ Stripe webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  async handlePaymentSuccess(paymentIntent) {
    try {
      const { id, metadata } = paymentIntent;
      const { bookingId, type } = metadata;

      // Update transaction status
      await pool.query(
        `UPDATE transactions
         SET status = 'succeeded',
             provider_transaction_id = $1,
             completed_at = NOW()
         WHERE booking_id = $2 AND type = $3`,
        [id, bookingId, type]
      );

      // Update booking payment status via gRPC
      await bookingGrpcClient.updateBookingPaymentStatus(
        bookingId,
        type,
        true,
        id
      );

      console.log(`✅ Payment success: ${bookingId} (${type})`);
    } catch (error) {
      console.error('❌ handlePaymentSuccess error:', error);
      throw error;
    }
  }

  async handlePaymentFailed(paymentIntent) {
    try {
      const { id, metadata } = paymentIntent;
      const { bookingId, type } = metadata;

      await pool.query(
        `UPDATE transactions
         SET status = 'failed',
             error_message = $1,
             updated_at = NOW()
         WHERE booking_id = $2 AND type = $3`,
        [paymentIntent.last_payment_error?.message, bookingId, type]
      );

      console.log(`❌ Payment failed: ${bookingId} (${type})`);
    } catch (error) {
      console.error('❌ handlePaymentFailed error:', error);
      throw error;
    }
  }

  async handleRefundCompleted(charge) {
    console.log(`✅ Refund completed: ${charge.id}`);
    // Update refund status in database
  }

  async handlePayPalWebhook(req, res, next) {
    // PayPal webhook implementation
    console.log('📨 PayPal webhook received');
    res.json({ received: true });
  }

  async handleVNPayReturn(req, res, next) {
    try {
      const result = req.webhookEvent; // Set by verification middleware

      if (!result.valid) {
        return res.redirect(`${process.env.FRONTEND_URL}/payment/failed`);
      }

      if (result.success) {
        // Update transaction
        await pool.query(
          `UPDATE transactions
           SET status = 'succeeded',
               provider_transaction_id = $1,
               completed_at = NOW()
           WHERE intent_id = $2`,
          [result.transactionNo, result.orderId]
        );

        console.log(`✅ VNPay payment success: ${result.orderId}`);
        res.redirect(`${process.env.FRONTEND_URL}/payment/success`);
      } else {
        res.redirect(`${process.env.FRONTEND_URL}/payment/failed`);
      }
    } catch (error) {
      console.error('❌ VNPay return error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/payment/failed`);
    }
  }
}

module.exports = new WebhookController();
