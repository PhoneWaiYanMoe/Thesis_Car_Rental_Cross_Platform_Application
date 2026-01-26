const mongoose = require("mongoose");

class Database {
  constructor() {
    this.connection = null;
  }

  async connect() {
    try {
      // Get MongoDB URI from environment
      const mongoUri =
        process.env.MONGODB_URI ||
        `mongodb://${process.env.MONGODB_USER || "wiz_user"}:${
          process.env.MONGODB_PASSWORD || "wiz_password"
        }@localhost:27020/wiz_reviews?authSource=admin&directConnection=true`;

      console.log("🔄 Connecting to MongoDB...");
      console.log(
        "📍 URI:",
        mongoUri.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@"),
      );

      const options = {
        maxPoolSize: 10,
        minPoolSize: 2,
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 30000,
        family: 4,
        retryWrites: true,
        retryReads: true,
        directConnection: false,
        ssl:
          process.env.DB_SSL === "require"
            ? { rejectUnauthorized: false }
            : false,
      };

      this.connection = await mongoose.connect(mongoUri, options);

      console.log("✅ Connected to MongoDB database");
      console.log("📊 Database:", mongoose.connection.db.databaseName);
      console.log("🏠 Host:", mongoose.connection.host);
      console.log("🔌 Port:", mongoose.connection.port);

      // Handle connection events
      mongoose.connection.on("error", (err) => {
        console.error("❌ MongoDB connection error:", err);
      });

      mongoose.connection.on("disconnected", () => {
        console.log("⚠️  MongoDB disconnected");
      });

      mongoose.connection.on("reconnected", () => {
        console.log("✅ MongoDB reconnected");
      });

      return this.connection;
    } catch (error) {
      console.error("❌ MongoDB connection failed:", error.message);
      console.error(
        "💡 Check if MongoDB is running on port 27020 and credentials are correct",
      );
      throw error;
    }
  }

  async disconnect() {
    if (this.connection) {
      await mongoose.disconnect();
      console.log("MongoDB connection closed");
    }
  }

  async healthCheck() {
    try {
      await mongoose.connection.db.admin().ping();
      return true;
    } catch (error) {
      console.error("MongoDB health check failed:", error);
      return false;
    }
  }
}

module.exports = new Database();
