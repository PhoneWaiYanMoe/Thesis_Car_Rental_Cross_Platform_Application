import { useState } from "react";
import apiClient from "../utils/apiClient";
import { API_ENDPOINTS } from "../config/api";

/**
 * Custom hook for Review Service operations
 * Handles vehicle and owner reviews
 */
export const useReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get all reviews (admin)
  const fetchAllReviews = async (filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      if (filters.type) params.append("type", filters.type); // 'vehicle' or 'owner'
      if (filters.page) params.append("page", filters.page);
      if (filters.limit) params.append("limit", filters.limit);

      const url = `${API_ENDPOINTS.REVIEWS.BASE}/all${params.toString() ? "?" + params.toString() : ""}`;
      const response = await apiClient.get(url);

      const mappedReviews = response.data.reviews.map((review) => ({
        id: review.id,
        type: review.type, // 'vehicle' or 'owner'
        userId: review.userId,
        userName: review.userName || review.customerName || "Anonymous",
        userEmail: review.userEmail,
        // For vehicle reviews
        carId: review.vehicleId,
        vehicleId: review.vehicleId,
        vehicleName: review.vehicleName,
        // For owner reviews
        ownerId: review.reviewedOwnerId,
        ownerName: review.ownerName,
        // Rating and content
        rating: review.rating,
        comment: review.comment,
        images: review.photos || [],
        photos: review.photos || [],
        // Response from owner
        reply: review.response
          ? {
              comment: review.response.comment,
              repliedAt: review.response.createdAt,
              ownerName: review.ownerName,
            }
          : null,
        // Helpful count
        helpful: review.helpfulCount || 0,
        // Timestamps
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
      }));

      setReviews(mappedReviews);
      return {
        reviews: mappedReviews,
        pagination: response.data.pagination,
      };
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch reviews");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get reviews for a specific vehicle
  const getVehicleReviews = async (vehicleId, page = 1, limit = 10) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append("page", page);
      params.append("limit", limit);

      const url = `${API_ENDPOINTS.REVIEWS.VEHICLE(vehicleId)}?${params.toString()}`;
      const response = await apiClient.get(url);

      const mappedReviews = response.data.reviews.map((review) => ({
        id: review.id,
        userId: review.userId,
        userName: review.user.name || review.customerName || "Anonymous",
        avatar: review.user.avatar,
        carId: vehicleId,
        vehicleId: vehicleId,
        rating: review.rating,
        comment: review.comment,
        images: review.photos || [],
        photos: review.photos || [],
        reply: review.response
          ? {
              comment: review.response.comment,
              repliedAt: review.response.createdAt,
              ownerName: review.ownerName,
            }
          : null,
        helpful: review.helpfulCount || 0,
        createdAt: review.createdAt,
      }));

      return {
        reviews: mappedReviews,
        pagination: response.data.pagination,
      };
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to fetch vehicle reviews",
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get reviews for a specific owner
  const getOwnerReviews = async (ownerId, page = 1, limit = 10) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append("page", page);
      params.append("limit", limit);

      const url = `${API_ENDPOINTS.REVIEWS.OWNER(ownerId)}?${params.toString()}`;
      const response = await apiClient.get(url);

      const mappedReviews = response.data.reviews.map((review) => ({
        id: review.id,
        userId: review.userId,
        userName: review.user.name || review.customerName || "Anonymous",
        avatar: review.user.avatar,
        ownerId: ownerId,
        ownerName: review.ownerName,
        rating: review.rating,
        comment: review.comment,
        images: review.photos || [],
        photos: review.photos || [],
        reply: review.response
          ? {
              comment: review.response.comment,
              repliedAt: review.response.createdAt,
            }
          : null,
        helpful: review.helpfulCount || 0,
        createdAt: review.createdAt,
      }));

      return {
        reviews: mappedReviews,
        pagination: response.data.pagination,
      };
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch owner reviews");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get vehicle review statistics
  const getVehicleReviewStats = async (vehicleId) => {
    try {
      const response = await apiClient.get(
        `/analytics/reviews/vehicle/${vehicleId}/stats`,
      );
      return response.data;
    } catch (err) {
      throw err;
    }
  };

  // Get owner review statistics
  const getOwnerReviewStats = async (ownerId) => {
    try {
      const response = await apiClient.get(
        `/analytics/reviews/owner/${ownerId}/stats`,
      );
      return response.data;
    } catch (err) {
      throw err;
    }
  };

  // Get platform review statistics (admin)
  const getPlatformReviewStats = async () => {
    try {
      const response = await apiClient.get("/analytics/reviews/platform/stats");
      return response.data;
    } catch (err) {
      throw err;
    }
  };

  return {
    reviews,
    loading,
    error,
    fetchAllReviews,
    getVehicleReviews,
    getOwnerReviews,
    getVehicleReviewStats,
    getOwnerReviewStats,
    getPlatformReviewStats,
  };
};
