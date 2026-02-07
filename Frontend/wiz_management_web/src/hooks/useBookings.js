import { useState } from "react";
import apiClient from "../utils/apiClient";
import { API_ENDPOINTS } from "../config/api";

/**
 * Custom hook for Booking Service operations
 * Handles fetching and managing bookings
 *
 * Backend booking statuses:
 * - pending_payment: Waiting for deposit payment (30 min timeout)
 * - pending_contract: Deposit paid, waiting for contract signature
 * - booking: Contract signed, booking confirmed (ACTIVE)
 * - ongoing: Pickup confirmed, rental in progress
 * - completed: Rental completed
 * - cancelled: Booking cancelled
 * - expired: Payment timeout or booking expired
 */
export const useBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Map backend status to frontend status
  const mapStatus = (backendStatus) => {
    const statusMap = {
      pending_payment: "pending",
      pending_contract: "pending",
      booking: "upcoming", // Active confirmed booking
      ongoing: "ongoing",
      completed: "completed",
      cancelled: "cancelled",
      expired: "cancelled",
    };
    return statusMap[backendStatus] || backendStatus;
  };

  // Fetch all bookings (admin/support)
  const fetchBookings = async (filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      // Add filters to query params
      if (filters.status) params.append("status", filters.status);
      if (filters.userId) params.append("customerId", filters.userId);
      if (filters.ownerId) params.append("ownerId", filters.ownerId);
      if (filters.vehicleId) params.append("vehicleId", filters.vehicleId);
      if (filters.page) params.append("page", filters.page);
      if (filters.limit) params.append("limit", filters.limit);
      if (filters.search) params.append("search", filters.search);
      if (filters.searchBy) params.append("searchBy", filters.searchBy);

      const url = `${API_ENDPOINTS.BOOKINGS.ADMIN}${params.toString() ? "?" + params.toString() : ""}`;
      const response = await apiClient.get(url);

      // Map backend response to frontend format
      const mappedBookings = response.data.data.map((booking) => ({
        id: booking.id,
        userId: booking.customerId,
        userName: booking.customerName || "Unknown Customer",
        ownerId: booking.ownerId,
        ownerName: booking.ownerName || "Unknown Owner",
        vehicleId: booking.vehicleId,
        carName: booking.vehicleName,
        carImage: booking.vehiclePhoto || "/placeholder-car.png",
        status: mapStatus(booking.status),
        backendStatus: booking.status, // Keep original status
        startDate: booking.timeline.startDate,
        endDate: booking.timeline.endDate,
        duration: booking.timeline.duration,
        total: booking.payment.totalAmount || booking.totalPrice || 0,
        rentalPrice: booking.pricing?.rentalPrice || 0,
        depositAmount: booking.pricing?.depositAmount || 0,
        finalPayment: booking.pricing?.finalPayment || 0,
        createdDate: booking.createdAt,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        // Additional details
        paymentExpiry: booking.paymentExpiry,
        contractSigned: booking.contractSigned,
        pickupConfirmed: booking.pickupConfirmed,
        returnConfirmed: booking.returnConfirmed,
      }));

      setBookings(mappedBookings);
      return {
        bookings: mappedBookings,
        pagination: response.data.pagination,
      };
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch bookings");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get booking by ID
  const getBookingById = async (bookingId) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get(
        `${API_ENDPOINTS.BOOKINGS.BASE}/${bookingId}`,
      );

      const booking = response.data.booking || response.data;
      return {
        id: booking.id,
        userId: booking.customerId,
        userName: booking.customerName,
        customerEmail: booking.customerEmail,
        customerPhone: booking.customerPhone,
        ownerId: booking.ownerId,
        ownerName: booking.ownerName,
        ownerEmail: booking.ownerEmail,
        ownerPhone: booking.ownerPhone,
        vehicleId: booking.vehicleId,
        carName: booking.vehicleName,
        carImage: booking.vehiclePhoto,
        status: mapStatus(booking.status),
        backendStatus: booking.status,
        startDate: booking.startDate,
        endDate: booking.endDate,
        duration: calculateDuration(booking.startDate, booking.endDate),
        // Pricing breakdown
        pricing: {
          rentalPrice: booking.pricing?.rentalPrice || 0,
          depositAmount: booking.pricing?.depositAmount || 0,
          finalPayment: booking.pricing?.finalPayment || 0,
          totalPrice: booking.pricing?.totalPrice || 0,
        },
        total: booking.pricing?.totalPrice || 0,
        // Status flags
        paymentExpiry: booking.paymentExpiry,
        contractSigned: booking.contractSigned,
        contractUrl: booking.contractUrl,
        pickupConfirmed: booking.pickupConfirmed,
        pickupTime: booking.pickupTime,
        returnConfirmed: booking.returnConfirmed,
        returnTime: booking.returnTime,
        // Pickup & return locations
        pickupLocation: booking.pickupLocation,
        returnLocation: booking.returnLocation,
        // Notes
        customerNotes: booking.customerNotes,
        ownerNotes: booking.ownerNotes,
        // Timestamps
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
      };
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch booking");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get bookings by user ID
  const getBookingsByUser = async (userId) => {
    try {
      const response = await apiClient.get(
        `${API_ENDPOINTS.BOOKINGS.ADMIN}?customerId=${userId}`,
      );

      return response.data.data.map((booking) => ({
        id: booking.id,
        vehicleId: booking.vehicleId,
        carName: booking.vehicleName,
        carImage: booking.vehiclePhoto,
        status: mapStatus(booking.status),
        startDate: booking.startDate,
        endDate: booking.endDate,
        duration: calculateDuration(booking.startDate, booking.endDate),
        total: booking.pricing?.totalPrice || 0,
        createdDate: booking.createdAt,
      }));
    } catch (err) {
      throw err;
    }
  };

  // Get bookings by owner ID
  const getBookingsByOwner = async (ownerId) => {
    try {
      const response = await apiClient.get(
        `${API_ENDPOINTS.BOOKINGS.ADMIN}?ownerId=${ownerId}`,
      );

      return response.data.data.map((booking) => ({
        id: booking.id,
        userId: booking.customerId,
        userName: booking.customerName,
        vehicleId: booking.vehicleId,
        carName: booking.vehicleName,
        carImage: booking.vehiclePhoto,
        status: mapStatus(booking.status),
        startDate: booking.startDate,
        endDate: booking.endDate,
        duration: calculateDuration(booking.startDate, booking.endDate),
        total: booking.pricing?.totalPrice || 0,
        createdDate: booking.createdAt,
      }));
    } catch (err) {
      throw err;
    }
  };

  // Get bookings by vehicle ID
  const getBookingsByVehicle = async (vehicleId) => {
    try {
      const response = await apiClient.get(
        `${API_ENDPOINTS.BOOKINGS.ADMIN}?vehicleId=${vehicleId}`,
      );

      return response.data.data.map((booking) => ({
        id: booking.id,
        userId: booking.customerId,
        userName: booking.customerName,
        status: mapStatus(booking.status),
        startDate: booking.startDate,
        endDate: booking.endDate,
        duration: calculateDuration(booking.startDate, booking.endDate),
        total: booking.pricing?.totalPrice || 0,
        createdDate: booking.createdAt,
      }));
    } catch (err) {
      throw err;
    }
  };

  // Helper function to calculate duration in days
  const calculateDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return {
    bookings,
    loading,
    error,
    fetchBookings,
    getBookingById,
    getBookingsByUser,
    getBookingsByOwner,
    getBookingsByVehicle,
  };
};
