import { useState, useEffect } from "react";
import apiClient from "../utils/apiClient";
import { API_ENDPOINTS } from "../config/api";

/**
 * Custom hook for User Service operations
 * Handles fetching, filtering, and managing users
 */
export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all users
  const fetchUsers = async (filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      // Add filters to query params
      if (filters.role) params.append("role", filters.role);
      if (filters.status) params.append("status", filters.status);
      if (filters.page) params.append("page", filters.page);
      if (filters.limit) params.append("limit", filters.limit);
      if (filters.search) params.append("search", filters.search);
      if (filters.searchBy) params.append("searchBy", filters.searchBy);

      const url = `${API_ENDPOINTS.USERS.BASE}${params.toString() ? "?" + params.toString() : ""}`;
      const response = await apiClient.get(url);

      // Map backend response to frontend format
      const mappedUsers = response.data.users.map((user) => ({
        id: user.user_id,
        full_name: user.full_name,
        name: user.full_name,
        email: user.email,
        phone: user.phone,
        type: user.role, // Backend uses 'role', frontend uses 'type'
        role: user.role,
        status: user.status,
        avatarUrl: user.avatar_url,
        joinedDate: user.created_at,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        // Additional stats will be fetched separately if needed
        totalBookings: 0,
        totalCars: 0,
        totalRentals: 0,
      }));

      setUsers(mappedUsers);
      return {
        users: mappedUsers,
        pagination: response.data.pagination,
      };
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch users");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get user by ID
  const getUserById = async (userId) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get(API_ENDPOINTS.USERS.BY_ID(userId));

      const user = response.data.user;
      return {
        id: user.user_id,
        full_name: user.full_name,
        name: user.full_name,
        email: user.email,
        phone: user.phone,
        type: user.role,
        role: user.role,
        status: user.status,
        avatarUrl: user.avatar_url,
        joinedDate: user.created_at,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        // License info if available
        licenseStatus: user.license_status,
        licenseInfo: user.license_url,
      };
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch user");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update user status (admin only)
  const updateUserStatus = async (userId, status) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.put(
        API_ENDPOINTS.USERS.UPDATE_STATUS(userId),
        { status },
      );

      // Update local state
      setUsers((prev) =>
        prev.map((user) => (user.id === userId ? { ...user, status } : user)),
      );

      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update user status");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Change user role (admin only)
  const changeUserRole = async (userId, role) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.put(
        API_ENDPOINTS.USERS.CHANGE_ROLE(userId),
        { role },
      );

      // Update local state
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, role, type: role } : user,
        ),
      );

      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to change user role");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get support users
  const getSupportUsers = async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.USERS.SUPPORT);
      return response.data.users.map((user) => ({
        id: user.id,
        full_name: user.fullName,
        name: user.fullName,
        username: user.email,
        email: user.email,
        phone: user.phone,
        type: user.role,
        role: user.role,
        status: user.status,
        avatarUrl: user.avatarUrl,
        joinedDate: user.createdAt,
      }));
    } catch (err) {
      throw err;
    }
  };

  // Get owner users
  const getOwnerUsers = async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.USERS.OWNERS);
      return response.data.users.map((user) => ({
        id: user.id,
        full_name: user.fullName,
        name: user.fullName,
        email: user.email,
        phone: user.phone,
        type: user.role,
        role: user.role,
        status: user.status,
        avatarUrl: user.avatarUrl,
        joinedDate: user.createdAt,
      }));
    } catch (err) {
      throw err;
    }
  };

  // Get customer users
  const getCustomerUsers = async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.USERS.CUSTOMERS);
      return response.data.users.map((user) => ({
        id: user.id,
        full_name: user.fullName,
        name: user.fullName,
        email: user.email,
        phone: user.phone,
        type: user.role,
        role: user.role,
        status: user.status,
        avatarUrl: user.avatarUrl,
        joinedDate: user.createdAt,
      }));
    } catch (err) {
      throw err;
    }
  };

  // Get user analytics stats
  const getUserStats = async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.USERS.ANALYTICS.STATS);
      return response.data;
    } catch (err) {
      throw err;
    }
  };

  return {
    users,
    loading,
    error,
    fetchUsers,
    getUserById,
    updateUserStatus,
    changeUserRole,
    getSupportUsers,
    getOwnerUsers,
    getCustomerUsers,
    getUserStats,
  };
};
