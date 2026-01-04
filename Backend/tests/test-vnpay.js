// test-vnpay.js - Test VNPay payment flow

const axios = require('axios');

const API_BASE = 'https://master-albacore-urgently.ngrok-free.app';
const TEST_TOKEN = 'YOUR_JWT_TOKEN'; // Get from login

// OR use localhost if testing locally
// const API_BASE = 'http://localhost:3006';

async function testVNPayPayment() {
  try {
    console.log('🧪 Testing VNPay Payment Integration\n');

    // Step 1: Create deposit intent with VNPay
    console.log('📝 Step 1: Creating VNPay deposit intent...');
    const intentResponse = await axios.post(
      `${API_BASE}/payment/deposit/intent`,
      {
        bookingId: 'YOUR_BOOKING_ID',
        provider: 'vnpay',
      },
      {
        headers: {
          Authorization: `Bearer ${TEST_TOKEN}`,
        },
      }
    );

    console.log('✅ Intent created:');
    console.log('   Intent ID:', intentResponse.data.intentId);
    console.log('   Amount:', intentResponse.data.amount, 'VND');
    console.log('   Payment URL:', intentResponse.data.paymentUrl);

    // Step 2: Instructions for user
    console.log('\n📱 Step 2: Testing payment:');
    console.log('   1. Open this URL in browser:');
    console.log('   ', intentResponse.data.paymentUrl);
    console.log('\n   2. Use VNPay sandbox test card:');
    console.log('      Card Number: 9704198526191432198');
    console.log('      Card Holder: NGUYEN VAN A');
    console.log('      Issue Date: 07/15');
    console.log('      OTP: 123456');
    console.log('\n   3. After payment, check transaction status');

    // Step 3: Check transaction status (run after payment)
    console.log('\n🔍 Step 3: Checking transaction status...');
    setTimeout(async () => {
      try {
        const statusResponse = await axios.get(
          `${API_BASE}/payment/transactions`,
          {
            headers: {
              Authorization: `Bearer ${TEST_TOKEN}`,
            },
          }
        );

        console.log('\n📊 Recent transactions:');
        statusResponse.data.transactions.slice(0, 3).forEach((tx) => {
          console.log(`   - ${tx.type}: ${tx.amount} VND (${tx.status})`);
        });
      } catch (error) {
        console.error('❌ Status check failed:', error.message);
      }
    }, 5000);
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// VNPay Sandbox Test Cards
console.log('💳 VNPay Sandbox Test Cards:\n');
console.log('Domestic Card (NCB):');
console.log('   Card: 9704198526191432198');
console.log('   Holder: NGUYEN VAN A');
console.log('   Issue Date: 07/15');
console.log('   OTP: 123456\n');

console.log('International Card (Visa):');
console.log('   Card: 4111111111111111');
console.log('   CVV: 123');
console.log('   Expiry: Any future date\n');

// Run test
testVNPayPayment();