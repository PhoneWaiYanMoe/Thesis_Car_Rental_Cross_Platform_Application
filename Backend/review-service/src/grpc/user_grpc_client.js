const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");

// You'll need to create a user.proto for user service gRPC
const PROTO_PATH = path.join(__dirname, "../../proto/user.proto");

class UserGrpcClient {
  constructor() {
    try {
      const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      });

      const userProto = grpc.loadPackageDefinition(packageDefinition).user;

      const userServiceUrl =
        process.env.USER_SERVICE_GRPC_URL || "localhost:50053";

      this.client = new userProto.UserService(
        userServiceUrl,
        grpc.credentials.createInsecure()
      );

      console.log(`📡 User gRPC client connected to ${userServiceUrl}`);
    } catch (error) {
      console.error("❌ Failed to initialize User gRPC client:", error.message);
      this.client = null;
    }
  }

  // Get user profile (name, avatar)
  async getUserProfile(userId) {
    if (!this.client) {
      console.warn("⚠️  User gRPC client not available");
      return {
        user_id: userId,
        full_name: "Unknown User",
        avatar_url: null
      };
    }

    return new Promise((resolve, reject) => {
      this.client.GetUserProfile(
        { user_id: userId },
        (error, response) => {
          if (error) {
            console.error("❌ gRPC getUserProfile error:", error);
            // Return fallback data instead of rejecting
            resolve({
              user_id: userId,
              full_name: "Unknown User",
              avatar_url: null
            });
          } else {
            resolve(response);
          }
        }
      );
    });
  }

  // Get multiple user profiles at once
  async getUserProfiles(userIds) {
    if (!this.client) {
      console.warn("⚠️  User gRPC client not available");
      return userIds.map(id => ({
        user_id: id,
        full_name: "Unknown User",
        avatar_url: null
      }));
    }

    return new Promise((resolve, reject) => {
      this.client.GetUserProfiles(
        { user_ids: userIds },
        (error, response) => {
          if (error) {
            console.error("❌ gRPC getUserProfiles error:", error);
            resolve(userIds.map(id => ({
              user_id: id,
              full_name: "Unknown User",
              avatar_url: null
            })));
          } else {
            resolve(response.users);
          }
        }
      );
    });
  }
}

module.exports = new UserGrpcClient();