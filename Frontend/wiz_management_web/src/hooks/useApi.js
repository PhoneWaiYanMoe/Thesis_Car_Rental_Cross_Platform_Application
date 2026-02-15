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
          { params: { timeRange } },
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
 * Custom hook for fetching users - UPDATED for User Service response format
 */
export const useUsers = (filters = {}) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  const fetchUsers = async (params = {}) => {
    try {
      setLoading(true);
      const response = await apiClient.get(API_ENDPOINTS.USERS.BASE, {
        params: { ...filters, ...params },
      });

      // User Service returns: { users: [...], pagination: {...} }
      const userData =
        response.data.users || response.data.data || response.data;
      setUsers(Array.isArray(userData) ? userData : []);

      if (response.data.pagination) {
        setPagination(response.data.pagination);
      }

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

  const updateUserStatus = async (userId, status, reason) => {
    try {
      await apiClient.put(API_ENDPOINTS.USERS.UPDATE_STATUS(userId), {
        status,
        reason,
      });
      await fetchUsers();
      return { success: true };
    } catch (err) {
      console.error("Error updating user status:", err);
      return {
        success: false,
        error: err.response?.data?.message || "Update failed",
      };
    }
  };

  const changeUserRole = async (userId, newRole) => {
    try {
      await apiClient.put(API_ENDPOINTS.USERS.CHANGE_ROLE(userId), {
        newRole,
      });
      await fetchUsers();
      return { success: true };
    } catch (err) {
      console.error("Error changing user role:", err);
      return {
        success: false,
        error: err.response?.data?.message || "Role change failed",
      };
    }
  };

  return {
    users,
    loading,
    error,
    pagination,
    updateUserStatus,
    changeUserRole,
    refetch: fetchUsers,
  };
};

/**
 * Custom hook for fetching a single user - UPDATED
 */
export const useUser = (userId) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;

    const fetchUser = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(API_ENDPOINTS.USERS.BY_ID(userId));

        // User Service returns: { user: {...} }
        setUser(response.data.user || response.data.data || response.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching user:", err);
        setError(err.response?.data?.message || "Failed to fetch user");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  return { user, loading, error };
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
      const vehicleData =
        response.data.vehicles || response.data.data || response.data;
      setVehicles(Array.isArray(vehicleData) ? vehicleData : []);
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
      await fetchVehicles();
      return { success: true };
    } catch (err) {
      console.error("Error updating vehicle status:", err);
      return {
        success: false,
        error: err.response?.data?.message || "Update failed",
      };
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
 * Custom hook for fetching a single vehicle
 */
export const useVehicle = (vehicleId) => {
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!vehicleId) return;

    const fetchVehicle = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(
          API_ENDPOINTS.VEHICLES.BY_ID(vehicleId),
        );
        setVehicle(
          response.data.vehicle || response.data.data || response.data,
        );
        setError(null);
      } catch (err) {
        console.error("Error fetching vehicle:", err);
        setError(err.response?.data?.message || "Failed to fetch vehicle");
        setVehicle(null);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicle();
  }, [vehicleId]);

  return { vehicle, loading, error };
};

/**
 * Custom hook for fetching bookings
 */
export const useBookings = (filters = {}) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(API_ENDPOINTS.BOOKINGS.BASE, {
        params: filters,
      });
      const bookingData =
        response.data.bookings || response.data.data || response.data;
      setBookings(Array.isArray(bookingData) ? bookingData : []);
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
 * Custom hook for fetching a single booking
 */
export const useBooking = (bookingId) => {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!bookingId) return;

    const fetchBooking = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(
          API_ENDPOINTS.BOOKINGS.BY_ID(bookingId),
        );
        setBooking(
          response.data.booking || response.data.data || response.data,
        );
        setError(null);
      } catch (err) {
        console.error("Error fetching booking:", err);
        setError(err.response?.data?.message || "Failed to fetch booking");
        setBooking(null);
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId]);

  return { booking, loading, error };
};

/**
 * Custom hook for fetching requests
 */
