// API Configuration
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export const API_ENDPOINTS = {
  // Auth Service (Port 3002)
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
    VERIFY_OTP: `${API_BASE_URL}/auth/verify-otp`,
    REFRESH_TOKEN: `${API_BASE_URL}/auth/refresh-token`,
  },

  // User Service (Port 3002)
  USERS: {
    BASE: `${API_BASE_URL}/users`,
    BY_ID: (id) => `${API_BASE_URL}/users/${id}`,
    UPDATE: (id) => `${API_BASE_URL}/users/${id}`,
    UPDATE_STATUS: (id) => `${API_BASE_URL}/users/${id}/status`,
  },

  // Vehicle Service (Port 3004)
  VEHICLES: {
    BASE: `${API_BASE_URL}/vehicles`,
    BY_ID: (id) => `${API_BASE_URL}/vehicles/${id}`,
    BY_OWNER: (ownerId) => `${API_BASE_URL}/vehicles/owner/${ownerId}`,
    UPDATE_STATUS: (id) => `${API_BASE_URL}/vehicles/${id}/status`,
  },

  // Booking Service (Port 3001)
  BOOKINGS: {
    BASE: `${API_BASE_URL}/bookings`,
    BY_ID: (id) => `${API_BASE_URL}/bookings/${id}`,
    BY_USER: (userId) => `${API_BASE_URL}/bookings/user/${userId}`,
    BY_OWNER: (ownerId) => `${API_BASE_URL}/bookings/owner/${ownerId}`,
    BY_VEHICLE: (vehicleId) => `${API_BASE_URL}/bookings/vehicle/${vehicleId}`,
  },

  // Request Service (Port 3007)
  REQUESTS: {
    BASE: `${API_BASE_URL}/requests`,
    BY_ID: (id) => `${API_BASE_URL}/requests/${id}`,
    APPROVE: (id) => `${API_BASE_URL}/requests/${id}/approve`,
    DENY: (id) => `${API_BASE_URL}/requests/${id}/deny`,
  },

  // Review Service (Port 3005)
  REVIEWS: {
    VEHICLE: (vehicleId) => `${API_BASE_URL}/reviews/vehicle/${vehicleId}`,
    OWNER: (ownerId) => `${API_BASE_URL}/reviews/owner/${ownerId}`,
    SUBMIT_VEHICLE: `${API_BASE_URL}/reviews/vehicle`,
    SUBMIT_OWNER: `${API_BASE_URL}/reviews/owner`,
  },

  // Payment Service (Port 3006)
  PAYMENTS: {
    TRANSACTIONS: `${API_BASE_URL}/payment/transactions`,
    DEPOSIT_INTENT: `${API_BASE_URL}/payment/deposit/intent`,
    FINAL_INTENT: `${API_BASE_URL}/payment/final/intent`,
  },

  // Analysis Service (Port 3010)
  ANALYTICS: {
    ADMIN_DASHBOARD: `${API_BASE_URL}/analytics/admin/dashboard`,
    ADMIN_BOOKINGS: `${API_BASE_URL}/analytics/admin/bookings`,
    ADMIN_REVENUE: `${API_BASE_URL}/analytics/admin/revenue`,
    ADMIN_USERS: `${API_BASE_URL}/analytics/admin/users`,
    ADMIN_STAFF_PERFORMANCE: `${API_BASE_URL}/analytics/admin/staff/performance`,
    OWNER_DASHBOARD: `${API_BASE_URL}/analytics/owner/dashboard`,
    OWNER_VEHICLE: (vehicleId) =>
      `${API_BASE_URL}/analytics/owner/vehicle/${vehicleId}`,
    OWNER_COMPARISON: `${API_BASE_URL}/analytics/owner/vehicles/comparison`,
  },
};

export default API_BASE_URL;
