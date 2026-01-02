// Backend/vehicle-service/src/grpc/user_grpc_client.js
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");

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
    const userServiceUrl =
      process.env.USER_SERVICE_GRPC_URL || "localhost:50053";

    this.client = new userProto.UserService(
      userServiceUrl,
      grpc.credentials.createInsecure()
    );

    console.log(`📡 User gRPC client connected to ${userServiceUrl}`);
  }

  /**
   * Get single user profile
   */
  getUserInfo(userId) {
    return new Promise((resolve, reject) => {
      this.client.GetUserProfile({ user_id: userId }, (error, response) => {
        if (error) {
          console.error("❌ gRPC getUserInfo error:", error);
          reject(error);
        } else {
          resolve({
            userId: response.user_id,
            email: response.email,
            fullName: response.full_name,
            avatarUrl: response.avatar_url,
            role: response.role,
          });
        }
      });
    });
  }

  /**
   * Get multiple user profiles
   */
  getUsersInfo(userIds) {
    return new Promise((resolve, reject) => {
      this.client.GetUserProfiles({ user_ids: userIds }, (error, response) => {
        if (error) {
          console.error("❌ gRPC getUsersInfo error:", error);
          reject(error);
        } else {
          const users = response.users.map((user) => ({
            userId: user.user_id,
            email: user.email,
            fullName: user.full_name,
            avatarUrl: user.avatar_url,
            role: user.role,
          }));
          resolve(users);
        }
      });
    });
  }
}

module.exports = new UserGrpcClient();
