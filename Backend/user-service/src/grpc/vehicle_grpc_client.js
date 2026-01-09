// Backend/user-service/src/grpc/vehicle_grpc_client.js
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");

// Load proto file
const PROTO_PATH = path.join(__dirname, "../../proto/vehicle.proto");
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const vehicleProto = grpc.loadPackageDefinition(packageDefinition).vehicle;

class VehicleGrpcClient {
  constructor() {
    const vehicleServiceUrl =
      process.env.VEHICLE_SERVICE_GRPC_URL || "localhost:50055";

    this.client = new vehicleProto.VehicleService(
      vehicleServiceUrl,
      grpc.credentials.createInsecure(),
      {
        "grpc.keepalive_time_ms": 30000,
        "grpc.keepalive_timeout_ms": 10000,
        "grpc.keepalive_permit_without_calls": 1,
        "grpc.http2.max_pings_without_data": 0,
        "grpc.http2.min_time_between_pings_ms": 10000,
      }
    );

    console.log(`📡 Vehicle gRPC client connected to ${vehicleServiceUrl}`);
  }

  /**
   * Get single vehicle info
   */
  getVehicleInfo(vehicleId) {
    return new Promise((resolve, reject) => {
      const deadline = new Date();
      deadline.setSeconds(deadline.getSeconds() + 5);

      this.client.GetVehicleInfo(
        { vehicle_id: vehicleId },
        { deadline },
        (error, response) => {
          if (error) {
            console.error("❌ gRPC getVehicleInfo error:", error.message);
            reject(error);
          } else {
            resolve(response);
          }
        }
      );
    });
  }

  /**
   * Get multiple vehicles info (batch)
   */
  getVehiclesInfo(vehicleIds) {
    return new Promise((resolve, reject) => {
      const deadline = new Date();
      deadline.setSeconds(deadline.getSeconds() + 5);

      this.client.GetVehiclesInfo(
        { vehicle_ids: vehicleIds },
        { deadline },
        (error, response) => {
          if (error) {
            console.error("❌ gRPC getVehiclesInfo error:", error.message);
            reject(error);
          } else {
            resolve(response.vehicles || []);
          }
        }
      );
    });
  }
}

module.exports = new VehicleGrpcClient();
