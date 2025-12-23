const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");
const pool = require("../config/database");

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

class UserGrpcServer {
  constructor() {
    this.server = new grpc.Server();
  }

  async getUserProfile(call, callback) {
    try {
      const { user_id } = call.request;

      const result = await pool.query(
        `SELECT user_id, email, full_name, avatar_url, role 
         FROM users 
         WHERE user_id = $1`,
        [user_id]
      );

      if (result.rows.length === 0) {
        return callback({
          code: grpc.status.NOT_FOUND,
          message: "User not found",
        });
      }

      const user = result.rows[0];

      callback(null, {
        user_id: user.user_id,
        email: user.email,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        role: user.role,
      });
    } catch (error) {
      console.error("❌ gRPC getUserProfile error:", error);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message,
      });
    }
  }

  async getUserProfiles(call, callback) {
    try {
      const { user_ids } = call.request;

      if (!user_ids || user_ids.length === 0) {
        return callback(null, { users: [] });
      }

      const result = await pool.query(
        `SELECT user_id, email, full_name, avatar_url, role 
         FROM users 
         WHERE user_id = ANY($1)`,
        [user_ids]
      );

      const users = result.rows.map((user) => ({
        user_id: user.user_id,
        email: user.email,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        role: user.role,
      }));

      callback(null, { users });
    } catch (error) {
      console.error("❌ gRPC getUserProfiles error:", error);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message,
      });
    }
  }

  start(port = 50053) {
    this.server.addService(userProto.UserService.service, {
      GetUserProfile: this.getUserProfile.bind(this),
      GetUserProfiles: this.getUserProfiles.bind(this),
    });

    this.server.bindAsync(
      `0.0.0.0:${port}`,
      grpc.ServerCredentials.createInsecure(),
      (err, port) => {
        if (err) {
          console.error("❌ Failed to start gRPC server:", err);
          return;
        }
        console.log(`✅ User gRPC server running on port ${port}`);
      }
    );
  }

  stop() {
    this.server.tryShutdown(() => {
      console.log("gRPC server stopped");
    });
  }
}

module.exports = UserGrpcServer;
