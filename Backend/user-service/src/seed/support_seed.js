const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const pool = require("../config/database");

async function seedSupport() {
  // Hash password
  const passwordHash = await bcrypt.hash('Support123!', 10);

  // Insert support user
  await pool.query(
    `INSERT INTO users (
      user_id,
      email,
      password_hash,
      full_name,
      role,
      is_verified,
      created_at
    ) VALUES ($1, $2, $3, $4, 'support', true, NOW())`,
    [uuidv4(), 'supportdefault@wiz.com', passwordHash, 'Default Customer Support'],
  );

  console.log("Support user created successfully");
}

module.exports = seedSupport;