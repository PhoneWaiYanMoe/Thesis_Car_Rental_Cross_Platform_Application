const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const pool = require("../config/database");

async function seedAdmin() {
  const { ADMIN_EMAIL, ADMIN_FULL_NAME, ADMIN_PASSWORD } = process.env;

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.warn("Admin env variables not set, skipping admin seed");
    return;
  }

  // Check if admin already exists
  const existingAdmin = await pool.query(
    "SELECT user_id FROM users WHERE role = 'admin' LIMIT 1",
  );

  if (existingAdmin.rows.length > 0) {
    console.log("Admin already exists, skipping seed");
    return;
  }

  // Hash password
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  // Insert admin
  await pool.query(
    `INSERT INTO users (
      user_id,
      email,
      password_hash,
      full_name,
      role,
      is_verified,
      created_at
    ) VALUES ($1, $2, $3, $4, 'admin', true, NOW())`,
    [uuidv4(), ADMIN_EMAIL, passwordHash, ADMIN_FULL_NAME || "System Admin"],
  );

  console.log("Admin user created successfully");
}

module.exports = seedAdmin;
