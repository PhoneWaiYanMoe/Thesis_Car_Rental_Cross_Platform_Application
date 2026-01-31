import axios from "axios";
import { authService } from "./auth";

// Create axios instance
const apiClient = axios.create({
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Server responded with error status
      const { status } = error.response;

      if (status === 401) {
        // Unauthorized - clear auth and redirect to login
        authService.logout();
        window.location.href = "/login";
      } else if (status === 403) {
        // Forbidden - insufficient permissions
        console.error("Access forbidden:", error.response.data);
      } else if (status === 404) {
        // Not found
        console.error("Resource not found:", error.response.data);
      } else if (status >= 500) {
        // Server error
        console.error("Server error:", error.response.data);
      }
    } else if (error.request) {
      // Request made but no response
      console.error("No response from server:", error.request);
    } else {
      // Error setting up request
      console.error("Request error:", error.message);
    }

    return Promise.reject(error);
  },
);

export default apiClient;
