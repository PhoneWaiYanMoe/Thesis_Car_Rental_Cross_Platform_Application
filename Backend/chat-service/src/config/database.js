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
    dialectOptions: {
      ssl:
        process.env.DB_SSL === "require"
          ? {
              require: true,
              rejectUnauthorized: false,
            }
          : false,
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("Chat Service: Database connected successfully");

    await sequelize.sync({ alter: process.env.NODE_ENV === "development" });
    console.log("Chat Service: Database synced");
  } catch (error) {
    console.error("Chat Service: Database connection failed:", error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
