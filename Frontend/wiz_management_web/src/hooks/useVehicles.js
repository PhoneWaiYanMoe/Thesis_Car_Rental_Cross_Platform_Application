import { useState } from "react";
import apiClient from "../utils/apiClient";
import { API_ENDPOINTS } from "../config/api";

/**
 * Custom hook for Vehicle Service operations
 * Handles fetching, filtering, and managing vehicles
 */
export const useVehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all vehicles (admin)
  const fetchVehicles = async (filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      // Add filters to query params
      if (filters.status) params.append("status", filters.status);
      // if (filters.vehicleId) params.append("vehicleId", filters.vehicleId);
      // if (filters.ownerId) params.append("ownerId", filters.ownerId);
      if (filters.vehicleType)
        params.append("vehicleType", filters.vehicleType);
      if (filters.page) params.append("page", filters.page);
      if (filters.limit) params.append("limit", filters.limit);
      if (filters.searchBy === "vehicleId") {
        params.append("vehicleId", filters.search);
      } else if (filters.searchBy === "ownerId") {
        params.append("ownerId", filters.search);
      }
      else {
        params.append("searchBy", filters.searchBy);
        if (filters.search) params.append("search", filters.search);
      }

      const url = `${API_ENDPOINTS.VEHICLES.BASE}/admin/vehicles${params.toString() ? "?" + params.toString() : ""}`;
      const response = await apiClient.get(url);

      // Map backend response to frontend format
      const mappedVehicles = response.data.vehicles.map((vehicle) => ({
        id: vehicle.id,
        ownerId: vehicle.ownerId,
        ownerName: vehicle.ownerName || "Unknown Owner",
        name: vehicle.name,
        description: vehicle.description,
        vehicleType: vehicle.specifications?.vehicleType || vehicle.vehicleType,
        transmission:
          vehicle.specifications?.transmission || vehicle.transmission,
        fuelType: vehicle.specifications?.fuelType || vehicle.fuelType,
        seater: vehicle.specifications?.seats || vehicle.seats,
        seats: vehicle.specifications?.seats || vehicle.seats,
        year: vehicle.specifications?.year || vehicle.year,
        mileage: vehicle.specifications?.mileage || 0,
        licensePlate: vehicle.specifications?.licensePlate,
        pricePerDay: vehicle.pricing?.pricePerDay || vehicle.pricePerDay,
        rating: vehicle.rating || 0,
        totalRentals: vehicle.totalRentals || 0,
        status: vehicle.status,
        image:
          vehicle.primaryPhoto ||
          vehicle.photos?.[0]?.url ||
          "/placeholder-car.png",
        images: vehicle.photos?.map((p) => p.url) || [vehicle.primaryPhoto],
        features: vehicle.features || [],
        location:
          vehicle.location?.city || vehicle.location?.address || "Unknown",
        locationDetails: vehicle.location,
        createdAt: vehicle.createdAt,
        updatedAt: vehicle.updatedAt,
      }));

      setVehicles(mappedVehicles);
      return {
        vehicles: mappedVehicles,
        pagination: response.data.pagination,
      };
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch vehicles");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get vehicle by ID
  const getVehicleById = async (vehicleId) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get(
        API_ENDPOINTS.VEHICLES.BY_ID(vehicleId),
      );

      const vehicle = response.data.vehicle || response.data;
      return {
        id: vehicle.id,
        ownerId: vehicle.ownerId,
        ownerName: vehicle.ownerName || "Unknown Owner",
        ownerAvatar: vehicle.ownerAvatar || "/default-avatar.png",
        name: vehicle.name,
        description: vehicle.description,
        vehicleType: vehicle.specifications?.vehicleType,
        transmission: vehicle.specifications?.transmission,
        fuelType: vehicle.specifications?.fuelType,
        seater: vehicle.specifications?.seats,
        seats: vehicle.specifications?.seats,
        year: vehicle.specifications?.year,
        mileage: vehicle.specifications?.mileage,
        licensePlate: vehicle.specifications?.licensePlate,
        pricePerDay: vehicle.pricing?.pricePerDay,
        rating: vehicle.performance.rating || 0,
        totalRentals: vehicle.performance.totalRentals || 0,
        status: vehicle.status,
        image: vehicle.primaryPhoto || vehicle.photos?.[0]?.url,
        images: vehicle.photos?.map((p) => p.url) || [],
        features: vehicle.features || [],
        location: vehicle.location?.city || vehicle.location?.address,
        locationDetails: vehicle.location,
        verificationStatus: vehicle.verificationStatus,
        createdAt: vehicle.createdAt,
        updatedAt: vehicle.updatedAt,
      };
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch vehicle");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Search vehicles by owner ID (admin)
  const getVehiclesByOwner = async (ownerId) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append("ownerId", ownerId);

      const url = `${API_ENDPOINTS.VEHICLES.BASE}/admin/vehicles?${params.toString()}`;
      const response = await apiClient.get(url);

      const mappedVehicles = response.data.vehicles.map((vehicle) => ({
        id: vehicle.id,
        ownerId: vehicle.ownerId,
        name: vehicle.name,
        vehicleType: vehicle.specifications?.vehicleType,
        transmission: vehicle.specifications?.transmission,
        fuelType: vehicle.specifications?.fuelType,
        seater: vehicle.specifications?.seats,
        pricePerDay: vehicle.pricing?.pricePerDay,
        rating: vehicle.rating || 0,
        totalRentals: vehicle.totalRentals || 0,
        status: vehicle.status,
        primaryPhoto: vehicle.primaryPhoto || vehicle.photos?.[0]?.url,
        location: vehicle.location?.city,
      }));

      return mappedVehicles;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch owner vehicles");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update vehicle status (admin only)
  const updateVehicleStatus = async (vehicleId, status) => {
    setLoading(true);
    setError(null);

    try {
      const vehicleStatus = status;
      const response = await apiClient.put(
        `${API_ENDPOINTS.VEHICLES.BASE}/owner/${vehicleId}`,
        { vehicleStatus },
      );

      // Update local state
      setVehicles((prev) =>
        prev.map((vehicle) =>
          vehicle.id === vehicleId ? { ...vehicle, status } : vehicle,
        ),
      );

      return response.data;
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to update vehicle status",
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Search vehicles (public API)
  const searchVehicles = async (searchParams = {}) => {
    try {
      const params = new URLSearchParams();

      if (searchParams.city) params.append("city", searchParams.city);
      if (searchParams.vehicleType)
        params.append("vehicleType", searchParams.vehicleType);
      if (searchParams.minPrice)
        params.append("minPrice", searchParams.minPrice);
      if (searchParams.maxPrice)
        params.append("maxPrice", searchParams.maxPrice);
      if (searchParams.startDate)
        params.append("startDate", searchParams.startDate);
      if (searchParams.endDate) params.append("endDate", searchParams.endDate);
      if (searchParams.page) params.append("page", searchParams.page);
      if (searchParams.limit) params.append("limit", searchParams.limit);

      const response = await apiClient.get(
        `${API_ENDPOINTS.VEHICLES.BASE}/search?${params.toString()}`,
      );

      return response.data.vehicles.map((vehicle) => ({
        id: vehicle.id,
        name: vehicle.name,
        vehicleType: vehicle.vehicleType,
        transmission: vehicle.transmission,
        fuelType: vehicle.fuelType,
        seats: vehicle.seats,
        year: vehicle.year,
        pricePerDay: vehicle.pricePerDay,
        rating: vehicle.rating,
        totalRentals: vehicle.totalRentals,
        primaryPhoto: vehicle.primaryPhoto,
        location: vehicle.location,
      }));
    } catch (err) {
      throw err;
    }
  };

  return {
    vehicles,
    loading,
    error,
    fetchVehicles,
    getVehicleById,
    getVehiclesByOwner,
    updateVehicleStatus,
    searchVehicles,
  };
};