export const useRequests = (filters = {}) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchRequests = async (params = {}) => {
    try {
      setLoading(true);
      const response = await apiClient.get(API_ENDPOINTS.REQUESTS.BASE, {
        params: { ...filters, ...params },
      });

      const requestData =
        response.data.data?.requests ||
        response.data.requests ||
        response.data.data ||
        response.data;
      setRequests(Array.isArray(requestData) ? requestData : []);

      if (response.data.data?.pagination) {
        setPagination(response.data.data.pagination);
      }

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

  const updateStatus = async (requestId, status, notes) => {
    try {
      await apiClient.patch(API_ENDPOINTS.REQUESTS.UPDATE_STATUS(requestId), {
        status,
        notes,
      });
      await fetchRequests();
      return { success: true };
    } catch (err) {
      console.error("Error updating status:", err);
      return {
        success: false,
        error: err.response?.data?.message || "Status update failed",
      };
    }
  };

  const approveRequest = async (requestId, notes) => {
    try {
      await apiClient.post(API_ENDPOINTS.REQUESTS.APPROVE(requestId), {
        notes,
      });
      await fetchRequests();
      return { success: true };
    } catch (err) {
      console.error("Error approving request:", err);
      return {
        success: false,
        error: err.response?.data?.message || "Approval failed",
      };
    }
  };

  const denyRequest = async (requestId, reason) => {
    try {
      await apiClient.post(API_ENDPOINTS.REQUESTS.DENY(requestId), { reason });
      await fetchRequests();
      return { success: true };
    } catch (err) {
      console.error("Error denying request:", err);
      return {
        success: false,
        error: err.response?.data?.message || "Denial failed",
      };
    }
  };

  const pauseRequest = async (requestId, reason) => {
    try {
      await apiClient.post(API_ENDPOINTS.REQUESTS.PAUSE(requestId), { reason });
      await fetchRequests();
      return { success: true };
    } catch (err) {
      console.error("Error pausing request:", err);
      return {
        success: false,
        error: err.response?.data?.message || "Pause failed",
      };
    }
  };

  const resumeRequest = async (requestId, notes) => {
    try {
      await apiClient.post(API_ENDPOINTS.REQUESTS.RESUME(requestId), { notes });
      await fetchRequests();
      return { success: true };
    } catch (err) {
      console.error("Error resuming request:", err);
      return {
        success: false,
        error: err.response?.data?.message || "Resume failed",
      };
    }
  };

  const addNote = async (requestId, note) => {
    try {
      await apiClient.post(API_ENDPOINTS.REQUESTS.ADD_NOTE(requestId), {
        note,
      });
      await fetchRequests();
      return { success: true };
    } catch (err) {
      console.error("Error adding note:", err);
      return {
        success: false,
        error: err.response?.data?.message || "Add note failed",
      };
    }
  };

  return {
    requests,
    loading,
    error,
    pagination,
    updateStatus,
    approveRequest,
    denyRequest,
    pauseRequest,
    resumeRequest,
    addNote,
    refetch: fetchRequests,
  };
};

/**
 * Custom hook for fetching a single request
 */
export const useRequest = (requestId) => {
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [relatedData, setRelatedData] = useState({
    user: null,
    customer: null,
    owner: null,
    vehicle: null,
    booking: null,
  });
  const [relatedDataLoading, setRelatedDataLoading] = useState(false);

  useEffect(() => {
    if (!requestId) return;

    const fetchRequest = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(
          API_ENDPOINTS.REQUESTS.BY_ID(requestId),
        );
        const requestData =
          response.data.data?.request ||
          response.data.request ||
          response.data.data ||
          response.data;
        setRequest(requestData);
        setError(null);

        if (requestData) {
          fetchRelatedData(requestData);
        }
      } catch (err) {
        console.error("Error fetching request:", err);
        setError(err.response?.data?.message || "Failed to fetch request");
        setRequest(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [requestId]);

  const fetchRelatedData = async (requestData) => {
    setRelatedDataLoading(true);
    const related = {
      user: null,
      customer: null,
      owner: null,
      vehicle: null,
      booking: null,
    };

    try {
      if (requestData.userId) {
        try {
          const userResponse = await apiClient.get(
            API_ENDPOINTS.USERS.BY_ID(requestData.userId),
          );
          related.user =
            userResponse.data.user ||
            userResponse.data.data ||
            userResponse.data;
        } catch (err) {
          console.log("User service not available or user not found");
        }
      }

      if (
        requestData.customerId &&
        requestData.customerId !== requestData.userId
      ) {
        try {
          const customerResponse = await apiClient.get(
            API_ENDPOINTS.USERS.BY_ID(requestData.customerId),
          );
          related.customer =
            customerResponse.data.user ||
            customerResponse.data.data ||
            customerResponse.data;
        } catch (err) {
          console.log("Customer service not available or customer not found");
        }
      }

      if (requestData.ownerId) {
        try {
          const ownerResponse = await apiClient.get(
            API_ENDPOINTS.USERS.BY_ID(requestData.ownerId),
          );
          related.owner =
            ownerResponse.data.user ||
            ownerResponse.data.data ||
            ownerResponse.data;
        } catch (err) {
          console.log("Owner service not available or owner not found");
        }
      }

      if (requestData.vehicleId) {
        try {
          const vehicleResponse = await apiClient.get(
            API_ENDPOINTS.VEHICLES.BY_ID(requestData.vehicleId),
          );
          related.vehicle =
            vehicleResponse.data.vehicle ||
            vehicleResponse.data.data ||
            vehicleResponse.data;
        } catch (err) {
          console.log("Vehicle service not available or vehicle not found");
        }
      }

      if (requestData.bookingId) {
        try {
          const bookingResponse = await apiClient.get(
            API_ENDPOINTS.BOOKINGS.BY_ID(requestData.bookingId),
          );
          related.booking =
            bookingResponse.data.booking ||
            bookingResponse.data.data ||
            bookingResponse.data;
        } catch (err) {
          console.log("Booking service not available or booking not found");
        }
      }

      setRelatedData(related);
    } catch (err) {
      console.error("Error fetching related data:", err);
    } finally {
      setRelatedDataLoading(false);
    }
  };

  return { request, loading, error, relatedData, relatedDataLoading };
};

/**
 * Custom hook for fetching staff (users with role 'support') - UPDATED
 */
export const useStaff = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      // Use dedicated support endpoint
      const response = await apiClient.get(API_ENDPOINTS.USERS.SUPPORT);

      // User Service returns: { users: [...] }
      let userData = response.data.users || response.data.data || response.data;

      if (!Array.isArray(userData)) {
        userData = [];
      }

      setStaff(userData);
      setError(null);
    } catch (err) {
      console.error("Error fetching staff:", err);
      setError(err.response?.data?.message || "Failed to fetch staff");
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const updateStaffStatus = async (staffId, status, reason) => {
    try {
      await apiClient.put(API_ENDPOINTS.USERS.UPDATE_STATUS(staffId), {
        status,
        reason,
      });
      await fetchStaff();
      return { success: true };
    } catch (err) {
      console.error("Error updating staff status:", err);
      return {
        success: false,
        error: err.response?.data?.message || "Update failed",
      };
    }
  };

  const createStaff = async (staffData) => {
    try {
      // Register as support user
      await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, {
        ...staffData,
        role: "support",
      });
      await fetchStaff();
      return { success: true };
    } catch (err) {
      console.error("Error creating staff:", err);
      return {
        success: false,
        error: err.response?.data?.message || "Creation failed",
      };
    }
  };

  return {
    staff,
    loading,
    error,
    updateStaffStatus,
    createStaff,
    refetch: fetchStaff,
  };
};

/**
 * Custom hook for fetching reviews for a vehicle
 */
export const useVehicleReviews = (vehicleId) => {
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);
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
        setSummary(response.data.summary || null);
        setError(null);
      } catch (err) {
        console.error("Error fetching reviews:", err);
        setError(err.response?.data?.message || "Failed to fetch reviews");
        setReviews([]);
        setSummary(null);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [vehicleId]);

  return { reviews, summary, loading, error };
};
