// Backend/payment-service/tests/integration_test.js
// Test script to verify payment-booking integration

const axios = require("axios");

// Configuration
const BOOKING_SERVICE = "http://localhost:3004";
const PAYMENT_SERVICE = "http://localhost:3006";
const USER_SERVICE = "http://localhost:3001";

// Test credentials
const TEST_USER = {
  email: "customer1@wiz.com",
  password: "Test123!@#",
};

let authToken = null;
let testBookingId = null;

// Helper: Make authenticated request
async function makeRequest(method, url, data = null) {
  const config = {
    method,
    url,
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    data,
  };

  try {
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status,
    };
  }
}

// Test 1: Login and get token
async function test_login() {
  console.log("\n📝 Test 1: User Login");
  console.log("─────────────────────────────");

  const result = await makeRequest("POST", `${USER_SERVICE}/auth/login`, {
    email: TEST_USER.email,
    password: TEST_USER.password,
  });

  if (result.success) {
    authToken = result.data.token;
    console.log("✅ Login successful");
    console.log(`Token: ${authToken.substring(0, 20)}...`);
    return true;
  } else {
    console.log("❌ Login failed:", result.error);
    return false;
  }
}

// Test 2: Verify user has verification
async function test_verification() {
  console.log("\n📝 Test 2: Check Verification Status");
  console.log("─────────────────────────────────────");

  const result = await makeRequest(
    "GET",
    `${BOOKING_SERVICE}/bookings/verification/me`
  );

  if (result.success) {
    console.log("✅ Verification check successful");
    console.log(`Is Verified: ${result.data.isVerified}`);
    console.log(`Has License: ${result.data.hasLicense}`);
    console.log(`Has Selfies: ${result.data.hasSelfies}`);
    return result.data.isVerified;
  } else {
    console.log("❌ Verification check failed:", result.error);
    return false;
  }
}

// Test 3: Create a booking
async function test_create_booking() {
  console.log("\n📝 Test 3: Create Booking");
  console.log("───────────────────────────");

  const bookingData = {
    vehicleId: "550e8400-e29b-41d4-a716-446655440001",
    startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    pickupLocation: {
      displayName: "District 1, HCMC",
      latitude: 10.7769,
      longitude: 106.7009,
    },
    dropoffLocation: {
      displayName: "District 1, HCMC",
      latitude: 10.7769,
      longitude: 106.7009,
    },
    driverRequired: false,
    insuranceCoverage: 50,
    paymentMethodId: "pm_test_123",
    additionalNotes: "Integration test booking",
  };

  const result = await makeRequest(
    "POST",
    `${BOOKING_SERVICE}/bookings`,
    bookingData
  );

  if (result.success) {
    testBookingId = result.data.booking.id;
    console.log("✅ Booking created successfully");
    console.log(`Booking ID: ${testBookingId}`);
    console.log(`Status: ${result.data.booking.status}`);
    console.log(`Total Amount: ${result.data.booking.pricing.total} VND`);
    console.log(`Deposit: ${result.data.booking.pricing.deposit} VND`);
    console.log(
      `Remaining: ${result.data.booking.pricing.remainingPayment} VND`
    );
    return true;
  } else {
    console.log("❌ Booking creation failed:", result.error);
    return false;
  }
}

// Test 4: Get booking details via booking service
async function test_get_booking_details() {
  console.log("\n📝 Test 4: Get Booking Details (Booking Service)");
  console.log("──────────────────────────────────────────────────");

  const result = await makeRequest(
    "GET",
    `${BOOKING_SERVICE}/bookings/${testBookingId}`
  );

  if (result.success) {
    console.log("✅ Booking details retrieved");
    console.log(`Status: ${result.data.booking.status}`);
    console.log(`Total: ${result.data.booking.billing.total} VND`);
    console.log(`Deposit: ${result.data.booking.billing.deposit} VND`);
    console.log(`Deposit Paid: ${result.data.booking.billing.depositPaid}`);
    return true;
  } else {
    console.log("❌ Failed to get booking details:", result.error);
    return false;
  }
}

// Test 5: Create deposit payment intent
async function test_create_deposit_intent() {
  console.log("\n📝 Test 5: Create Deposit Payment Intent");
  console.log("─────────────────────────────────────────");

  const intentData = {
    bookingId: testBookingId,
    provider: "vnpay",
  };

  const result = await makeRequest(
    "POST",
    `${PAYMENT_SERVICE}/payment/deposit/intent`,
    intentData
  );

  if (result.success) {
    console.log("✅ Deposit payment intent created");
    console.log(`Intent ID: ${result.data.intentId}`);
    console.log(`Amount: ${result.data.amount} ${result.data.currency}`);
    console.log(`Provider: ${result.data.provider}`);
    console.log(`Status: ${result.data.status}`);
    if (result.data.paymentUrl) {
      console.log(`Payment URL: ${result.data.paymentUrl.substring(0, 60)}...`);
    }
    return true;
  } else {
    console.log("❌ Failed to create deposit intent:", result.error);
    return false;
  }
}

