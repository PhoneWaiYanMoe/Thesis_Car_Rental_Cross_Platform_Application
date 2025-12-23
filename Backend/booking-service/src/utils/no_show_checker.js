// Backend/booking-service/src/utils/no_show_checker.js
const pool = require("../config/database");

/**
 * Check for no-show bookings
 * Runs every hour to check if customers didn't show up 1 day after booking start date
 * If no pickup confirmed, cancel booking with no refund
 */
async function checkNoShows() {
  const client = await pool.connect();
  
  try {
    console.log("🔍 Checking for no-show bookings...");
    
    // Find bookings that are in 'booking' status
    // where start_date + 1 day < now
    // and pickup not confirmed
    const result = await client.query(
      `SELECT booking_id, customer_id, start_date 
       FROM bookings 
       WHERE status = 'booking' 
       AND pickup_confirmed_at IS NULL
       AND start_date + INTERVAL '1 day' < NOW()`
    );
    
    if (result.rows.length === 0) {
      console.log("✅ No no-show bookings found");
      return;
    }
    
    console.log(`⚠️  Found ${result.rows.length} no-show bookings`);
    
    // Mark them as cancelled with no refund
    for (const booking of result.rows) {
      await client.query(
        `UPDATE bookings 
         SET status = 'cancelled',
             cancellation_reason = 'Customer did not show up for pickup',
             cancellation_date = NOW(),
             no_show = true,
             no_show_checked_at = NOW(),
             refund_amount = 0,
             refund_status = 'none',
             updated_at = NOW()
         WHERE booking_id = $1`,
        [booking.booking_id]
      );
      
      console.log(`❌ Marked booking ${booking.booking_id} as no-show (customer: ${booking.customer_id})`);
      
      // TODO: Send notification to customer about no-show cancellation
    }
    
    console.log(`✅ Processed ${result.rows.length} no-show bookings`);
    
  } catch (error) {
    console.error("❌ No-show checker error:", error);
  } finally {
    client.release();
  }
}

/**
 * Start the no-show checker (runs every hour)
 */
function startNoShowChecker() {
  // Run immediately on start
  checkNoShows();
  
  // Then run every hour
  setInterval(checkNoShows, 60 * 60 * 1000);
  
  console.log("✅ No-show checker started (runs every hour)");
}

module.exports = { checkNoShows, startNoShowChecker };