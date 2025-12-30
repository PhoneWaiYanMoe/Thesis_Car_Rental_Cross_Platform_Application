const axios = require('axios');
require('dotenv').config();

class UserServiceClient {
  constructor() {
    this.baseURL = process.env.USER_SERVICE_URL;
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * get user's devices (FCM tokens)
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of devices with FCM tokens
   */
  async getUserDevices(userId) {
    try {
      const response = await this.client.get(`/api/users/${userId}/devices`);
      
      if (response.data.success) {
        return response.data.devices; // Array of {id, fcmToken, platform}
      }
      
      return [];
    } catch (error) {
      console.error(`Failed to get devices for user ${userId}:`, error.message);
      return [];
    }
  }

  /**
   * Delete invalid device token
   * @param {string} deviceId - Device ID
   */
  async deleteDevice(deviceId) {
    try {
      await this.client.delete(`/api/devices/${deviceId}`);
      console.log(`✅ Deleted invalid device: ${deviceId}`);
    } catch (error) {
      console.error(`Failed to delete device ${deviceId}:`, error.message);
    }
  }

  /**
   * Get user details (email, name, etc.)
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>}
   */
  async getUserDetails(userId) {
    try {
      const response = await this.client.get(`/api/users/${userId}`);
      
      if (response.data.success) {
        return response.data.user;
      }
      
      return null;
    } catch (error) {
      console.error(`Failed to get user ${userId}:`, error.message);
      return null;
    }
  }
}

module.exports = new UserServiceClient();