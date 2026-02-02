const {
  bookingService,
  vehicleService,
  paymentService,
  reviewService,
} = require("../utils/serviceClients");

class OwnerAnalyticsService {
  /**
   * Get owner dashboard overview
   */
  async getOwnerDashboard(ownerId, timeRange = "30d", token) {
    try {
      const [vehicleStats, bookingStats, revenueStats, reviewStats] =
        await Promise.all([
          this.getOwnerVehicleStats(ownerId, timeRange, token),
          this.getOwnerBookingStats(ownerId, timeRange, token),
          this.getOwnerRevenueStats(ownerId, timeRange, token),
          this.getOwnerReviewStats(ownerId, timeRange, token),
        ]);

      return {
        vehicles: vehicleStats,
        bookings: bookingStats,
        revenue: revenueStats,
        reviews: reviewStats,
        timeRange,
      };
    } catch (error) {
      console.error("Error getting owner dashboard:", error);
      throw error;
    }
  }

  /**
   * Get owner vehicle statistics
   */
  async getOwnerVehicleStats(ownerId, timeRange, token) {
    try {
      // This will call: GET /analytics/vehicles/owner/:ownerId/stats
      const stats = await vehicleService.get(
        `/analytics/vehicles/owner/${ownerId}/stats`,
        {
          params: { timeRange },
          token,
        },
      );

      return {
        totalVehicles: stats.totalVehicles || 0,
        activeVehicles: stats.activeVehicles || 0,
        rentedVehicles: stats.rentedVehicles || 0,
        availableVehicles: stats.availableVehicles || 0,
        averageRating: stats.averageRating || 0,
        totalRentals: stats.totalRentals || 0,
        utilizationRate: stats.utilizationRate || 0,
        topPerforming: stats.topPerforming || [],
        byType: stats.byType || {},
      };
    } catch (error) {
      console.error("Error getting owner vehicle stats:", error);
      return this.getDefaultOwnerVehicleStats();
    }
  }

  /**
   * Get owner booking statistics
   */
  async getOwnerBookingStats(ownerId, timeRange, token) {
    try {
      // This will call: GET /analytics/bookings/owner/:ownerId/stats
      const stats = await bookingService.get(
        `/analytics/bookings/owner/${ownerId}/stats`,
        {
          params: { timeRange },
          token,
        },
      );

      return {
        totalBookings: stats.totalBookings || 0,
        activeBookings: stats.activeBookings || 0,
        completedBookings: stats.completedBookings || 0,
        cancelledBookings: stats.cancelledBookings || 0,
        acceptanceRate: stats.acceptanceRate || 0,
        averageDuration: stats.averageDuration || 0,
        trend: stats.trend || [],
        byStatus: stats.byStatus || {},
      };
    } catch (error) {
      console.error("Error getting owner booking stats:", error);
      return this.getDefaultOwnerBookingStats();
    }
  }

  /**
   * Get owner revenue statistics
   */
  async getOwnerRevenueStats(ownerId, timeRange, token) {
    try {
      // This will call: GET /analytics/payments/owner/:ownerId/revenue
      const stats = await paymentService.get(
        `/analytics/payments/owner/${ownerId}/revenue`,
        {
          params: { timeRange },
          token,
        },
      );

      return {
        totalRevenue: stats.totalRevenue || 0,
        pendingRevenue: stats.pendingRevenue || 0,
        completedRevenue: stats.completedRevenue || 0,
        refundedAmount: stats.refundedAmount || 0,
        averageBookingValue: stats.averageBookingValue || 0,
        growth: stats.growth || 0,
        trend: stats.trend || [],
        topEarningVehicles: stats.topEarningVehicles || [],
      };
    } catch (error) {
      console.error("Error getting owner revenue stats:", error);
      return this.getDefaultOwnerRevenueStats();
    }
  }

  /**
   * Get owner review statistics
   */
  async getOwnerReviewStats(ownerId, timeRange, token) {
    try {
      // This will call: GET /analytics/reviews/owner/:ownerId/stats
      const stats = await reviewService.get(
        `/analytics/reviews/owner/${ownerId}/stats`,
        {
          params: { timeRange },
          token,
        },
      );

      return {
        averageRating: stats.averageRating || 0,
        totalReviews: stats.totalReviews || 0,
        vehicleReviews: stats.vehicleReviews || 0,
        ownerReviews: stats.ownerReviews || 0,
        ratingDistribution: stats.ratingDistribution || {},
        recentReviews: stats.recentReviews || [],
        trend: stats.trend || [],
      };
    } catch (error) {
      console.error("Error getting owner review stats:", error);
      return this.getDefaultOwnerReviewStats();
    }
  }

  /**
   * Get analytics for a specific vehicle
   */
  async getVehicleAnalytics(vehicleId, ownerId, timeRange = "30d", token) {
    try {
      const [vehicleInfo, bookingStats, revenueStats, reviewStats] =
        await Promise.all([
          this.getVehicleInfo(vehicleId, token),
          this.getVehicleBookingStats(vehicleId, timeRange, token),
          this.getVehicleRevenueStats(vehicleId, timeRange, token),
          this.getVehicleReviewStats(vehicleId, timeRange, token),
        ]);

      // Verify ownership
      if (vehicleInfo.ownerId !== ownerId) {
        throw new Error("Unauthorized: Vehicle does not belong to this owner");
      }

      return {
        vehicle: vehicleInfo,
        bookings: bookingStats,
        revenue: revenueStats,
        reviews: reviewStats,
        timeRange,
      };
    } catch (error) {
      console.error("Error getting vehicle analytics:", error);
      throw error;
    }
  }

