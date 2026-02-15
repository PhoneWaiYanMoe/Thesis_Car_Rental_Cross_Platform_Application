import { useState } from "react";
import apiClient from "../utils/apiClient";
import { API_ENDPOINTS } from "../config/api";

/**
 * Custom hook for Request Service operations
 * Handles customer support requests
 */
export const useRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all requests
  const fetchRequests = async (filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      // Add filters to query params
      if (filters.status) params.append("status", filters.status);
      if (filters.category) params.append("category", filters.category);
      if (filters.handledBy) params.append("handledBy", filters.handledBy);
      if (filters.handledByMe) params.append("handledByMe", filters.handledByMe);
      if (filters.page) params.append("page", filters.page);
      if (filters.limit) params.append("limit", filters.limit);
      if (filters.search) params.append("search", filters.search);
      if (filters.searchBy) params.append("searchBy", filters.searchBy);

      const url = `${API_ENDPOINTS.REQUESTS.BASE}${params.toString() ? "?" + params.toString() : ""}`;
      const response = await apiClient.get(url);

      // Map backend response to frontend format
      const mappedRequests = response.data.requests.map((request) => ({
        id: request.id,
        title: request.title,
        description: request.description,
        priority: request.priority,
        category: request.category,
        userId: request.user_id,
        userEmail: request.user_email,
        status: request.status,
        customerId: request.customerId,
        ownerId: request.owner_id,
        vehicleId: request.vehicleId,
        bookingId: request.bookingId,
        // Handler info
        handledById: request.handled_by,
        handledAt: request.handled_at,
        // Photos
        photos: request.attachmentIds || [],
        // Notes
        notes: request.notes || [],
        // Timestamps
        createdAt: request.created_at,
        updatedAt: request.updated_at,
      }));

      setRequests(mappedRequests);
      return {
        requests: mappedRequests,
        pagination: response.data.pagination,
      };
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch requests");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get request by ID
  const getRequestById = async (requestId) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get(
        API_ENDPOINTS.REQUESTS.BY_ID(requestId),
      );

      const request = response.data.request || response.data;
      return {
        id: request.id,
        title: request.title,
        description: request.description,
        category: request.category,
        status: request.status,
        priority: request.priority,
        userId: request.user_id,
        userEmail: request.user_email,
        customerId: request.customer_id,
        vehicleId: request.vehicle_id,
        bookingId: request.booking_id,
        ownerId: request.owner_id,
        handledById: request.handled_by,
        handledAt: request.handled_at,
        photos: request.attachmentIds || [],
        actions: request.actions || [],
        createdAt: request.created_at,
        updatedAt: request.updated_at,
      };
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch request");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update request status
  const updateRequestStatus = async (requestId, status, handledBy = null) => {
    setLoading(true);
    setError(null);

    try {
      const payload = { status };
      if (handledBy) payload.handledBy = handledBy;

      const response = await apiClient.patch(
        API_ENDPOINTS.REQUESTS.UPDATE_STATUS(requestId),
        payload,
      );

      // Update local state
      setRequests((prev) =>
        prev.map((request) =>
          request.id === requestId
            ? {
                ...request,
                status,
                handledBy: handledBy || request.handledBy,
                handledAt: new Date().toISOString(),
              }
            : request,
        ),
      );

      return response.data;
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to update request status",
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Approve request
  const approveRequest = async (requestId, handledBy) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post(
        API_ENDPOINTS.REQUESTS.APPROVE(requestId),
        { handledBy },
      );

      // Update local state
      setRequests((prev) =>
        prev.map((request) =>
          request.id === requestId
            ? {
                ...request,
                status: "approved",
                handledBy,
                handledAt: new Date().toISOString(),
              }
            : request,
        ),
      );

      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to approve request");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Deny request
  const denyRequest = async (requestId, handledBy, reason = null) => {
    setLoading(true);
    setError(null);

    try {
      const payload = { handledBy };
      if (reason) payload.reason = reason;

      const response = await apiClient.post(
        API_ENDPOINTS.REQUESTS.DENY(requestId),
        payload,
      );

      // Update local state
      setRequests((prev) =>
        prev.map((request) =>
          request.id === requestId
            ? {
                ...request,
                status: "denied",
                handledBy,
                handledAt: new Date().toISOString(),
              }
            : request,
        ),
      );

      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to deny request");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Add note to request
  const addNote = async (requestId, note) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post(
        API_ENDPOINTS.REQUESTS.ADD_NOTE(requestId),
        { note },
      );

      // Update local state
      setRequests((prev) =>
        prev.map((request) =>
          request.id === requestId
            ? {
                ...request,
                notes: [...(request.notes || []), response.data.note],
              }
            : request,
        ),
      );

      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add note");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get request categories
  const getCategories = async () => {
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.REQUESTS.METADATA.CATEGORIES,
      );
      return response.data.categories || [];
    } catch (err) {
      throw err;
    }
  };

  // Get request statuses
  const getStatuses = async () => {
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.REQUESTS.METADATA.STATUSES,
      );
      return response.data.statuses || [];
    } catch (err) {
      throw err;
    }
  };

  // Get request statistics
  const getRequestStats = async () => {
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.REQUESTS.ANALYTICS.STATS,
      );
      return response.data;
    } catch (err) {
      throw err;
    }
  };

  // Get staff performance
  const getStaffPerformance = async () => {
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.REQUESTS.ANALYTICS.STAFF_PERFORMANCE,
      );
      return response.data.staffPerformance || [];
    } catch (err) {
      throw err;
    }
  };

  return {
    requests,
    loading,
    error,
    fetchRequests,
    getRequestById,
    updateRequestStatus,
    approveRequest,
    denyRequest,
    addNote,
    getCategories,
    getStatuses,
    getRequestStats,
    getStaffPerformance,
  };
};
