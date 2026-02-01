const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
const USER_SERVICE_URL = import.meta.env.VITE_USER_SERVICE_URL;
const VEHICLE_SERVICE_URL = import.meta.env.VITE_VEHICLE_SERVICE_URL;
const BOOKING_SERVICE_URL = import.meta.env.VITE_BOOKING_SERVICE_URL;
const PAYMENT_SERVICE_URL = import.meta.env.VITE_PAYMENT_SERVICE_URL;
const REVIEW_SERVICE_URL = import.meta.env.VITE_REVIEW_SERVICE_URL;
const REQUEST_SERVICE_URL = import.meta.env.VITE_REQUEST_SERVICE_URL;
const ANALYSIS_SERVICE_URL = import.meta.env.VITE_ANALYSIS_SERVICE_URL;

export const API_ENDPOINTS = {
  // Auth Service (Port 3002)
  AUTH: {
    LOGIN: `${USER_SERVICE_URL}/auth/login`,
    REGISTER: `${USER_SERVICE_URL}/auth/register`,
    LOGOUT: `${USER_SERVICE_URL}/auth/logout`,
    VERIFY_OTP: `${USER_SERVICE_URL}/auth/verify-otp`,
    REFRESH_TOKEN: `${USER_SERVICE_URL}/auth/refresh-token`,
  },

  // User Service (Port 3002)
  USERS: {
    BASE: `${USER_SERVICE_URL}/users`,
    BY_ID: (id) => `${USER_SERVICE_URL}/users/${id}`,
    UPDATE: (id) => `${USER_SERVICE_URL}/users/${id}`,
    UPDATE_STATUS: (id) => `${USER_SERVICE_URL}/users/${id}/status`,
  },

  // Vehicle Service (Port 3004)
  VEHICLES: {
    BASE: `${VEHICLE_SERVICE_URL}/vehicles`,
    BY_ID: (id) => `${VEHICLE_SERVICE_URL}/vehicles/${id}`,
    BY_OWNER: (ownerId) => `${VEHICLE_SERVICE_URL}/vehicles/owner/${ownerId}`,
    UPDATE_STATUS: (id) => `${VEHICLE_SERVICE_URL}/vehicles/${id}/status`,
  },

  // Booking Service (Port 3001)
  BOOKINGS: {
    BASE: `${BOOKING_SERVICE_URL}/bookings`,
    BY_ID: (id) => `${BOOKING_SERVICE_URL}/bookings/${id}`,
    BY_USER: (userId) => `${BOOKING_SERVICE_URL}/bookings/user/${userId}`,
    BY_OWNER: (ownerId) => `${BOOKING_SERVICE_URL}/bookings/owner/${ownerId}`,
    BY_VEHICLE: (vehicleId) => `${BOOKING_SERVICE_URL}/bookings/vehicle/${vehicleId}`,
  },

  // Request Service (Port 3007)
  REQUESTS: {
    BASE: `${REQUEST_SERVICE_URL}/requests`,
    BY_ID: (id) => `${REQUEST_SERVICE_URL}/requests/${id}`,
    APPROVE: (id) => `${REQUEST_SERVICE_URL}/requests/${id}/approve`,
    DENY: (id) => `${REQUEST_SERVICE_URL}/requests/${id}/deny`,
  },

  // Review Service (Port 3005)
  REVIEWS: {
    VEHICLE: (vehicleId) => `${REVIEW_SERVICE_URL}/reviews/vehicle/${vehicleId}`,
    OWNER: (ownerId) => `${REVIEW_SERVICE_URL}/reviews/owner/${ownerId}`,
    SUBMIT_VEHICLE: `${REVIEW_SERVICE_URL}/reviews/vehicle`,
    SUBMIT_OWNER: `${REVIEW_SERVICE_URL}/reviews/owner`,
  },

  // Payment Service (Port 3006)
  PAYMENTS: {
    TRANSACTIONS: `${PAYMENT_SERVICE_URL}/payment/transactions`,
    DEPOSIT_INTENT: `${PAYMENT_SERVICE_URL}/payment/deposit/intent`,
    FINAL_INTENT: `${PAYMENT_SERVICE_URL}/payment/final/intent`,
  },

  // Analysis Service (Port 3010)
  ANALYTICS: {
    ADMIN_DASHBOARD: `${ANALYSIS_SERVICE_URL}/analytics/admin/dashboard`,
    ADMIN_BOOKINGS: `${ANALYSIS_SERVICE_URL}/analytics/admin/bookings`,
    ADMIN_REVENUE: `${ANALYSIS_SERVICE_URL}/analytics/admin/revenue`,
    ADMIN_USERS: `${ANALYSIS_SERVICE_URL}/analytics/admin/users`,
    ADMIN_STAFF_PERFORMANCE: `${ANALYSIS_SERVICE_URL}/analytics/admin/staff/performance`,
    OWNER_DASHBOARD: `${ANALYSIS_SERVICE_URL}/analytics/owner/dashboard`,
    OWNER_VEHICLE: (vehicleId) =>
      `${ANALYSIS_SERVICE_URL}/analytics/owner/vehicle/${vehicleId}`,
    OWNER_COMPARISON: `${ANALYSIS_SERVICE_URL}/analytics/owner/vehicles/comparison`,
  },
};

export default API_BASE_URL;
