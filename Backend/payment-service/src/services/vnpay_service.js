const crypto = require("crypto");
const { vnpayConfig } = require("../config/payment_providers");

class VNPayService {
  /**
   * Create VNPay payment URL
   * ✅ FIXED: Proper IP handling and parameter encoding
   */
  createPaymentUrl(amount, orderInfo, ipAddr, returnUrl) {
    try {
      const date = new Date();
      const createDate = this.formatDate(date);
      const orderId = date.getTime().toString();

      console.log(`🔑 VNPay TMN Code: ${vnpayConfig.tmnCode}`);
      console.log(
        `🔑 VNPay Hash Secret: ${vnpayConfig.hashSecret.substring(0, 4)}...`
      );
      console.log(`🌐 Client IP: ${ipAddr}`);

      // ✅ FIX: Use real IP, fallback to a valid public IP if localhost
      let clientIp = ipAddr;
      if (
        !clientIp ||
        clientIp === "127.0.0.1" ||
        clientIp === "::1" ||
        clientIp === "localhost"
      ) {
        // Use a valid public IP as fallback (you can use your server's IP)
        clientIp = "118.71.221.0"; // Example public IP in Vietnam
        console.log(`⚠️  Using fallback IP: ${clientIp}`);
      }

      // ✅ Build params object WITHOUT SecureHash fields first
      let vnpParams = {
        vnp_Version: "2.1.0",
        vnp_Command: "pay",
        vnp_TmnCode: vnpayConfig.tmnCode,
        vnp_Amount: amount * 100, // VNPay requires amount * 100
        vnp_CurrCode: "VND",
        vnp_TxnRef: orderId,
        vnp_OrderInfo: orderInfo,
        vnp_OrderType: "other",
        vnp_Locale: "vn",
        vnp_ReturnUrl: returnUrl || vnpayConfig.returnUrl,
        vnp_IpAddr: clientIp, // ✅ Use proper IP
        vnp_CreateDate: createDate,
      };

      // ✅ Sort params alphabetically
      vnpParams = this.sortObject(vnpParams);

      // ✅ Build signature data (key=value pairs joined by &)
      // CRITICAL: Use RAW VALUES (not URL-encoded) for signature
      const signDataArray = [];
      for (const key in vnpParams) {
        if (vnpParams.hasOwnProperty(key)) {
          const value = vnpParams[key];
          // Skip empty values
          if (value !== null && value !== undefined && value !== "") {
            signDataArray.push(`${key}=${value}`);
          }
        }
      }
      const signData = signDataArray.join("&");

      // ✅ Create HMAC-SHA512 signature
      const hmac = crypto.createHmac("sha512", vnpayConfig.hashSecret);
      const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

      // ✅ Add signature field (AFTER signing)
      vnpParams["vnp_SecureHash"] = signed;

      // ✅ Build final URL with proper encoding
      const finalParams = this.sortObject(vnpParams);
      const queryString = Object.keys(finalParams)
        .map((key) => {
          return `${encodeURIComponent(key)}=${encodeURIComponent(
            finalParams[key]
          )}`;
        })
        .join("&");

      const paymentUrl = `${vnpayConfig.url}?${queryString}`;

      console.log(`✅ VNPay Payment URL created for order: ${orderId}`);
      console.log(`📝 Sign data (raw): ${signData}`);
      console.log(`🔐 Signature: ${signed}`);
      console.log(`📝 CreateDate: ${createDate}`);
      console.log(`🔗 Full Payment URL: ${paymentUrl}`);

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

      // Remove hash fields before verification
      const paramsToVerify = { ...vnpParams };
      delete paramsToVerify["vnp_SecureHash"];
      delete paramsToVerify["vnp_SecureHashType"];

      // Sort params
      const sortedParams = this.sortObject(paramsToVerify);

      // Build signature string (same as creation)
      const signDataArray = [];
      for (const key in sortedParams) {
        if (sortedParams.hasOwnProperty(key)) {
          const value = sortedParams[key];
          if (value !== null && value !== undefined && value !== "") {
            signDataArray.push(`${key}=${value}`);
          }
        }
      }
      const signData = signDataArray.join("&");

      // Calculate signature
      const hmac = crypto.createHmac("sha512", vnpayConfig.hashSecret);
      const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

      console.log(`📝 Verify sign data: ${signData}`);
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

      console.error("❌ Signature mismatch!");
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
