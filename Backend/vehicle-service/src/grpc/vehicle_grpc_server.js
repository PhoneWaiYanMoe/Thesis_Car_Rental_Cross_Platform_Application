// Backend/vehicle-service/src/grpc/vehicle_grpc_server.js
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");
const pool = require("../config/database");

const PROTO_PATH = path.join(__dirname, "../../proto/vehicle.proto");
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const vehicleProto = grpc.loadPackageDefinition(packageDefinition).vehicle;

class VehicleGrpcServer {
  constructor() {
    this.server = new grpc.Server();
  }

  // ... existing methods (getVehicleInfo, getVehiclesInfo, checkVehicleOwnership) ...

  async getVehicleInfo(call, callback) {
    try {
      const { vehicle_id } = call.request;

      const result = await pool.query(
        `SELECT vehicle_id, owner_id, name, vehicle_type, price_per_day, 
                status, average_rating, total_rentals
         FROM vehicles 
         WHERE vehicle_id = $1`,
        [vehicle_id]
      );

      if (result.rows.length === 0) {
        return callback({
          code: grpc.status.NOT_FOUND,
          message: "Vehicle not found",
        });
      }

      const vehicle = result.rows[0];

      callback(null, {
        vehicle_id: vehicle.vehicle_id,
        owner_id: vehicle.owner_id,
        name: vehicle.name,
        vehicle_type: vehicle.vehicle_type,
        price_per_day: vehicle.price_per_day,
        status: vehicle.status,
        average_rating: parseFloat(vehicle.average_rating),
        total_rentals: vehicle.total_rentals,
      });
    } catch (error) {
      console.error("❌ gRPC getVehicleInfo error:", error);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message,
      });
    }
  }

  async getVehiclesInfo(call, callback) {
    try {
      const { vehicle_ids } = call.request;

      if (!vehicle_ids || vehicle_ids.length === 0) {
        return callback(null, { vehicles: [] });
      }

      const result = await pool.query(
        `SELECT vehicle_id, owner_id, name, vehicle_type, price_per_day, 
                status, average_rating, total_rentals
         FROM vehicles 
         WHERE vehicle_id = ANY($1)`,
        [vehicle_ids]
      );

      const vehicles = result.rows.map((vehicle) => ({
        vehicle_id: vehicle.vehicle_id,
        owner_id: vehicle.owner_id,
        name: vehicle.name,
        vehicle_type: vehicle.vehicle_type,
        price_per_day: vehicle.price_per_day,
        status: vehicle.status,
        average_rating: parseFloat(vehicle.average_rating),
        total_rentals: vehicle.total_rentals,
      }));

      callback(null, { vehicles });
    } catch (error) {
      console.error("❌ gRPC getVehiclesInfo error:", error);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message,
      });
    }
  }

  async checkVehicleOwnership(call, callback) {
    try {
      const { vehicle_id, user_id } = call.request;

      const result = await pool.query(
        "SELECT owner_id FROM vehicles WHERE vehicle_id = $1",
        [vehicle_id]
      );

      if (result.rows.length === 0) {
        return callback(null, {
          is_owner: false,
          message: "Vehicle not found",
        });
      }

      const isOwner = result.rows[0].owner_id === user_id;

      callback(null, {
        is_owner: isOwner,
        message: isOwner
          ? "User owns this vehicle"
          : "User does not own this vehicle",
      });
    } catch (error) {
      console.error("❌ gRPC checkVehicleOwnership error:", error);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message,
      });
    }
  }

  async updateVehicleRating(call, callback) {
    try {
      const { vehicle_id, new_rating, new_review_count } = call.request;

      await pool.query(
        `UPDATE vehicles 
         SET average_rating = $1,
             review_count = $2,
             updated_at = NOW()
         WHERE vehicle_id = $3`,
        [new_rating, new_review_count, vehicle_id]
      );

      console.log(`✅ Updated vehicle ${vehicle_id} rating to ${new_rating}`);

      callback(null, {
        success: true,
        message: "Vehicle rating updated",
        updated_rating: new_rating,
      });
    } catch (error) {
      console.error("❌ gRPC updateVehicleRating error:", error);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message,
      });
    }
  }

  // ✅ NEW: Check availability
  async checkAvailability(call, callback) {
    try {
      const { vehicle_id, start_date, end_date } = call.request;

      // Check vehicle exists and is active
      const vehicleResult = await pool.query(
        "SELECT vehicle_id, name FROM vehicles WHERE vehicle_id = $1 AND status = 'active'",
        [vehicle_id]
      );

      if (vehicleResult.rows.length === 0) {
        return callback(null, {
          is_available: false,
          message: "Vehicle not found or not available",
          unavailable_periods: [],
        });
      }

      // Check unavailability periods
      const unavailableResult = await pool.query(
        `SELECT start_date, end_date, reason 
         FROM vehicle_unavailability 
         WHERE vehicle_id = $1 
         AND (
           (start_date <= $2 AND end_date >= $2) OR
           (start_date <= $3 AND end_date >= $3) OR
           (start_date >= $2 AND end_date <= $3)
         )`,
        [vehicle_id, start_date, end_date]
      );

      const isAvailable = unavailableResult.rows.length === 0;

      callback(null, {
        is_available: isAvailable,
        message: isAvailable
          ? "Vehicle is available"
          : "Vehicle is not available for selected dates",
        unavailable_periods: unavailableResult.rows.map((period) => ({
          start_date: period.start_date.toISOString().split("T")[0],
          end_date: period.end_date.toISOString().split("T")[0],
          reason: period.reason || "Booked",
          booking_id: "",
        })),
      });
    } catch (error) {
      console.error("❌ gRPC checkAvailability error:", error);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message,
      });
    }
  }

  
  async syncUnavailability(call, callback) {
    try {
      const { vehicle_id, start_date, end_date, booking_id, action } =
        call.request;

      if (action === "add") {
        // Add unavailability period WITH booking_id
        await pool.query(
          `INSERT INTO vehicle_unavailability (vehicle_id, start_date, end_date, reason, booking_id)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT DO NOTHING`,
          [
            vehicle_id,
            start_date,
            end_date,
            `Booking: ${booking_id}`,
            booking_id,
          ]
        );

        console.log(
          `✅ Added unavailability for vehicle ${vehicle_id}: ${start_date} to ${end_date} (booking: ${booking_id})`
        );

        callback(null, {
          success: true,
          message: "Unavailability period added",
        });
      } else if (action === "remove") {
        // Remove unavailability period by booking_id (more reliable than dates)
        const result = await pool.query(
          `DELETE FROM vehicle_unavailability 
         WHERE vehicle_id = $1 
         AND booking_id = $2`,
          [vehicle_id, booking_id]
        );

        console.log(
          `✅ Removed unavailability for vehicle ${vehicle_id} (booking: ${booking_id}) - ${result.rowCount} rows affected`
        );

        callback(null, {
          success: true,
          message: "Unavailability period removed",
        });
      } else {
        callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: "Action must be 'add' or 'remove'",
        });
      }
    } catch (error) {
      console.error("❌ gRPC syncUnavailability error:", error);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message,
      });
    }
  }

  // ✅ NEW: Increment total rentals
  async incrementTotalRentals(call, callback) {
    try {
      const { vehicle_id } = call.request;

      const result = await pool.query(
        `UPDATE vehicles 
         SET total_rentals = total_rentals + 1,
             updated_at = NOW()
         WHERE vehicle_id = $1
         RETURNING total_rentals`,
        [vehicle_id]
      );

      if (result.rows.length === 0) {
        return callback({
          code: grpc.status.NOT_FOUND,
          message: "Vehicle not found",
        });
      }

      const newTotal = result.rows[0].total_rentals;

      console.log(
        `✅ Incremented total rentals for vehicle ${vehicle_id} to ${newTotal}`
      );

      callback(null, {
        success: true,
        message: "Total rentals incremented",
        new_total: newTotal,
      });
    } catch (error) {
      console.error("❌ gRPC incrementTotalRentals error:", error);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message,
      });
    }
  }

  start(port = 50055) {
    this.server.addService(vehicleProto.VehicleService.service, {
      GetVehicleInfo: this.getVehicleInfo.bind(this),
      GetVehiclesInfo: this.getVehiclesInfo.bind(this),
      CheckVehicleOwnership: this.checkVehicleOwnership.bind(this),
      UpdateVehicleRating: this.updateVehicleRating.bind(this),
      CheckAvailability: this.checkAvailability.bind(this),
      SyncUnavailability: this.syncUnavailability.bind(this),
      IncrementTotalRentals: this.incrementTotalRentals.bind(this),
    });

    this.server.bindAsync(
      `0.0.0.0:${port}`,
      grpc.ServerCredentials.createInsecure(),
      (err, port) => {
        if (err) {
          console.error("❌ Failed to start gRPC server:", err);
          return;
        }
        console.log(`✅ Vehicle gRPC server running on port ${port}`);
      }
    );
  }

  stop() {
    this.server.tryShutdown(() => {
      console.log("gRPC server stopped");
    });
  }
}

module.exports = VehicleGrpcServer;
