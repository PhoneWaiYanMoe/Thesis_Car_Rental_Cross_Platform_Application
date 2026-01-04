const crypto = require('crypto');
const { vnpayConfig } = require('../config/payment_providers');
const querystring = require('querystring');

class VNPayService {
  /**
   * Create VNPay payment URL
   */
  createPaymentUrl(amount, orderInfo, ipAddr, returnUrl) {
    try {
      const date = new Date();
      const createDate = this.formatDate(date);
      const orderId = date.getTime().toString();

      let vnpParams = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: vnpayConfig.tmnCode,
        vnp_Locale: 'vn',
        vnp_CurrCode: 'VND',
        vnp_TxnRef: orderId,
        vnp_OrderInfo: orderInfo,
        vnp_OrderType: 'other',
        vnp_Amount: amount * 100, // VNPay requires amount * 100
        vnp_ReturnUrl: returnUrl || vnpayConfig.returnUrl,
        vnp_IpAddr: ipAddr,
        vnp_CreateDate: createDate,
      };

      // Sort params
      vnpParams = this.sortObject(vnpParams);

      // Create signature
      const signData = querystring.stringify(vnpParams, { encode: false });
      const hmac = crypto.createHmac('sha512', vnpayConfig.hashSecret);
      const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
      vnpParams['vnp_SecureHash'] = signed;

      // Create payment URL
      const paymentUrl = vnpayConfig.url + '?' + querystring.stringify(vnpParams, { encode: false });

      console.log(`✅ VNPay Payment URL created for order: ${orderId}`);

      return {
        orderId: orderId,
        paymentUrl: paymentUrl,
        amount: amount,
      };
    } catch (error) {
      console.error('❌ VNPay createPaymentUrl error:', error);
      throw new Error(`VNPay error: ${error.message}`);
    }
  }

  /**
   * Verify VNPay return signature
   */
  verifyReturnUrl(vnpParams) {
    try {
      const secureHash = vnpParams['vnp_SecureHash'];
      delete vnpParams['vnp_SecureHash'];
      delete vnpParams['vnp_SecureHashType'];

      const sortedParams = this.sortObject(vnpParams);
      const signData = querystring.stringify(sortedParams, { encode: false });
      const hmac = crypto.createHmac('sha512', vnpayConfig.hashSecret);
      const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

      if (secureHash === signed) {
        const responseCode = vnpParams['vnp_ResponseCode'];
        
        return {
          valid: true,
          success: responseCode === '00',
          orderId: vnpParams['vnp_TxnRef'],
          amount: parseInt(vnpParams['vnp_Amount']) / 100,
          transactionNo: vnpParams['vnp_TransactionNo'],
          responseCode: responseCode,
        };
      }

      return { valid: false };
    } catch (error) {
      console.error('❌ VNPay verifyReturnUrl error:', error);
      return { valid: false };
    }
  }

  /**
   * Query transaction status
   */
  async queryTransaction(orderId, transDate) {
    // VNPay query API implementation
    // Note: Requires additional configuration and API credentials
    try {
      // Implementation depends on VNPay's query API
      console.log(`Querying VNPay transaction: ${orderId}`);
      
      // Placeholder - implement based on VNPay documentation
      return {
        orderId: orderId,
        status: 'success',
      };
    } catch (error) {
      console.error('❌ VNPay queryTransaction error:', error);
      throw new Error(`VNPay error: ${error.message}`);
    }
  }

  /**
   * Helper: Sort object keys
   */
  sortObject(obj) {
    const sorted = {};
    const keys = Object.keys(obj).sort();
    keys.forEach(key => {
      sorted[key] = obj[key];
    });
    return sorted;
  }

  /**
   * Helper: Format date for VNPay (yyyyMMddHHmmss)
   */
  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }
}

module.exports = new VNPayService();
