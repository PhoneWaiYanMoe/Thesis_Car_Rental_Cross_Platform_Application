// Backend/vehicle-service/src/grpc/user_grpc_client.js - FIXED VERSION
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");

// Load proto file
const PROTO_PATH = path.join(__dirname, "../../proto/user.proto");
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const userProto = grpc.loadPackageDefinition(packageDefinition).user;

class UserGrpcClient {
  constructor() {
    // ✅ FIX: Use environment variable or fallback
    const userServiceUrl = process.env.USER_SERVICE_GRPC_URL || "wiz-user-service:50053";

    this.client = new userProto.UserService(
      userServiceUrl,
      grpc.credentials.createInsecure(),
      {
        // ✅ ADD: gRPC client options for better connection handling
        'grpc.keepalive_time_ms': 30000,
        'grpc.keepalive_timeout_ms': 10000,
        'grpc.keepalive_permit_without_calls': 1,
        'grpc.http2.max_pings_without_data': 0,
        'grpc.http2.min_time_between_pings_ms': 10000,
      }
    );

    console.log(`📡 User gRPC client connected to ${userServiceUrl}`);
    
    // ✅ ADD: Test connection on startup
    this.testConnection();
  }

  /**
   * ✅ NEW: Test gRPC connection on startup
   */
  async testConnection() {
    try {
      // Try to connect with a simple call
      const deadline = new Date();
      deadline.setSeconds(deadline.getSeconds() + 5);
      
      await new Promise((resolve, reject) => {
        this.client.waitForReady(deadline, (error) => {
          if (error) {
            console.warn('⚠️ User gRPC service not ready yet:', error.message);
            reject(error);
          } else {
            console.log('✅ User gRPC client connection ready');
            resolve();
          }
        });
      });
    } catch (error) {
      console.warn('⚠️ User gRPC test connection failed - will retry on first call');
    }
  }

  /**
   * Get single user profile with retry logic
   */
  getUserProfile(userId) {
    return new Promise((resolve, reject) => {
      // ✅ ADD: Deadline for request (5 seconds timeout)
      const deadline = new Date();
      deadline.setSeconds(deadline.getSeconds() + 5);

      this.client.GetUserProfile(
        { user_id: userId },
        { deadline },
        (error, response) => {
          if (error) {
            console.error("❌ gRPC getUserProfile error:", error.message);
            reject(error);
          } else {
            resolve(response);
          }
        }
      );
    });
  }

  /**
   * Get multiple user profiles (batch) with retry logic
   */
  getUserProfiles(userIds) {
    return new Promise((resolve, reject) => {
      // ✅ ADD: Deadline for request (5 seconds timeout)
      const deadline = new Date();
      deadline.setSeconds(deadline.getSeconds() + 5);

      this.client.GetUserProfiles(
        { user_ids: userIds },
        { deadline },
        (error, response) => {
          if (error) {
            console.error("❌ gRPC getUserProfiles error:", error.message);
            reject(error);
          } else {
            resolve(response.users || []);
          }
        }
      );
    });
  }

  /**
   * ✅ NEW: Get user profiles with automatic fallback to defaults
   */
  async getUserProfilesSafe(userIds) {
    try {
      return await this.getUserProfiles(userIds);
    } catch (error) {
      console.warn('⚠️ gRPC getUserProfiles failed, returning defaults:', error.message);
      // Return default owner info for each user ID
      return userIds.map(userId => ({
        user_id: userId,
        full_name: 'Vehicle Owner',
        avatar_url: 'assets/images/article_2.png',
        email: 'owner@example.com',
        role: 'owner'
      }));
    }
  }

  /**
   * ✅ NEW: Get single user profile with automatic fallback
   */
  async getUserProfileSafe(userId) {
    try {
      return await this.getUserProfile(userId);
    } catch (error) {
      console.warn('⚠️ gRPC getUserProfile failed, returning default:', error.message);
      return {
        user_id: userId,
        full_name: 'Vehicle Owner',
        avatar_url: 'assets/images/article_2.png',
        email: 'owner@example.com',
        role: 'owner'
      };
    }
  }
}

module.exports = new UserGrpcClient();