// TEST SCRIPT: Backend/payment-service/test_vnpay.js
// Run this with: node test_vnpay.js

const crypto = require("crypto");
require('dotenv').config();

// Your VNPay credentials
const vnp_TmnCode = process.env.VNPAY_TMN_CODE || "F9EMM09Q";
const vnp_HashSecret = process.env.VNPAY_HASH_SECRET || "50CGCKWMST7WNI72QOYRIORGJ4AU9OCE";
const vnp_Url = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
const vnp_ReturnUrl = "https://master-albacore-urgently.ngrok-free.app/payment/webhook/vnpay";

console.log("🔑 Testing VNPay Configuration:");
console.log(`   TMN Code: ${vnp_TmnCode}`);
console.log(`   Hash Secret: ${vnp_HashSecret.substring(0, 8)}...`);
console.log(`   Return URL: ${vnp_ReturnUrl}\n`);

function formatDate(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return date.getFullYear() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds());
}

function sortObject(obj) {
  return Object.keys(obj).sort().reduce((result, key) => {
    result[key] = obj[key];
    return result;
  }, {});
}

// Create test payment URL
const date = new Date();
const orderId = date.getTime();
const amount = 100000; // 100,000 VND

let vnp_Params = {
  vnp_Version: '2.1.0',
  vnp_Command: 'pay',
  vnp_TmnCode: vnp_TmnCode,
  vnp_Locale: 'vn',
  vnp_CurrCode: 'VND',
  vnp_TxnRef: orderId.toString(),
  vnp_OrderInfo: 'Test payment ' + orderId,
  vnp_OrderType: 'other',
  vnp_Amount: amount * 100, // VNPay expects amount * 100
  vnp_ReturnUrl: vnp_ReturnUrl,
  vnp_IpAddr: '13.160.92.202', // Valid public IP
  vnp_CreateDate: formatDate(date)
};

console.log("📦 Parameters (before sorting):");
console.log(JSON.stringify(vnp_Params, null, 2));

// Sort parameters
vnp_Params = sortObject(vnp_Params);

console.log("\n📦 Parameters (after sorting):");
console.log(JSON.stringify(vnp_Params, null, 2));

// Build sign data
const signData = Object.keys(vnp_Params)
  .map(key => `${key}=${vnp_Params[key]}`)
  .join('&');

console.log("\n📝 Sign Data (for HMAC):");
console.log(signData);

// Create signature
const hmac = crypto.createHmac("sha512", vnp_HashSecret);
const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

console.log("\n🔐 Signature:");
console.log(signed);

// Add signature to params
vnp_Params['vnp_SecureHash'] = signed;

// Build URL
const queryString = Object.keys(vnp_Params)
  .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(vnp_Params[key])}`)
  .join('&');

const paymentUrl = `${vnp_Url}?${queryString}`;

console.log("\n🔗 Payment URL:");
console.log(paymentUrl);

console.log("\n✅ Copy the URL above and paste it in your browser to test!");
console.log("   If you get Error 70, the issue is with VNPay credentials or account setup");
console.log("   If payment page loads, the issue is with how we're calling from the service\n");