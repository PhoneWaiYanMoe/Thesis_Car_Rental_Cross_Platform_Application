// Backend/vehicle-service/src/utils/debug_vehicles.js
// Run with: node src/utils/debug_vehicles.js

require("dotenv").config();
const pool = require("../config/database");

async function debugVehicles() {
  console.log("🔍 Debugging Vehicle Database...\n");

  try {
    // 1. Check total vehicles
    const totalResult = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'active') as active,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'stopped') as stopped
      FROM vehicles
    `);
    console.log("📊 Vehicle Counts:");
    console.log(totalResult.rows[0]);
    console.log("");

    // 2. List all vehicles with their status
    const vehiclesResult = await pool.query(`
      SELECT 
        vehicle_id,
        name,
        status,
        location->>'city' as city,
        location->>'district' as district,
        location->>'address' as address,
        price_per_day
      FROM vehicles
      ORDER BY created_at DESC
    `);
    
    console.log(`📋 All Vehicles (${vehiclesResult.rows.length} total):`);
    vehiclesResult.rows.forEach((v, i) => {
      console.log(`${i + 1}. ${v.name} - ${v.status}`);
      console.log(`   Location: ${v.address || `${v.district}, ${v.city}`}`);
      console.log(`   Price: ${v.price_per_day} VND/day`);
      console.log(`   ID: ${v.vehicle_id}`);
      console.log("");
    });

    // 3. Check location data format
    const locationResult = await pool.query(`
      SELECT 
        name,
        location
      FROM vehicles
      LIMIT 3
    `);
    
    console.log("🗺️ Sample Location Data:");
    locationResult.rows.forEach((v) => {
      console.log(`${v.name}:`, JSON.stringify(v.location, null, 2));
      console.log("");
    });

    // 4. Check unavailability records
    const unavailResult = await pool.query(`
      SELECT 
        vu.vehicle_id,
        v.name,
        vu.start_date,
        vu.end_date,
        vu.reason,
        vu.booking_id
      FROM vehicle_unavailability vu
      JOIN vehicles v ON vu.vehicle_id = v.vehicle_id
      ORDER BY vu.start_date DESC
      LIMIT 10
    `);
    
    console.log(`📅 Unavailability Records (${unavailResult.rows.length} recent):`);
    if (unavailResult.rows.length === 0) {
      console.log("   No unavailability records found");
    } else {
      unavailResult.rows.forEach((u) => {
        console.log(`   ${u.name}: ${u.start_date} to ${u.end_date}`);
        console.log(`   Reason: ${u.reason || 'N/A'}`);
        console.log(`   Booking: ${u.booking_id || 'N/A'}`);
        console.log("");
      });
    }

    // 5. Test search query with dates
    const testStartDate = '2026-01-03';
    const testEndDate = '2026-01-07';
    
    console.log(`🔍 Test Search (${testStartDate} to ${testEndDate}):`);
    
    const testResult = await pool.query(`
      SELECT 
        v.vehicle_id,
        v.name,
        v.status,
        v.location->>'city' as city,
        (SELECT COUNT(*) 
         FROM vehicle_unavailability 
         WHERE vehicle_id = v.vehicle_id 
         AND start_date <= $1 
         AND end_date >= $2) as unavailable_count
      FROM vehicles v
      WHERE v.status = 'active'
    `, [testEndDate, testStartDate]);
    
    console.log(`Found ${testResult.rows.length} active vehicles:`);
    testResult.rows.forEach((v) => {
      console.log(`   ${v.name} - ${v.city}`);
      console.log(`   Unavailable? ${v.unavailable_count > 0 ? 'YES' : 'NO'} (count: ${v.unavailable_count})`);
    });
    console.log("");

    // 6. Check for potential issues
    console.log("⚠️ Potential Issues:");
    
    const noPhotoResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM vehicles v
      WHERE NOT EXISTS (
        SELECT 1 FROM vehicle_photos 
        WHERE vehicle_id = v.vehicle_id
      )
    `);
    console.log(`   Vehicles without photos: ${noPhotoResult.rows[0].count}`);
    
    const emptyLocationResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM vehicles
      WHERE location IS NULL OR location = '{}'::jsonb
    `);
    console.log(`   Vehicles with empty location: ${emptyLocationResult.rows[0].count}`);

  } catch (error) {
    console.error("❌ Debug error:", error);
  } finally {
    await pool.end();
  }
}

debugVehicles();