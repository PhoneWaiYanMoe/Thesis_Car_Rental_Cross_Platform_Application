// Backend/review-service/src/grpc/vehicle_grpc_client.js
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");

const PROTO_PATH = path.join(__dirname, "../../proto/vehicle.proto");

class VehicleGrpcClient {
  constructor() {
    try {
      const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      });

      const vehicleProto =
        grpc.loadPackageDefinition(packageDefinition).vehicle;

      const vehicleServiceUrl =
        process.env.VEHICLE_SERVICE_GRPC_URL || "localhost:50055";

      this.client = new vehicleProto.VehicleService(
        vehicleServiceUrl,
        grpc.credentials.createInsecure()
      );

      console.log(`📡 Vehicle gRPC client connected to ${vehicleServiceUrl}`);
    } catch (error) {
      console.error(
        "❌ Failed to initialize Vehicle gRPC client:",
        error.message
      );
      this.client = null;
    }
  }

  /**
   * Update vehicle rating after review
   */
  async updateVehicleRating(vehicleId, newAvgRating, newReviewCount) {
    if (!this.client) {
      console.warn("⚠️  Vehicle gRPC client not available");
      throw new Error("Vehicle service unavailable");
    }

    return new Promise((resolve, reject) => {
      this.client.UpdateVehicleRating(
        {
          vehicle_id: vehicleId,
          new_rating: newAvgRating,
          new_review_count: newReviewCount,
        },
        (error, response) => {
          if (error) {
            console.error("❌ gRPC updateVehicleRating error:", error);
            reject(error);
          } else {
            console.log(
              `✅ Updated vehicle ${vehicleId} rating to ${newAvgRating.toFixed(
                2
              )}`
            );
            resolve(response);
          }
        }
      );
    });
  }

  /**
   * Get vehicle info (for future use)
   */
  async getVehicleInfo(vehicleId) {
    if (!this.client) {
      console.warn("⚠️  Vehicle gRPC client not available");
      return null;
    }

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
}

module.exports = new VehicleGrpcClient();
