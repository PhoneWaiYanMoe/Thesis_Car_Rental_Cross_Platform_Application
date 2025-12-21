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
        }@localhost:27017/wiz_reviews?authSource=admin&directConnection=true`;

      console.log("🔄 Connecting to MongoDB...");
      console.log(
        "📍 URI:",
        mongoUri.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@")
      );

      const options = {
        maxPoolSize: 10,
        minPoolSize: 2,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        family: 4, // Use IPv4
        retryWrites: true,
        retryReads: true,
      };

      this.connection = await mongoose.connect(mongoUri, options);

      console.log("✅ Connected to MongoDB database");
      console.log("📊 Database:", mongoose.connection.db.databaseName);
      console.log("🏠 Host:", mongoose.connection.host);

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
        "💡 Check if MongoDB is running and credentials are correct"
      );
      console.error(
        "💡 URI format should be: mongodb://username:password@host:port/database?authSource=admin"
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
