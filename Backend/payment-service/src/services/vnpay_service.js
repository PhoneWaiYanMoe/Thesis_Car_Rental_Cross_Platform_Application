const crypto = require("crypto");
const { vnpayConfig } = require("../config/payment_providers");
const querystring = require("querystring");

class VNPayService {
  /**
   * Create VNPay payment URL
   * Based on official VNPay documentation
   */
  createPaymentUrl(amount, orderInfo, ipAddr, returnUrl) {
    try {
      // VNPay expects date in UTC+7 (Vietnam timezone) format: yyyyMMddHHmmss
      const date = new Date();
      const createDate = this.formatDate(date);
      const orderId = date.getTime().toString();
      
      // Debug: Log hash secret (first 4 chars only for security)
      const hashSecretPreview = vnpayConfig.hashSecret 
        ? `${vnpayConfig.hashSecret.substring(0, 4)}...` 
        : 'NOT SET';
      console.log(`🔑 VNPay Hash Secret: ${hashSecretPreview}`);
      console.log(`🔑 VNPay TMN Code: ${vnpayConfig.tmnCode}`);

      // Create params object (exclude hash fields from signing)
      let vnpParams = {
        vnp_Version: "2.1.0",
        vnp_Command: "pay",
        vnp_TmnCode: vnpayConfig.tmnCode,
        vnp_Locale: "vn",
        vnp_CurrCode: "VND",
        vnp_TxnRef: orderId,
        vnp_OrderInfo: orderInfo,
        vnp_OrderType: "other",
        vnp_Amount: amount * 100,
        vnp_ReturnUrl: returnUrl || vnpayConfig.returnUrl,
        vnp_IpAddr: ipAddr,
        vnp_CreateDate: createDate,
      };

      // Sort params by key alphabetically
      vnpParams = this.sortObject(vnpParams);

      // Build sign data (raw values, not URL-encoded) per VNPay spec
      // Ensure keys are sorted alphabetically
      const sortedKeys = Object.keys(vnpParams).sort();
      const signData = sortedKeys
        .map((key) => `${key}=${vnpParams[key]}`)
        .join("&");

      // Create HMAC-SHA512 signature
      const hmac = crypto.createHmac("sha512", vnpayConfig.hashSecret);
      const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

      // Add signature fields AFTER signing (do not include in signData)
      vnpParams["vnp_SecureHashType"] = "SHA512";
      vnpParams["vnp_SecureHash"] = signed;

      // Build final URL with proper URL encoding
      // Sort again to ensure consistent order (including hash fields)
      const finalParams = this.sortObject(vnpParams);
      const urlParams = Object.keys(finalParams)
        .map((key) => {
          const value = String(finalParams[key]);
          return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
        })
        .join("&");
      const paymentUrl = `${vnpayConfig.url}?${urlParams}`;

      console.log(`✅ VNPay Payment URL created for order: ${orderId}`);
      console.log(`📝 Sign data (raw): ${signData}`);
      console.log(`🔐 Signature: ${signed}`);
      console.log(`📝 CreateDate: ${createDate}`);
      console.log(`🔗 Payment URL (first 100 chars): ${paymentUrl.substring(0, 100)}...`);

      return {
        orderId: orderId,
        paymentUrl: paymentUrl,
        amount: amount,
      };
    } catch (error) {
      console.error("❌ VNPay createPaymentUrl error:", error);
      throw new Error(`VNPay error: ${error.message}`);
    }
  }

  /**
   * Verify VNPay return signature
   */
  verifyReturnUrl(vnpParams) {
    try {
      const secureHash = vnpParams["vnp_SecureHash"];
      delete vnpParams["vnp_SecureHash"];
      delete vnpParams["vnp_SecureHashType"];

      // Sort params
      const sortedParams = this.sortObject(vnpParams);

      // Build signature string manually (same way as creation)
      const signDataParts = [];
      for (const key in sortedParams) {
        if (
          sortedParams.hasOwnProperty(key) &&
          sortedParams[key] !== null &&
          sortedParams[key] !== ""
        ) {
          signDataParts.push(`${key}=${sortedParams[key]}`);
        }
      }
      const signData = signDataParts.join("&");

      // Calculate signature
      const hmac = crypto.createHmac("sha512", vnpayConfig.hashSecret);
      const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

      console.log(`📝 Verify sign data (raw): ${signData}`);
      console.log(`🔐 Expected signature: ${signed}`);
      console.log(`🔐 Received signature: ${secureHash}`);

      if (secureHash === signed) {
        const responseCode = vnpParams["vnp_ResponseCode"];

        return {
          valid: true,
          success: responseCode === "00",
          orderId: vnpParams["vnp_TxnRef"],
          amount: parseInt(vnpParams["vnp_Amount"]) / 100,
          transactionNo: vnpParams["vnp_TransactionNo"],
          responseCode: responseCode,
        };
      }

      return { valid: false };
    } catch (error) {
      console.error("❌ VNPay verifyReturnUrl error:", error);
      return { valid: false };
    }
  }

  /**
   * Helper: Sort object keys alphabetically
   */
  sortObject(obj) {
    const sorted = {};
    const keys = Object.keys(obj).sort();
    keys.forEach((key) => {
      sorted[key] = obj[key];
    });
    return sorted;
  }

  /**
   * Helper: Format date for VNPay (yyyyMMddHHmmss)
   */
  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }
}

module.exports = new VNPayService();
