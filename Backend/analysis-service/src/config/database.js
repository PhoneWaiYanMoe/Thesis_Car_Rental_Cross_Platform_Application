const { Sequelize } = require("sequelize");

// Database configuration
const sequelize = new Sequelize({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "wiz_analytics",
  dialect: "postgres",
  dialectOptions:
    process.env.DB_SSL === "require"
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        }
      : {},
  logging: process.env.NODE_ENV === "development" ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Analytics DB connection established successfully");
    return true;
  } catch (error) {
    console.error("❌ Unable to connect to analytics database:", error.message);
    return false;
  }
};

// Sync database (create tables if they don't exist)
const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: process.env.NODE_ENV === "development" });
    console.log("✅ Analytics database synchronized successfully");
  } catch (error) {
    console.error("❌ Analytics database sync error:", error.message);
    throw error;
  }
};

module.exports = {
  sequelize,
  testConnection,
  syncDatabase,
};