// Test 6: Get payment methods
async function test_get_payment_methods() {
  console.log("\n📝 Test 6: Get Payment Methods");
  console.log("────────────────────────────────");

  const result = await makeRequest("GET", `${PAYMENT_SERVICE}/payment/methods`);

  if (result.success) {
    console.log("✅ Payment methods retrieved");
    console.log(`Total methods: ${result.data.methods.length}`);
    if (result.data.default) {
      console.log(`Default method: ${result.data.default}`);
    }
    return true;
  } else {
    console.log("❌ Failed to get payment methods:", result.error);
    return false;
  }
}

// Test 7: Get transaction history
async function test_get_transactions() {
  console.log("\n📝 Test 7: Get Transaction History");
  console.log("───────────────────────────────────");

  const result = await makeRequest(
    "GET",
    `${PAYMENT_SERVICE}/payment/transactions?limit=5`
  );

  if (result.success) {
    console.log("✅ Transaction history retrieved");
    console.log(`Total transactions: ${result.data.pagination.total}`);
    console.log(`Showing: ${result.data.transactions.length} transactions`);

    result.data.transactions.forEach((tx, i) => {
      console.log(`\nTransaction ${i + 1}:`);
      console.log(`  ID: ${tx.transaction_id}`);
      console.log(`  Type: ${tx.type}`);
      console.log(`  Amount: ${tx.amount} ${tx.currency}`);
      console.log(`  Status: ${tx.status}`);
      console.log(`  Provider: ${tx.provider}`);
    });

    return true;
  } else {
    console.log("❌ Failed to get transactions:", result.error);
    return false;
  }
}

// Test 8: Get booking transactions
async function test_get_booking_transactions() {
  console.log("\n📝 Test 8: Get Booking-Specific Transactions");
  console.log("─────────────────────────────────────────────");

  const result = await makeRequest(
    "GET",
    `${PAYMENT_SERVICE}/payment/transactions/booking/${testBookingId}`
  );

  if (result.success) {
    console.log("✅ Booking transactions retrieved");
    console.log(`Booking ID: ${result.data.bookingId}`);
    console.log(`Total transactions: ${result.data.transactions.length}`);
    console.log("\nPayment Summary:");
    console.log(`  Total Paid: ${result.data.summary.totalPaid} VND`);
    console.log(`  Total Refunded: ${result.data.summary.totalRefunded} VND`);
    console.log(`  Deposit Status: ${result.data.summary.depositStatus}`);
    console.log(
      `  Final Payment Status: ${result.data.summary.finalPaymentStatus}`
    );
    return true;
  } else {
    console.log("❌ Failed to get booking transactions:", result.error);
    return false;
  }
}

// Test 9: Test gRPC connection (indirect via health check)
async function test_grpc_health() {
  console.log("\n📝 Test 9: Service Health Checks");
  console.log("─────────────────────────────────");

  const services = [
    { name: "Booking Service", url: `${BOOKING_SERVICE}/health` },
    { name: "Payment Service", url: `${PAYMENT_SERVICE}/health` },
  ];

  let allHealthy = true;

  for (const service of services) {
    const result = await makeRequest("GET", service.url);
    if (result.success) {
      console.log(`✅ ${service.name}: Healthy`);
      console.log(`   Status: ${result.data.status}`);
      console.log(`   Service: ${result.data.service}`);
    } else {
      console.log(`❌ ${service.name}: Unhealthy`);
      allHealthy = false;
    }
  }

  return allHealthy;
}

// Main test runner
async function runTests() {
  console.log("\n╔════════════════════════════════════════════════╗");
  console.log("║   PAYMENT-BOOKING INTEGRATION TEST SUITE      ║");
  console.log("╚════════════════════════════════════════════════╝");

  const tests = [
    { name: "Service Health Check", fn: test_grpc_health },
    { name: "User Login", fn: test_login },
    { name: "Verification Status", fn: test_verification },
    { name: "Create Booking", fn: test_create_booking },
    { name: "Get Booking Details", fn: test_get_booking_details },
    { name: "Create Deposit Intent", fn: test_create_deposit_intent },
    { name: "Get Payment Methods", fn: test_get_payment_methods },
    { name: "Get Transactions", fn: test_get_transactions },
    { name: "Get Booking Transactions", fn: test_get_booking_transactions },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.log(`\n❌ Test "${test.name}" threw error:`, error.message);
      failed++;
    }
  }

  console.log("\n╔════════════════════════════════════════════════╗");
  console.log("║              TEST SUMMARY                      ║");
  console.log("╚════════════════════════════════════════════════╝");
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${tests.length}`);
  console.log(`🎯 Success Rate: ${Math.round((passed / tests.length) * 100)}%`);

  if (failed === 0) {
    console.log(
      "\n🎉 All tests passed! Payment-Booking integration is working correctly."
    );
  } else {
    console.log(
      "\n⚠️  Some tests failed. Please check the logs above for details."
    );
  }
}

// Run the tests
runTests().catch((error) => {
  console.error("\n💥 Fatal error running tests:", error);
  process.exit(1);
});
