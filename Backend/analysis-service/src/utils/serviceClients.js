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

  async get(endpoint, { params = {}, token } = {}) {
    try {
      const response = await this.client.get(endpoint, {
        params,
        headers: token ? { Authorization: token } : {},
      });
      return response.data;
    } catch (error) {
      console.error(`Error calling ${endpoint}:`, error.message);
      throw error;
    }
  }

  async post(endpoint, data = {}, token) {
    try {
      const response = await this.client.post(endpoint, data, {
        headers: token ? { Authorization: token } : {},
      });
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
