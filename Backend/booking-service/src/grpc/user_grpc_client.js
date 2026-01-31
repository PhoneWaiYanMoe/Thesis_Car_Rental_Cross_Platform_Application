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

  getUserProfile(userId) {
    return new Promise((resolve, reject) => {
      this.client.GetUserProfile({ user_id: userId }, (error, response) => {
        if (error) {
          console.error("❌ gRPC getUserProfile error:", error);
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  }
}

module.exports = new UserGrpcClient();
