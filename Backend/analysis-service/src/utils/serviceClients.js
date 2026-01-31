const axios = require("axios");

class ServiceClient {
  constructor(baseURL) {
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  setAuthToken(token) {
    this.client.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }

  async get(endpoint, params = {}) {
    try {
      const response = await this.client.get(endpoint, { params });
      return response.data;
    } catch (error) {
      console.error(`Error calling ${endpoint}:`, error.message);
      throw error;
    }
  }

  async post(endpoint, data = {}) {
    try {
      const response = await this.client.post(endpoint, data);
      return response.data;
    } catch (error) {
      console.error(`Error calling ${endpoint}:`, error.message);
      throw error;
    }
  }
}

// Initialize service clients
const bookingService = new ServiceClient(process.env.BOOKING_SERVICE_URL);
const userService = new ServiceClient(process.env.USER_SERVICE_URL);
const vehicleService = new ServiceClient(process.env.VEHICLE_SERVICE_URL);
const paymentService = new ServiceClient(process.env.PAYMENT_SERVICE_URL);
const reviewService = new ServiceClient(process.env.REVIEW_SERVICE_URL);
const requestService = new ServiceClient(process.env.REQUEST_SERVICE_URL);

module.exports = {
  bookingService,
  userService,
  vehicleService,
  paymentService,
  reviewService,
  requestService,
};
