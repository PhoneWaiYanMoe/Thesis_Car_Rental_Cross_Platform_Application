// Backend/booking-service/src/utils/migrationRunner.js
const fs = require("fs");
const path = require("path");
const pool = require("../config/database");

/**
 * Wait for database connection to be ready
 */
async function waitForDatabase(maxRetries = 10, delayMs = 2000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await pool.query("SELECT 1");
      console.log("✅ Database connection established");
      return true;
    } catch (error) {
      if (i < maxRetries - 1) {
        console.log(`⏳ Waiting for database connection... (${i + 1}/${maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } else {
        throw new Error(`Database connection failed after ${maxRetries} attempts: ${error.message}`);
      }
    }
  }
}

/**
 * Run database migrations
 */
async function runMigrations() {
  try {
    // Wait for database to be ready
    await waitForDatabase();

    const migrationsDir = path.join(__dirname, "../../migrations");
    
    // Check if migrations directory exists
    if (!fs.existsSync(migrationsDir)) {
      console.log("⚠️  No migrations directory found");
      return;
    }

    // Get all SQL files sorted by name
    const files = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    if (files.length === 0) {
      console.log("⚠️  No migration files found");
      return;
    }

    console.log(`📦 Running ${files.length} migration(s)...`);

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, "utf8");

      try {
        await pool.query(sql);
        console.log(`✅ Migration ${file} completed successfully`);
      } catch (error) {
        // If table already exists, that's okay (CREATE TABLE IF NOT EXISTS)
        if (error.message.includes("already exists")) {
          console.log(`ℹ️  Migration ${file} skipped (already applied)`);
        } else {
          console.error(`❌ Error running migration ${file}:`, error.message);
          throw error;
        }
      }
    }

    console.log("✅ All migrations completed");
  } catch (error) {
    console.error("❌ Migration runner error:", error);
    throw error;
  }
}

module.exports = { runMigrations };