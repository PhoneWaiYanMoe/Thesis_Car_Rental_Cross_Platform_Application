import { useState } from "react";
import apiClient from "../utils/apiClient";
import { API_ENDPOINTS } from "../config/api";

/**
 * Custom hook for Dashboard Analytics
 * Fetches aggregated statistics for admin dashboard
 */
export const useDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch admin dashboard data
  const fetchDashboardStats = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get(
        API_ENDPOINTS.ANALYTICS.ADMIN_DASHBOARD,
      );

      setStats(response.data);
      return response.data;
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to fetch dashboard stats",
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch booking analytics
  const fetchBookingAnalytics = async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.period) params.append("period", filters.period); // 'day', 'week', 'month', 'year'
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);

      const url = `${API_ENDPOINTS.ANALYTICS.ADMIN_BOOKINGS}${params.toString() ? "?" + params.toString() : ""}`;
      const response = await apiClient.get(url);

      return response.data;
    } catch (err) {
      throw err;
    }
  };

  // Fetch revenue analytics
  const fetchRevenueAnalytics = async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.period) params.append("period", filters.period);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);

      const url = `${API_ENDPOINTS.ANALYTICS.ADMIN_REVENUE}${params.toString() ? "?" + params.toString() : ""}`;
      const response = await apiClient.get(url);

      return response.data;
    } catch (err) {
      throw err;
    }
  };

  // Fetch user analytics
  const fetchUserAnalytics = async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.period) params.append("period", filters.period);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);

      const url = `${API_ENDPOINTS.ANALYTICS.ADMIN_USERS}${params.toString() ? "?" + params.toString() : ""}`;
      const response = await apiClient.get(url);

      return response.data;
    } catch (err) {
      throw err;
    }
  };

  // Fetch staff performance analytics
  const fetchStaffPerformance = async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.period) params.append("period", filters.period);
      if (filters.staffId) params.append("staffId", filters.staffId);

      const url = `${API_ENDPOINTS.ANALYTICS.ADMIN_STAFF_PERFORMANCE}${params.toString() ? "?" + params.toString() : ""}`;
      const response = await apiClient.get(url);

      return response.data;
    } catch (err) {
      throw err;
    }
  };

  return {
    stats,
    loading,
    error,
    fetchDashboardStats,
    fetchBookingAnalytics,
    fetchRevenueAnalytics,
    fetchUserAnalytics,
    fetchStaffPerformance,
  };
};
