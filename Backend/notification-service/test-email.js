const emailService = require("./src/services/email.service");

async function testEmail() {
  console.log("Testing Email Service...\n");

  const testEmail = "maungmyatthiri@gmail.com";

  try {
    // to send otp email
    console.log("Test 1: Sending OTP email...");
    await emailService.sendOTPEmail(testEmail, "123456", "Email Verification");
    console.log("OTP email sent!\n");

    // to send booking confirmation
    console.log("Test 2: Sending booking confirmation...");
    await emailService.sendBookingConfirmation(testEmail, {
      customerName: "Nguen Van A",
      bookingId: "3f1c9a2e-8b4d-4c7a-9e6f-2d1a5b9c8e42",
      vehicleName: "BMW X1 2020",
      startDate: "2024-12-25 09:00",
      endDate: "2024-12-28 18:00",
      totalAmount: "2,940,000",
    });
    console.log("Booking confirmation sent!\n");

    // to send payment receipt
    console.log("Test 3: Sending payment receipt...");
    await emailService.sendPaymentReceipt(testEmail, {
      customerName: "Nguen Van A",
      transactionId: "a7d4e6b1-3c92-4f58-8a1e-9d2c0b5f7e43",
      bookingId: "3f1c9a2e-8b4d-4c7a-9e6f-2d1a5b9c8e42",
      paymentType: "Deposit",
      amount: "882,000",
      paymentDate: new Date().toLocaleString(),
    });
    console.log("Payment receipt sent!\n");

    console.log("All tests passed.");
  } catch (error) {
    console.error("Test failed:", error.message);
  }
}

testEmail();