  /**
   * Get vehicle information
   */
  async getVehicleInfo(vehicleId, token) {
    try {
      // This will call: GET /vehicles/:vehicleId
      const vehicle = await vehicleService.get(`/vehicles/${vehicleId}`, {
        token,
      });
      return vehicle;
    } catch (error) {
      console.error("Error getting vehicle info:", error);
      throw error;
    }
  }

  /**
   * Get vehicle booking statistics
   */
  async getVehicleBookingStats(vehicleId, timeRange, token) {
    try {
      // This will call: GET /analytics/bookings/vehicle/:vehicleId/stats
      const stats = await bookingService.get(
        `/analytics/bookings/vehicle/${vehicleId}/stats`,
        {
          params: { timeRange },
          token,
        },
      );

      return {
        totalBookings: stats.totalBookings || 0,
        activeBookings: stats.activeBookings || 0,
        completedBookings: stats.completedBookings || 0,
        cancelledBookings: stats.cancelledBookings || 0,
        utilizationRate: stats.utilizationRate || 0,
        averageDuration: stats.averageDuration || 0,
        trend: stats.trend || [],
      };
    } catch (error) {
      console.error("Error getting vehicle booking stats:", error);
      return this.getDefaultVehicleBookingStats();
    }
  }

  /**
   * Get vehicle revenue statistics
   */
  async getVehicleRevenueStats(vehicleId, timeRange, token) {
    try {
      // This will call: GET /analytics/payments/vehicle/:vehicleId/revenue
      const stats = await paymentService.get(
        `/analytics/payments/vehicle/${vehicleId}/revenue`,
        {
          params: { timeRange },
          token,
        },
      );

      return {
        totalRevenue: stats.totalRevenue || 0,
        averageBookingValue: stats.averageBookingValue || 0,
        trend: stats.trend || [],
      };
    } catch (error) {
      console.error("Error getting vehicle revenue stats:", error);
      return this.getDefaultVehicleRevenueStats();
    }
  }

  /**
   * Get vehicle review statistics
   */
  async getVehicleReviewStats(vehicleId, timeRange, token) {
    try {
      // This will call: GET /reviews/vehicle/:vehicleId (existing endpoint)
      const reviews = await reviewService.get(`/reviews/vehicle/${vehicleId}`, {
        params: { limit: 100 },
        token,
      });

      return {
        averageRating: reviews.summary?.averageRating || 0,
        totalReviews: reviews.summary?.totalReviews || 0,
        ratingDistribution: reviews.summary?.ratingDistribution || {},
        recentReviews: reviews.reviews?.slice(0, 5) || [],
      };
    } catch (error) {
      console.error("Error getting vehicle review stats:", error);
      return this.getDefaultVehicleReviewStats();
    }
  }

  /**
   * Get performance comparison across owner's vehicles
   */
  async getVehicleComparison(ownerId, timeRange = "30d", token) {
    try {
      // Get all owner's vehicles
      const vehicles = await vehicleService.get(`/vehicles/owner/${ownerId}`, {
        token,
      });

      // Get stats for each vehicle
      const comparisons = await Promise.all(
        vehicles.map(async (vehicle) => {
          const [bookingStats, revenueStats, reviewStats] = await Promise.all([
            this.getVehicleBookingStats(vehicle.id, timeRange, token),
            this.getVehicleRevenueStats(vehicle.id, timeRange, token),
            this.getVehicleReviewStats(vehicle.id, timeRange, token),
          ]);

          return {
            vehicleId: vehicle.id,
            name: vehicle.name,
            bookings: bookingStats.totalBookings,
            revenue: revenueStats.totalRevenue,
            rating: reviewStats.averageRating,
            utilizationRate: bookingStats.utilizationRate,
          };
        }),
      );

      return {
        vehicles: comparisons,
        timeRange,
      };
    } catch (error) {
      console.error("Error getting vehicle comparison:", error);
      throw error;
    }
  }

  // Default fallback methods
  getDefaultOwnerVehicleStats() {
    return {
      totalVehicles: 0,
      activeVehicles: 0,
      rentedVehicles: 0,
      availableVehicles: 0,
      averageRating: 0,
      totalRentals: 0,
      utilizationRate: 0,
      topPerforming: [],
      byType: {},
    };
  }

  getDefaultOwnerBookingStats() {
    return {
      totalBookings: 0,
      activeBookings: 0,
      completedBookings: 0,
      cancelledBookings: 0,
      acceptanceRate: 0,
      averageDuration: 0,
      trend: [],
      byStatus: {},
    };
  }

  getDefaultOwnerRevenueStats() {
    return {
      totalRevenue: 0,
      pendingRevenue: 0,
      completedRevenue: 0,
      refundedAmount: 0,
      averageBookingValue: 0,
      growth: 0,
      trend: [],
      topEarningVehicles: [],
    };
  }

  getDefaultOwnerReviewStats() {
    return {
      averageRating: 0,
      totalReviews: 0,
      vehicleReviews: 0,
      ownerReviews: 0,
      ratingDistribution: {},
      recentReviews: [],
      trend: [],
    };
  }

  getDefaultVehicleBookingStats() {
    return {
      totalBookings: 0,
      activeBookings: 0,
      completedBookings: 0,
      cancelledBookings: 0,
      utilizationRate: 0,
      averageDuration: 0,
      trend: [],
    };
  }

  getDefaultVehicleRevenueStats() {
    return {
      totalRevenue: 0,
      averageBookingValue: 0,
      trend: [],
    };
  }

  getDefaultVehicleReviewStats() {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: {},
      recentReviews: [],
    };
  }
}

module.exports = new OwnerAnalyticsService();
