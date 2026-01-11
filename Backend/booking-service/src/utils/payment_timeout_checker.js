// Backend/booking-service/src/utils/payment_timeout_checker.js
// ✅ NEW: Auto-cancel bookings if payment not completed within 30 minutes

const pool = require("../config/database");

/**
 * Check for expired payment bookings
 * Runs every 5 minutes to check if payment expired
 */
async function checkExpiredPayments() {
  const client = await pool.connect();

  try {
    console.log("🔍 Checking for expired payment bookings...");

    // Find bookings in 'pending_payment' status where payment_expiry < NOW
    const result = await client.query(
      `SELECT booking_id, customer_id, vehicle_id, payment_expiry, created_at 
       FROM bookings 
       WHERE status = 'pending_payment' 
       AND payment_expiry < NOW()`
    );

    if (result.rows.length === 0) {
      console.log("✅ No expired payment bookings found");
      return;
    }

    console.log(`⚠️  Found ${result.rows.length} expired payment bookings`);

    // Mark them as cancelled
    for (const booking of result.rows) {
      const expiredMinutes = Math.floor(
        (Date.now() - new Date(booking.payment_expiry)) / (1000 * 60)
      );

      await client.query(
        `UPDATE bookings 
         SET status = 'cancelled',
             cancellation_reason = 'Payment not completed within 30 minutes',
             cancellation_date = NOW(),
             refund_amount = 0,
             refund_status = 'none',
             updated_at = NOW()
         WHERE booking_id = $1`,
        [booking.booking_id]
      );

      console.log(
        `❌ Cancelled booking ${booking.booking_id} (expired ${expiredMinutes} min ago)`
      );

      // TODO: Send notification to customer about cancellation
      // TODO: Update transaction status in payment service
    }

    console.log(`✅ Processed ${result.rows.length} expired payment bookings`);
  } catch (error) {
    console.error("❌ Payment timeout checker error:", error);
  } finally {
    client.release();
  }
}

/**
 * Start the payment timeout checker (runs every 5 minutes)
 */
function startPaymentTimeoutChecker() {
  // Run immediately on start
  checkExpiredPayments();

  // Then run every 5 minutes
  setInterval(checkExpiredPayments, 5 * 60 * 1000);

  console.log("✅ Payment timeout checker started (runs every 5 minutes)");
}

module.exports = { checkExpiredPayments, startPaymentTimeoutChecker };
