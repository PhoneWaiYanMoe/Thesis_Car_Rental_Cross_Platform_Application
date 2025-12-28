// Backend/booking-service/src/grpc/vehicle_grpc_client.js
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

  // Get vehicle basic info
  getVehicleInfo(vehicleId) {
    return new Promise((resolve, reject) => {
      this.client.GetVehicleInfo(
        { vehicle_id: vehicleId },
        (error, response) => {
          if (error) {
            console.error("❌ gRPC getVehicleInfo error:", error);
            reject(error);
          } else {
            resolve(response);
          }
        }
      );
    });
  }

  // Get multiple vehicles info
  getVehiclesInfo(vehicleIds) {
    return new Promise((resolve, reject) => {
      this.client.GetVehiclesInfo(
        { vehicle_ids: vehicleIds },
        (error, response) => {
          if (error) {
            console.error("❌ gRPC getVehiclesInfo error:", error);
            reject(error);
          } else {
            resolve(response.vehicles);
          }
        }
      );
    });
  }

  // Check if user owns vehicle
  checkVehicleOwnership(vehicleId, userId) {
    return new Promise((resolve, reject) => {
      this.client.CheckVehicleOwnership(
        { vehicle_id: vehicleId, user_id: userId },
        (error, response) => {
          if (error) {
            console.error("❌ gRPC checkVehicleOwnership error:", error);
            reject(error);
          } else {
            resolve(response);
          }
        }
      );
    });
  }

  // ✅ NEW: Check vehicle availability for dates
  checkAvailability(vehicleId, startDate, endDate) {
    return new Promise((resolve, reject) => {
      this.client.CheckAvailability(
        {
          vehicle_id: vehicleId,
          start_date: startDate,
          end_date: endDate,
        },
        (error, response) => {
          if (error) {
            console.error("❌ gRPC checkAvailability error:", error);
            reject(error);
          } else {
            resolve(response);
          }
        }
      );
    });
  }

  // ✅ NEW: Sync booking to vehicle unavailability
  syncUnavailability(vehicleId, startDate, endDate, bookingId, action) {
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
            resolve(response);
          }
        }
      );
    });
  }

  // ✅ NEW: Increment total rentals
  incrementTotalRentals(vehicleId) {
    return new Promise((resolve, reject) => {
      this.client.IncrementTotalRentals(
        { vehicle_id: vehicleId },
        (error, response) => {
          if (error) {
            console.error("❌ gRPC incrementTotalRentals error:", error);
            reject(error);
          } else {
            resolve(response);
          }
        }
      );
    });
  }
}

module.exports = new VehicleGrpcClient();
