const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");

// Load proto file
const PROTO_PATH = path.join(__dirname, "../../proto/location.proto");
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const locationProto = grpc.loadPackageDefinition(packageDefinition).location;

class LocationGrpcClient {
  constructor() {
    const locationServiceUrl =
      process.env.LOCATION_SERVICE_GRPC_URL || "localhost:50051";

    this.client = new locationProto.LocationService(
      locationServiceUrl,
      grpc.credentials.createInsecure()
    );

    console.log(`📡 Location gRPC client connected to ${locationServiceUrl}`);
  }

  // ==================== EXISTING METHODS ====================

  searchLocation(query, limit = 10) {
    return new Promise((resolve, reject) => {
      this.client.SearchLocation({ query, limit }, (error, response) => {
        if (error) {
          console.error("❌ gRPC searchLocation error:", error);
          reject(error);
        } else {
          resolve(response.results);
        }
      });
    });
  }

  reverseGeocode(latitude, longitude) {
    return new Promise((resolve, reject) => {
      this.client.ReverseGeocode({ latitude, longitude }, (error, response) => {
        if (error) {
          console.error("❌ gRPC reverseGeocode error:", error);
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  }

  getPlaceDetails(placeId) {
    return new Promise((resolve, reject) => {
      this.client.GetPlaceDetails({ place_id: placeId }, (error, response) => {
        if (error) {
          console.error("❌ gRPC getPlaceDetails error:", error);
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    return new Promise((resolve, reject) => {
      this.client.CalculateDistance(
        { lat1, lon1, lat2, lon2 },
        (error, response) => {
          if (error) {
            console.error("❌ gRPC calculateDistance error:", error);
            reject(error);
          } else {
            resolve(response);
          }
        }
      );
    });
  }

  checkServiceArea(latitude, longitude) {
    return new Promise((resolve, reject) => {
      this.client.CheckServiceArea(
        { latitude, longitude },
        (error, response) => {
          if (error) {
            console.error("❌ gRPC checkServiceArea error:", error);
            reject(error);
          } else {
            resolve(response);
          }
        }
      );
    });
  }

  // ==================== HISTORY METHODS ====================

  getSearchHistory(userId, limit = 10) {
    return new Promise((resolve, reject) => {
      this.client.GetSearchHistory(
        { user_id: userId, limit },
        (error, response) => {
          if (error) {
            console.error("❌ gRPC getSearchHistory error:", error);
            reject(error);
          } else {
            resolve(response.items);
          }
        }
      );
    });
  }

  saveToHistory(userId, displayName, shortName, subtitle, latitude, longitude) {
    return new Promise((resolve, reject) => {
      this.client.SaveToHistory(
        {
          user_id: userId,
          display_name: displayName,
          short_name: shortName,
          subtitle: subtitle,
          latitude,
          longitude,
        },
        (error, response) => {
          if (error) {
            console.error("❌ gRPC saveToHistory error:", error);
            reject(error);
          } else {
            resolve(response);
          }
        }
      );
    });
  }

  deleteFromHistory(userId, id) {
    return new Promise((resolve, reject) => {
      this.client.DeleteFromHistory(
        { user_id: userId, id },
        (error, response) => {
          if (error) {
            console.error("❌ gRPC deleteFromHistory error:", error);
            reject(error);
          } else {
            resolve(response);
          }
        }
      );
    });
  }

  clearHistory(userId) {
    return new Promise((resolve, reject) => {
      this.client.ClearHistory({ user_id: userId }, (error, response) => {
        if (error) {
          console.error("❌ gRPC clearHistory error:", error);
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  }
}

module.exports = new LocationGrpcClient();
