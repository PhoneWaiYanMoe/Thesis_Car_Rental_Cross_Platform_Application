const {
  bookingService,
  userService,
  vehicleService,
  paymentService,
  reviewService,
  requestService,
} = require("../utils/serviceClients");

class AdminAnalyticsService {
  /**
   * Get dashboard overview statistics
   */
  async getDashboardStats(timeRange = "30d", token) {
    try {
      const [
        bookingStats,
        userStats,
        vehicleStats,
        revenueStats,
        requestStats,
      ] = await Promise.all([
        this.getBookingStats(timeRange, token),
        this.getUserStats(timeRange, token),
        this.getVehicleStats(timeRange, token),
        this.getRevenueStats(timeRange, token),
        this.getRequestStats(timeRange, token),
      ]);

      return {
        bookings: bookingStats,
        users: userStats,
        vehicles: vehicleStats,
        revenue: revenueStats,
        requests: requestStats,
        timeRange,
      };
    } catch (error) {
      console.error("Error getting dashboard stats:", error);
      throw error;
    }
  }

  /**
   * Get booking statistics
   */
  async getBookingStats(timeRange, token) {
    try {
      // This will call the new endpoint we need: GET /analytics/bookings/stats
      const stats = await bookingService.get("/analytics/bookings/stats", {
        params: { timeRange },
        token,
      });

      return {
        total: stats.total || 0,
        active: stats.active || 0,
        completed: stats.completed || 0,
        cancelled: stats.cancelled || 0,
        pending: stats.pending || 0,
        growth: stats.growth || 0,
        byStatus: stats.byStatus || {},
        trend: stats.trend || [],
      };
    } catch (error) {
      console.error("Error getting booking stats:", error);
      return this.getDefaultBookingStats();
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(timeRange, token) {
    try {
      // This will call: GET /analytics/users/stats
      const stats = await userService.get("/analytics/users/stats", {
        params: { timeRange },
        token,
      });

      return {
        total: stats.total || 0,
        active: stats.active || 0,
        newUsers: stats.newUsers || 0,
        renters: stats.renters || 0,
        owners: stats.owners || 0,
        growth: stats.growth || 0,
        byType: stats.byType || {},
        byStatus: stats.byStatus || {},
      };
    } catch (error) {
      console.error("Error getting user stats:", error);
      return this.getDefaultUserStats();
    }
  }

  /**
   * Get vehicle statistics
   */
  async getVehicleStats(timeRange, token) {
    try {
      // This will call: GET /analytics/vehicles/stats
      const stats = await vehicleService.get("/analytics/vehicles/stats", {
        params: { timeRange },
        token,
      });

      return {
        total: stats.total || 0,
        available: stats.available || 0,
        rented: stats.rented || 0,
        maintenance: stats.maintenance || 0,
        growth: stats.growth || 0,
        byType: stats.byType || {},
        byStatus: stats.byStatus || {},
        topPerforming: stats.topPerforming || [],
      };
    } catch (error) {
      console.error("Error getting vehicle stats:", error);
      return this.getDefaultVehicleStats();
    }
  }

  /**
   * Get revenue statistics
   */
  async getRevenueStats(timeRange, token) {
    try {
      // This will call: GET /analytics/payments/revenue
      const stats = await paymentService.get("/analytics/payments/revenue", {
        params: { timeRange },
        token,
      });

      return {
        totalRevenue: stats.totalRevenue || 0,
        deposits: stats.deposits || 0,
        finalPayments: stats.finalPayments || 0,
        refunds: stats.refunds || 0,
        netRevenue: stats.netRevenue || 0,
        growth: stats.growth || 0,
        trend: stats.trend || [],
        byProvider: stats.byProvider || {},
      };
    } catch (error) {
      console.error("Error getting revenue stats:", error);
      return this.getDefaultRevenueStats();
    }
  }

  /**
   * Get support request statistics
   */
  async getRequestStats(timeRange, token) {
    try {
      // This will call: GET /analytics/requests/stats
      const stats = await requestService.get("/analytics/requests/stats", {
        params: { timeRange },
        token,
      });

      return {
        total: stats.total || 0,
        pending: stats.pending || 0,
        approved: stats.approved || 0,
        denied: stats.denied || 0,
        byCategory: stats.byCategory || {},
        byStatus: stats.byStatus || {},
        avgResponseTime: stats.avgResponseTime || 0,
      };
    } catch (error) {
      console.error("Error getting request stats:", error);
      return this.getDefaultRequestStats();
    }
  }

  /**
   * Get detailed booking analytics
   */
  async getBookingAnalytics(filters = {}, token) {
    try {
      const analytics = await bookingService.get(
        "/analytics/bookings/detailed",
        {
          params: { ...filters },
          token,
        },
      );

      return {
        summary: analytics.summary || {},
        breakdown: analytics.breakdown || [],
        topVehicles: analytics.topVehicles || [],
        topCustomers: analytics.topCustomers || [],
        trends: analytics.trends || [],
        filters,
      };
    } catch (error) {
      console.error("Error getting booking analytics:", error);
      throw error;
    }
  }

  /**
   * Get revenue analytics
   */
  async getRevenueAnalytics(filters = {}, token) {
    try {
      const analytics = await paymentService.get(
        "/analytics/payments/detailed",
        {
          params: { ...filters },
          token,
        },
      );

      return {
        summary: analytics.summary || {},
        breakdown: analytics.breakdown || [],
        trends: analytics.trends || [],
        byProvider: analytics.byProvider || [],
        filters,
      };
    } catch (error) {
      console.error("Error getting revenue analytics:", error);
      throw error;
    }
  }

  /**
   * Get user growth analytics
   */
  async getUserGrowthAnalytics(filters = {}, token) {
    try {
      const analytics = await userService.get(
        "/analytics/users/growth",
        {
          params: { ...filters },
          token,
        },
      );

      return {
        growth: analytics.growth || [],
        retention: analytics.retention || {},
        churn: analytics.churn || {},
        demographics: analytics.demographics || {},
        filters,
      };
    } catch (error) {
      console.error("Error getting user growth analytics:", error);
      throw error;
    }
  }

  /**
   * Get staff performance analytics
   */
  async getStaffPerformance(filters = {}, token) {
    try {
      const performance = await requestService.get(
        "/analytics/staff/performance",
        {
          params: { ...filters },
          token,
        },
      );

      return {
        staff: performance.staff || [],
        summary: performance.summary || {},
        filters,
      };
    } catch (error) {
      console.error("Error getting staff performance:", error);
      throw error;
    }
  }

  // Default fallback methods
  getDefaultBookingStats() {
    return {
      total: 0,
      active: 0,
      completed: 0,
      cancelled: 0,
      pending: 0,
      growth: 0,
      byStatus: {},
      trend: [],
    };
  }

  getDefaultUserStats() {
    return {
      total: 0,
      active: 0,
      newUsers: 0,
      renters: 0,
      owners: 0,
      growth: 0,
      byType: {},
      byStatus: {},
    };
  }

  getDefaultVehicleStats() {
    return {
      total: 0,
      available: 0,
      rented: 0,
      maintenance: 0,
      growth: 0,
      byType: {},
      byStatus: {},
      topPerforming: [],
    };
  }

  getDefaultRevenueStats() {
    return {
      totalRevenue: 0,
      deposits: 0,
      finalPayments: 0,
      refunds: 0,
      netRevenue: 0,
      growth: 0,
      trend: [],
      byProvider: {},
    };
  }

  getDefaultRequestStats() {
    return {
      total: 0,
      pending: 0,
      approved: 0,
      denied: 0,
      byCategory: {},
      byStatus: {},
      avgResponseTime: 0,
    };
  }
}

module.exports = new AdminAnalyticsService();
