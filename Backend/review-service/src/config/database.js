const mongoose = require("mongoose");

class Database {
  constructor() {
    this.connection = null;
  }

  async connect() {
    try {
      // Get MongoDB URI from environment
      let mongoUri = process.env.MONGODB_URI;

      // Only use fallback in development
      if (!mongoUri) {
        if (process.env.NODE_ENV === "production") {
          throw new Error(
            "MONGODB_URI environment variable is required in production",
          );
        }
        // Development fallback
        mongoUri = `mongodb://${process.env.MONGODB_USER || "wiz_user"}:${
          process.env.MONGODB_PASSWORD || "wiz_password"
        }@localhost:27020/wiz_reviews?authSource=admin&directConnection=true`;
        console.warn("⚠️  Using development MongoDB fallback connection");
      }

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
        // SSL is handled by the connection string
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
      if (error.message.includes("MONGODB_URI")) {
        console.error(
          "💡 Set MONGODB_URI environment variable to your MongoDB connection string",
        );
      } else {
        console.error(
          "💡 Check MongoDB connection string and network connectivity",
        );
      }
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
