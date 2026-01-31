import { useState, useEffect } from "react";
import apiClient from "../utils/apiClient";
import { API_ENDPOINTS } from "../config/api";

/**
 * Custom hook for fetching admin dashboard analytics
 */
export const useAdminDashboard = (timeRange = "30d") => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(
          API_ENDPOINTS.ANALYTICS.ADMIN_DASHBOARD,
          {
            params: { timeRange },
          },
        );
        setData(response.data.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching admin dashboard:", err);
        setError(
          err.response?.data?.message || "Failed to fetch dashboard data",
        );
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);

  return { data, loading, error };
};

/**
 * Custom hook for fetching owner dashboard analytics
 */
export const useOwnerDashboard = (timeRange = "30d") => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(
          API_ENDPOINTS.ANALYTICS.OWNER_DASHBOARD,
          {
            params: { timeRange },
          },
        );
        setData(response.data.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching owner dashboard:", err);
        setError(
          err.response?.data?.message || "Failed to fetch dashboard data",
        );
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);

  return { data, loading, error };
};

/**
 * Custom hook for fetching users
 */
export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(API_ENDPOINTS.USERS.BASE);
      setUsers(response.data.users || response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(err.response?.data?.message || "Failed to fetch users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateUserStatus = async (userId, status) => {
    try {
      await apiClient.patch(API_ENDPOINTS.USERS.UPDATE_STATUS(userId), {
        status,
      });
      // Refresh users list
      await fetchUsers();
    } catch (err) {
      console.error("Error updating user status:", err);
      throw err;
    }
  };

  return { users, loading, error, updateUserStatus, refetch: fetchUsers };
};

/**
 * Custom hook for fetching vehicles
 */
export const useVehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(API_ENDPOINTS.VEHICLES.BASE);
      setVehicles(response.data.vehicles || response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching vehicles:", err);
      setError(err.response?.data?.message || "Failed to fetch vehicles");
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const updateVehicleStatus = async (vehicleId, status) => {
    try {
      await apiClient.patch(API_ENDPOINTS.VEHICLES.UPDATE_STATUS(vehicleId), {
        status,
      });
      // Refresh vehicles list
      await fetchVehicles();
    } catch (err) {
      console.error("Error updating vehicle status:", err);
      throw err;
    }
  };

  return {
    vehicles,
    loading,
    error,
    updateVehicleStatus,
    refetch: fetchVehicles,
  };
};

/**
 * Custom hook for fetching bookings
 */
export const useBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(API_ENDPOINTS.BOOKINGS.BASE);
      setBookings(response.data.bookings || response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setError(err.response?.data?.message || "Failed to fetch bookings");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  return { bookings, loading, error, refetch: fetchBookings };
};

/**
 * Custom hook for fetching requests
 */
export const useRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(API_ENDPOINTS.REQUESTS.BASE);
      setRequests(response.data.requests || response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching requests:", err);
      setError(err.response?.data?.message || "Failed to fetch requests");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const approveRequest = async (requestId) => {
    try {
      await apiClient.post(API_ENDPOINTS.REQUESTS.APPROVE(requestId));
      await fetchRequests();
    } catch (err) {
      console.error("Error approving request:", err);
      throw err;
    }
  };

  const denyRequest = async (requestId, reason) => {
    try {
      await apiClient.post(API_ENDPOINTS.REQUESTS.DENY(requestId), { reason });
      await fetchRequests();
    } catch (err) {
      console.error("Error denying request:", err);
      throw err;
    }
  };

  return {
    requests,
    loading,
    error,
    approveRequest,
    denyRequest,
    refetch: fetchRequests,
  };
};

/**
 * Custom hook for fetching reviews for a vehicle
 */
export const useVehicleReviews = (vehicleId) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!vehicleId) return;

    const fetchReviews = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(
          API_ENDPOINTS.REVIEWS.VEHICLE(vehicleId),
        );
        setReviews(response.data.reviews || []);
        setError(null);
      } catch (err) {
        console.error("Error fetching reviews:", err);
        setError(err.response?.data?.message || "Failed to fetch reviews");
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [vehicleId]);

  return { reviews, loading, error };
};
