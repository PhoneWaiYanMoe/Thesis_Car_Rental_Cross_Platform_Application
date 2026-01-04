const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const stripeService = require('./stripe_service');
const paypalService = require('./paypal_service');
const vnpayService = require('./vnpay_service');

class PaymentService {
  /**
   * Calculate insurance fee based on coverage percentage
   * Option A: Coverage % → Insurance premium %
   */
  calculateInsuranceFee(rentalPrice, coveragePercent) {
    const premiumRates = {
      0: 0,      // No insurance
      30: 0.05,  // 30% coverage → 5% premium
      50: 0.08,  // 50% coverage → 8% premium
      70: 0.12,  // 70% coverage → 12% premium
      100: 0.15, // 100% coverage (full) → 15% premium
    };

    const rate = premiumRates[coveragePercent] || 0;
    return Math.round(rentalPrice * rate);
  }

  /**
   * Calculate total booking cost with insurance
   */
  calculateBookingCost(dailyRate, days, insuranceCoverage) {
    const rentalPrice = dailyRate * days;
    const insuranceFee = this.calculateInsuranceFee(rentalPrice, insuranceCoverage);
    const total = rentalPrice + insuranceFee;
    const deposit = Math.round(total * 0.3); // 30% deposit
    const remainingPayment = total - deposit;

    return {
      rentalPrice,
      insuranceFee,
      insuranceCoverage,
      total,
      deposit,
      remainingPayment,
    };
  }

  /**
   * Calculate damage liability after insurance
   */
  calculateDamageLiability(damageAmount, insuranceCoverage) {
    const coverageRate = insuranceCoverage / 100;
    const insuranceCovers = Math.round(damageAmount * coverageRate);
    const customerPays = damageAmount - insuranceCovers;

    return {
      damageAmount,
      insuranceCovers,
      customerPays,
      coveragePercent: insuranceCoverage,
    };
  }

  /**
   * Create payment intent (deposit or final)
   */
  async createPaymentIntent(bookingId, userId, amount, type, provider, paymentMethodId = null) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      let providerResponse;
      const metadata = {
        bookingId,
        userId,
        type,
      };

      // Create intent based on provider
      switch (provider) {
        case 'stripe':
          providerResponse = await stripeService.createPaymentIntent(
            amount,
            'VND',
            metadata,
            paymentMethodId
          );
          break;

        case 'paypal':
          providerResponse = await paypalService.createOrder(
            amount,
            'VND',
            { ...metadata, description: `Wiz Booking ${type}` }
          );
          break;

        case 'vnpay':
          providerResponse = vnpayService.createPaymentUrl(
            amount,
            `Wiz Booking ${type} - ${bookingId}`,
            '127.0.0.1',
            process.env.VNPAY_RETURN_URL
          );
          break;

        default:
          throw new Error('Invalid payment provider');
      }

      // Save transaction record
      const transactionId = uuidv4();
      await client.query(
        `INSERT INTO transactions (
          transaction_id, booking_id, user_id, type, amount, currency,
          status, provider, intent_id, client_secret, payment_method_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          transactionId,
          bookingId,
          userId,
          type,
          amount,
          'VND',
          'pending',
          provider,
          providerResponse.intentId || providerResponse.orderId,
          providerResponse.clientSecret || null,
          paymentMethodId,
        ]
      );

      await client.query('COMMIT');

      console.log(`✅ Payment intent created: ${transactionId} (${provider})`);

      return {
        transactionId,
        ...providerResponse,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ createPaymentIntent error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Confirm payment (usually called by webhook)
   */
  async confirmPayment(transactionId, providerTransactionId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      await client.query(
        `UPDATE transactions 
         SET status = 'succeeded',
             provider_transaction_id = $1,
             completed_at = NOW(),
             updated_at = NOW()
         WHERE transaction_id = $2`,
        [providerTransactionId, transactionId]
      );

      await client.query('COMMIT');

      console.log(`✅ Payment confirmed: ${transactionId}`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ confirmPayment error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Process refund
   */
  async processRefund(bookingId, userId, amount, reason, notes = null) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get original transaction
      const transactionResult = await client.query(
        `SELECT * FROM transactions 
         WHERE booking_id = $1 
         AND type IN ('deposit', 'final_payment')
         AND status = 'succeeded'
         ORDER BY created_at DESC
         LIMIT 1`,
        [bookingId]
      );

      if (transactionResult.rows.length === 0) {
        throw new Error('No successful transaction found for refund');
      }

      const transaction = transactionResult.rows[0];

      // Create refund based on provider
      let providerRefund;
      switch (transaction.provider) {
        case 'stripe':
          providerRefund = await stripeService.createRefund(
            transaction.provider_transaction_id,
            amount
          );
          break;

        case 'paypal':
          providerRefund = await paypalService.createRefund(
            transaction.provider_transaction_id,
            amount,
            'VND'
          );
          break;

        case 'vnpay':
          // VNPay refund requires manual process or API call
          providerRefund = {
            refundId: `vnpay_refund_${Date.now()}`,
            status: 'processing',
          };
          break;

        default:
          throw new Error('Invalid payment provider');
      }

      // Save refund record
      const refundId = uuidv4();
      const estimatedArrival = new Date();
      estimatedArrival.setDate(estimatedArrival.getDate() + 7); // 7 days estimate

      await client.query(
        `INSERT INTO refunds (
          refund_id, transaction_id, booking_id, user_id, amount,
          reason, status, provider, provider_refund_id, notes,
          estimated_arrival
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          refundId,
          transaction.transaction_id,
          bookingId,
          userId,
          amount,
          reason,
          providerRefund.status,
          transaction.provider,
          providerRefund.refundId,
          notes,
          estimatedArrival,
        ]
      );

      await client.query('COMMIT');

      console.log(`✅ Refund processed: ${refundId} (${transaction.provider})`);

      return {
        refundId,
        amount,
        status: providerRefund.status,
        estimatedArrival: estimatedArrival.toISOString().split('T')[0],
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ processRefund error:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = new PaymentService();