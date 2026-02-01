// src/clients/vehicle_http_client.js
const axios = require("axios");

class VehicleHttpClient {
  constructor() {
    this.baseURL = process.env.VEHICLE_SERVICE_URL || "http://localhost:3002";
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 5000,
    });

    console.log(`🔗 Vehicle HTTP client connected to ${this.baseURL}`);
  }

  async getVehiclesByOwner(ownerId, authHeader) {
    try {
      console.log(`🚗 Fetching vehicles for owner: ${ownerId}`);

      const response = await this.client.get(
        `/vehicles/owner/${ownerId}/vehicles`,
        {
          headers: {
            Authorization: authHeader,
          },
        },
      );

      return response.data?.vehicles || [];
    } catch (error) {
      console.error(`❌ Error fetching vehicles: ${error.message}`);
      throw error;
    }
  }

  async getVehicleById(vehicleId, authHeader) {
    try {
      const response = await this.client.get(`/vehicles/${vehicleId}`, {
        headers: {
          Authorization: authHeader,
        },
      });
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching vehicle ${vehicleId}: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new VehicleHttpClient();
