const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    ssl:
      process.env.DB_SSL === "require" ? { rejectUnauthorized: false } : false,
  },
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("Media Service: Database connected successfully");

    // sync models
    await sequelize.sync({ alter: process.env.NODE_ENV === "development" });
    console.log("Media Service: Database synced");
  } catch (error) {
    console.error("Media Service: Database connection failed:", error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
