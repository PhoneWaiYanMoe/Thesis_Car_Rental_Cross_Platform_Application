// Backend/payment-service/src/grpc/vehicle_grpc_client.js
// ✅ NEW: Vehicle gRPC client for payment service (to add unavailability after payment)

const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");

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
      grpc.credentials.createInsecure()
    );

    console.log(`📡 Vehicle gRPC client connected to ${vehicleServiceUrl}`);
  }

  /**
   * Sync vehicle unavailability (add/remove)
   */
  syncUnavailability(vehicleId, startDate, endDate, bookingId, action = "add") {
    return new Promise((resolve, reject) => {
      this.client.SyncUnavailability(
        {
          vehicle_id: vehicleId,
          start_date: startDate,
          end_date: endDate,
          booking_id: bookingId,
          action: action, // 'add' or 'remove'
        },
        (error, response) => {
          if (error) {
            console.error("❌ gRPC syncUnavailability error:", error);
            reject(error);
          } else {
            console.log(`✅ Vehicle unavailability ${action}: ${vehicleId}`);
            resolve(response);
          }
        }
      );
    });
  }
}

module.exports = new VehicleGrpcClient();
