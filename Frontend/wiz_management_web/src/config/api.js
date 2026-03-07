// API Configuration

// Base URLs for each service
const ANALYSIS_SERVICE_URL = import.meta.env.VITE_ANALYSIS_SERVICE_URL || "";
const USER_SERVICE_URL = import.meta.env.VITE_USER_SERVICE_URL || "";
const VEHICLE_SERVICE_URL = import.meta.env.VITE_VEHICLE_SERVICE_URL || "";
const BOOKING_SERVICE_URL = import.meta.env.VITE_BOOKING_SERVICE_URL || "";
const REQUEST_SERVICE_URL = import.meta.env.VITE_REQUEST_SERVICE_URL || "";
const REVIEW_SERVICE_URL = import.meta.env.VITE_REVIEW_SERVICE_URL || "";
const PAYMENT_SERVICE_URL = import.meta.env.VITE_PAYMENT_SERVICE_URL || "";

export const API_ENDPOINTS = {
  // USER AUTHENTICATION - UPDATED
  AUTH: {
    LOGIN: `${USER_SERVICE_URL}/auth/login`,
    REGISTER: `${USER_SERVICE_URL}/auth/register`,
    VERIFY_EMAIL_OTP: `${USER_SERVICE_URL}/auth/verify-email-otp`,
    RESEND_OTP: `${USER_SERVICE_URL}/auth/resend-otp`,
    LOGOUT: `${USER_SERVICE_URL}/auth/logout`,
    REFRESH_TOKEN: `${USER_SERVICE_URL}/auth/refresh-token`,
    FORGOT_PASSWORD: `${USER_SERVICE_URL}/auth/forgot-password`,
  },

  // User Service - UPDATED
  USERS: {
    BASE: `${USER_SERVICE_URL}/users`,
    BY_ID: (id) => `${USER_SERVICE_URL}/users/${id}`,
    SUPPORT: `${USER_SERVICE_URL}/users/support`,
    OWNERS: `${USER_SERVICE_URL}/users/owners`,
    CUSTOMERS: `${USER_SERVICE_URL}/users/customers`,
    UPDATE_STATUS: (id) => `${USER_SERVICE_URL}/users/${id}/status`,
    CHANGE_ROLE: (id) => `${USER_SERVICE_URL}/users/${id}/role`,
    LICENSE_STATUS: (id) => `${USER_SERVICE_URL}/users/${id}/license-status`,
    UPLOAD_LICENSE: (id) => `${USER_SERVICE_URL}/users/${id}/upload-license`,
    ANALYTICS: {
      STATS: `${USER_SERVICE_URL}/analytics/users/stats`,
      GROWTH: `${USER_SERVICE_URL}/analytics/users/growth`,
    },
  },

  // Devices - NEW
  DEVICES: {
    BASE: `${USER_SERVICE_URL}/devices`,
    BY_ID: (id) => `${USER_SERVICE_URL}/devices/${id}`,
    USER_DEVICES: (userId) => `${USER_SERVICE_URL}/api/users/${userId}/devices`,
  },

  // Payment Methods - NEW
  PAYMENT_METHODS: {
    BASE: `${USER_SERVICE_URL}/payments/methods`,
    BY_ID: (id) => `${USER_SERVICE_URL}/payments/methods/${id}`,
    SET_DEFAULT: (id) =>
      `${USER_SERVICE_URL}/payments/methods/${id}/set-default`,
  },

  // Favorites - NEW
  FAVORITES: {
    BASE: `${USER_SERVICE_URL}/favorites`,
    BY_VEHICLE: (vehicleId) => `${USER_SERVICE_URL}/favorites/${vehicleId}`,
  },

  // Vehicle Service
  VEHICLES: {
    BASE: `${VEHICLE_SERVICE_URL}/vehicles`,
    BY_ID: (id) => `${VEHICLE_SERVICE_URL}/vehicles/${id}`,
    BY_OWNER: (ownerId) => `${VEHICLE_SERVICE_URL}/vehicles/owner/${ownerId}`,
    UPDATE_STATUS: (id) => `${VEHICLE_SERVICE_URL}/vehicles/${id}/status`,
  },

  // Booking Service
  BOOKINGS: {
    BASE: `${BOOKING_SERVICE_URL}/bookings`,
    ADMIN: `${BOOKING_SERVICE_URL}/admin/bookings`,
    BY_ID: (id) => `${BOOKING_SERVICE_URL}/bookings/${id}`,
    BY_USER: (userId) => `${BOOKING_SERVICE_URL}/bookings/user/${userId}`,
    BY_OWNER: (ownerId) => `${BOOKING_SERVICE_URL}/bookings/owner/${ownerId}`,
    BY_VEHICLE: (vehicleId) =>
      `${BOOKING_SERVICE_URL}/bookings/vehicle/${vehicleId}`,
  },

  // Request Service
  REQUESTS: {
    BASE: `${REQUEST_SERVICE_URL}/api/v1/requests`,
    BY_ID: (id) => `${REQUEST_SERVICE_URL}/api/v1/requests/${id}`,
    MY_REQUESTS: `${REQUEST_SERVICE_URL}/api/v1/requests/my-requests`,
    UPDATE_STATUS: (id) =>
      `${REQUEST_SERVICE_URL}/api/v1/requests/${id}/status`,
    APPROVE: (id) => `${REQUEST_SERVICE_URL}/api/v1/requests/${id}/approve`,
    DENY: (id) => `${REQUEST_SERVICE_URL}/api/v1/requests/${id}/deny`,
    PAUSE: (id) => `${REQUEST_SERVICE_URL}/api/v1/requests/${id}/pause`,
    RESUME: (id) => `${REQUEST_SERVICE_URL}/api/v1/requests/${id}/resume`,
    ADD_NOTE: (id) => `${REQUEST_SERVICE_URL}/api/v1/requests/${id}/notes`,
    METADATA: {
      CATEGORIES: `${REQUEST_SERVICE_URL}/api/v1/requests/metadata/categories`,
      STATUSES: `${REQUEST_SERVICE_URL}/api/v1/requests/metadata/statuses`,
    },
    ANALYTICS: {
      STATS: `${REQUEST_SERVICE_URL}/analytics/requests/stats`,
      STAFF_PERFORMANCE: `${REQUEST_SERVICE_URL}/analytics/staff/performance`,
    },
  },

  // Review Service
  REVIEWS: {
    BASE: `${REVIEW_SERVICE_URL}/reviews`,
    VEHICLE: (vehicleId) =>
      `${REVIEW_SERVICE_URL}/reviews/vehicle/${vehicleId}`,
    OWNER: (ownerId) => `${REVIEW_SERVICE_URL}/reviews/owner/${ownerId}`,
    SUBMIT_VEHICLE: `${REVIEW_SERVICE_URL}/reviews/vehicle`,
    SUBMIT_OWNER: `${REVIEW_SERVICE_URL}/reviews/owner`,
  },

  // Payment Service
  PAYMENTS: {
    TRANSACTIONS: `${PAYMENT_SERVICE_URL}/payment/transactions`,
    DEPOSIT_INTENT: `${PAYMENT_SERVICE_URL}/payment/deposit/intent`,
    FINAL_INTENT: `${PAYMENT_SERVICE_URL}/payment/final/intent`,
  },

  // Analysis Service
  ANALYTICS: {
    ADMIN_DASHBOARD: `${ANALYSIS_SERVICE_URL}/api/analytics/admin/dashboard`,
    ADMIN_BOOKINGS: `${ANALYSIS_SERVICE_URL}/api/analytics/admin/bookings`,
    ADMIN_REVENUE: `${ANALYSIS_SERVICE_URL}/api/analytics/admin/revenue`,
    ADMIN_USERS: `${ANALYSIS_SERVICE_URL}/api/analytics/admin/users`,
    ADMIN_STAFF_PERFORMANCE: `${ANALYSIS_SERVICE_URL}/api/analytics/admin/staff/performance`,
    OWNER_DASHBOARD: `${ANALYSIS_SERVICE_URL}/api/analytics/owner/dashboard`,
    OWNER_VEHICLE: (vehicleId) =>
      `${ANALYSIS_SERVICE_URL}/api/analytics/owner/vehicle/${vehicleId}`,
    OWNER_COMPARISON: `${ANALYSIS_SERVICE_URL}/api/analytics/owner/vehicles/comparison`,
  },
};

export default {
  ANALYSIS_SERVICE_URL,
  USER_SERVICE_URL,
  VEHICLE_SERVICE_URL,
  BOOKING_SERVICE_URL,
  REQUEST_SERVICE_URL,
  REVIEW_SERVICE_URL,
  PAYMENT_SERVICE_URL,
};
