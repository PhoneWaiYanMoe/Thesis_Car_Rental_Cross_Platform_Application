const pool = require("../config/database");
const vehicleHttpClient = require("../clients/vehicle_http_client");

class AnalyticsController {
  /**
   * Helper: Parse time range to date range
   */
  getDateRange(timeRange) {
    const now = new Date();
    let startDate;

    switch (timeRange) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "1y":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return { startDate, endDate: now };
  }

  /**
   * Helper: Calculate growth percentage
   */
  calculateGrowth(current, previous) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  /**
   * 1. GET /analytics/bookings/stats?timeRange=30d
   * Platform-wide booking statistics (Admin)
   */
  async getPlatformStats(req, res, next) {
    try {
      const { timeRange = "30d" } = req.query;
      const { startDate, endDate } = this.getDateRange(timeRange);

      // Get stats for current period
      const currentStats = await pool.query(
        `SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'pending_payment') as pending_payment,
          COUNT(*) FILTER (WHERE status = 'pending') as pending,
          COUNT(*) FILTER (WHERE status = 'booking') as booking,
          COUNT(*) FILTER (WHERE status = 'picked_up') as active,
          COUNT(*) FILTER (WHERE status = 'completed') as completed,
          COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled
         FROM bookings
         WHERE created_at BETWEEN $1 AND $2`,
        [startDate, endDate],
      );

      // Get stats for previous period (for growth calculation)
      const previousPeriodStart = new Date(
        startDate.getTime() - (endDate.getTime() - startDate.getTime()),
      );
      const previousStats = await pool.query(
        `SELECT COUNT(*) as total FROM bookings WHERE created_at BETWEEN $1 AND $2`,
        [previousPeriodStart, startDate],
      );

      // Get daily trend data
      const trendData = await pool.query(
        `SELECT 
          DATE(created_at) as date,
          COUNT(*) as count,
          COALESCE(SUM(total_amount), 0) as revenue
         FROM bookings
         WHERE created_at BETWEEN $1 AND $2
         GROUP BY DATE(created_at)
         ORDER BY DATE(created_at) ASC`,
        [startDate, endDate],
      );

      const stats = currentStats.rows[0];
      const growth = this.calculateGrowth(
        parseInt(stats.total),
        parseInt(previousStats.rows[0].total),
      );

      res.json({
        success: true,
        total: parseInt(stats.total),
        active: parseInt(stats.active || 0),
        completed: parseInt(stats.completed || 0),
        cancelled: parseInt(stats.cancelled || 0),
        pending: parseInt(stats.pending || 0),
        growth: parseFloat(growth.toFixed(2)),
        byStatus: {
          pending_payment: parseInt(stats.pending_payment || 0),
          pending: parseInt(stats.pending || 0),
          booking: parseInt(stats.booking || 0),
          picked_up: parseInt(stats.active || 0),
          completed: parseInt(stats.completed || 0),
          cancelled: parseInt(stats.cancelled || 0),
        },
        trend: trendData.rows.map((row) => ({
          date: row.date.toISOString().split("T")[0],
          count: parseInt(row.count),
          revenue: parseInt(row.revenue),
        })),
      });
    } catch (error) {
      console.error("❌ Get platform stats error:", error);
      next(error);
    }
  }

  /**
   * 2. GET /analytics/bookings/owner/:ownerId/stats?timeRange=30d
   * Owner booking statistics
   */
  async getOwnerStats(req, res, next) {
    try {
      const { ownerId } = req.params;
      const { timeRange = "30d" } = req.query;
      const { startDate, endDate } = this.getDateRange(timeRange);

      console.log(`📊 Fetching analytics for owner: ${ownerId}`);

      // Try to get owner's vehicles from vehicle service
      let ownerVehicleIds = [];

      try {
        const vehicles = await vehicleHttpClient.getVehiclesByOwner(
          ownerId,
          req.headers.authorization,
        );
        ownerVehicleIds = vehicles.map((v) => v.id);
        console.log(`   Found ${ownerVehicleIds.length} vehicles`);
      } catch (error) {
        if (error.response) {
          return res.status(error.response.status).json({
            success: false,
            error:
              error.response.data?.error || "Vehicle service request failed",
          });
        }

        return res.status(503).json({
          success: false,
          error:
            "Vehicle service is temporarily unavailable. Please try again later.",
        });
      }

      // If owner has no vehicles, return empty stats
      if (ownerVehicleIds.length === 0) {
        console.log(`   Owner has no vehicles`);
        return res.json({
          success: true,
          message: "Owner has no registered vehicles",
          totalBookings: 0,
          activeBookings: 0,
          completedBookings: 0,
          cancelledBookings: 0,
          acceptanceRate: 0,
          averageDuration: 0,
          trend: [],
          byStatus: {},
        });
      }

      // Get bookings for owner's vehicles
      const stats = await pool.query(
        `SELECT 
          COUNT(*) as total_bookings,
          COUNT(*) FILTER (WHERE status IN ('booking', 'picked_up')) as active_bookings,
          COUNT(*) FILTER (WHERE status = 'completed') as completed_bookings,
          COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_bookings,
          AVG(EXTRACT(EPOCH FROM (end_date - start_date)) / 86400) as avg_duration
         FROM bookings
         WHERE vehicle_id = ANY($1::uuid[])
         AND created_at BETWEEN $2 AND $3`,
        [ownerVehicleIds, startDate, endDate],
      );

      // Calculate acceptance rate
      const acceptanceData = await pool.query(
        `SELECT 
          COUNT(*) as total_requests,
          COUNT(*) FILTER (WHERE status IN ('booking', 'picked_up', 'completed')) as accepted
         FROM bookings
         WHERE vehicle_id = ANY($1::uuid[])
         AND created_at BETWEEN $2 AND $3`,
        [ownerVehicleIds, startDate, endDate],
      );

      const acceptanceRate =
        acceptanceData.rows[0].total_requests > 0
          ? (
              acceptanceData.rows[0].accepted /
              acceptanceData.rows[0].total_requests
            ).toFixed(2)
          : 0;

      // Get trend data
      const trendData = await pool.query(
        `SELECT 
          DATE(created_at) as date,
          COUNT(*) as bookings,
          status
         FROM bookings
         WHERE vehicle_id = ANY($1::uuid[])
         AND created_at BETWEEN $2 AND $3
         GROUP BY DATE(created_at), status
         ORDER BY DATE(created_at) ASC`,
        [ownerVehicleIds, startDate, endDate],
      );

      // Get status breakdown
      const statusData = await pool.query(
        `SELECT 
          status,
          COUNT(*) as count
         FROM bookings
         WHERE vehicle_id = ANY($1::uuid[])
         AND created_at BETWEEN $2 AND $3
         GROUP BY status`,
        [ownerVehicleIds, startDate, endDate],
      );

      const row = stats.rows[0];

      res.json({
        success: true,
        totalBookings: parseInt(row.total_bookings),
        activeBookings: parseInt(row.active_bookings),
        completedBookings: parseInt(row.completed_bookings),
        cancelledBookings: parseInt(row.cancelled_bookings),
        acceptanceRate: parseFloat(acceptanceRate),
        averageDuration: parseFloat((row.avg_duration || 0).toFixed(1)),
        trend: trendData.rows.map((t) => ({
          date: t.date.toISOString().split("T")[0],
          bookings: parseInt(t.bookings),
          status: t.status,
        })),
        byStatus: statusData.rows.reduce((acc, row) => {
          acc[row.status] = parseInt(row.count);
          return acc;
        }, {}),
      });
    } catch (error) {
      console.error("❌ Get owner stats error:", error);
      next(error);
    }
  }

  /**
   * 3. GET /analytics/bookings/vehicle/:vehicleId/stats?timeRange=30d
   * Vehicle booking statistics
   */
  async getVehicleStats(req, res, next) {
    try {
      const { vehicleId } = req.params;
      const { timeRange = "30d" } = req.query;
      const { startDate, endDate } = this.getDateRange(timeRange);

      // Get vehicle booking stats
      const stats = await pool.query(
        `SELECT 
          COUNT(*) as total_bookings,
          COUNT(*) FILTER (WHERE status IN ('booking', 'picked_up')) as active_bookings,
          COUNT(*) FILTER (WHERE status = 'completed') as completed_bookings,
          COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_bookings,
          AVG(EXTRACT(EPOCH FROM (end_date - start_date)) / 86400) as avg_duration,
          SUM(EXTRACT(EPOCH FROM (end_date - start_date)) / 86400) FILTER (WHERE status = 'completed') as total_rental_days
         FROM bookings
         WHERE vehicle_id = $1 
         AND created_at BETWEEN $2 AND $3`,
        [vehicleId, startDate, endDate],
      );

      // Calculate utilization rate
      const totalDaysInPeriod = Math.ceil(
        (endDate - startDate) / (1000 * 60 * 60 * 24),
      );
      const totalRentalDays = stats.rows[0].total_rental_days || 0;
      const utilizationRate = (totalRentalDays / totalDaysInPeriod).toFixed(2);

      // Get trend data
      const trendData = await pool.query(
        `SELECT 
          DATE(created_at) as date,
          COUNT(*) as bookings,
          status
         FROM bookings
         WHERE vehicle_id = $1 
         AND created_at BETWEEN $2 AND $3
         GROUP BY DATE(created_at), status
         ORDER BY DATE(created_at) ASC`,
        [vehicleId, startDate, endDate],
      );

      const row = stats.rows[0];

      res.json({
        success: true,
        totalBookings: parseInt(row.total_bookings),
        activeBookings: parseInt(row.active_bookings),
        completedBookings: parseInt(row.completed_bookings),
        cancelledBookings: parseInt(row.cancelled_bookings),
        utilizationRate: parseFloat(utilizationRate),
        averageDuration: parseFloat((row.avg_duration || 0).toFixed(1)),
        trend: trendData.rows.map((t) => ({
          date: t.date.toISOString().split("T")[0],
          bookings: parseInt(t.bookings),
          status: t.status,
        })),
      });
    } catch (error) {
      console.error("❌ Get vehicle stats error:", error);
      next(error);
    }
  }

  // Analytics for owner & customer (JWT-based)
  async getBookingAnalyticsOwner(req, res, next) {
    try {
      const userId = req.user.userId;

      const { range = "all", startDate, endDate } = req.query;

      let dateFilter = "";
      const params = [];
      let idx = 1;

      // ---- Time range handling ----
      switch (range) {
        case "today":
          dateFilter = `AND created_at >= CURRENT_DATE`;
          break;

        case "this_week":
          dateFilter = `AND created_at >= date_trunc('week', CURRENT_DATE)`;
          break;

        case "this_month":
          dateFilter = `AND created_at >= date_trunc('month', CURRENT_DATE)`;
          break;

        case "this_year":
          dateFilter = `AND created_at >= date_trunc('year', CURRENT_DATE)`;
          break;

        case "custom":
          if (!startDate || !endDate) {
            return res.status(400).json({
              error: "startDate and endDate are required for custom range",
            });
          }
          dateFilter = `AND created_at BETWEEN $${idx} AND $${idx + 1}`;
          params.push(startDate, endDate);
          idx += 2;
          break;

        case "all":
        default:
          // no filter
          break;
      }

      // ---- BOOKINGS AS CUSTOMER ----
      const customerQuery = `
      SELECT
        COUNT(*) AS total_bookings,
        COUNT(*) FILTER (WHERE status = 'completed') AS completed_bookings,
        COALESCE(SUM(total_amount) FILTER (WHERE status = 'completed'), 0) AS completed_revenue
      FROM bookings
      WHERE customer_id = $${idx}
      ${dateFilter}
    `;
      params.push(userId);
      idx++;

      const customerResult = await pool.query(customerQuery, params);
      const customerStats = customerResult.rows[0];

      // ---- GET OWNER VEHICLES (via gRPC) ----
      let ownerVehicleIds = [];
      try {
        const vehicles = await vehicleGrpcClient.getOwnerVehicles(userId);
        ownerVehicleIds = vehicles.map((v) => v.vehicle_id);
      } catch (err) {
        return res.status(503).json({
          error: "Vehicle service unavailable",
        });
      }

      if (ownerVehicleIds.length === 0) {
        // Owner has no vehicles — return zeroed analytics safely
        return res.json({
          range,
          customer: {
            totalBookings: Number(customerStats.total_bookings),
            completedBookings: Number(customerStats.completed_bookings),
            completedRevenue: Number(customerStats.completed_revenue),
          },
          owner: {
            totalBookings: 0,
            completedBookings: 0,
            completedRevenue: 0,
            expectedRevenue: 0,
            activeBookings: 0,
            cancelledBookings: 0,
            pendingToAccept: 0,
          },
        });
      }

      // ---- BOOKINGS AS OWNER ----
      const ownerQuery = `
      SELECT
        COUNT(*) AS total_bookings,
        COUNT(*) FILTER (WHERE status = 'completed') AS completed_bookings,
        COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled_bookings,
        COUNT(*) FILTER (WHERE status = 'pending') AS pending_to_accept,
        COUNT(*) AS active_bookings,
        COALESCE(SUM(total_amount) FILTER (WHERE status = 'completed'), 0) AS completed_revenue,
        COALESCE(SUM(total_amount) FILTER (WHERE status != 'completed'), 0) AS expected_revenue
      FROM bookings
      WHERE vehicle_id = ANY($${idx})
      ${dateFilter}
    `;
      params.push(ownerVehicleIds);

      const ownerResult = await pool.query(ownerQuery, params);
      const ownerStats = ownerResult.rows[0];

      // ---- FINAL RESPONSE ----
      res.json({
        range,
        customer: {
          totalBookings: Number(customerStats.total_bookings),
          completedBookings: Number(customerStats.completed_bookings),
          completedRevenue: Number(customerStats.completed_revenue),
        },
        owner: {
          totalBookings: Number(ownerStats.total_bookings),
          completedBookings: Number(ownerStats.completed_bookings),
          completedRevenue: Number(ownerStats.completed_revenue),
          expectedRevenue: Number(ownerStats.expected_revenue),
          activeBookings: Number(ownerStats.active_bookings),
          cancelledBookings: Number(ownerStats.cancelled_bookings),
          pendingToAccept: Number(ownerStats.pending_to_accept),
        },
      });
    } catch (error) {
      console.error("Booking analytics error:", error);
      next(error);
    }
  }
}

module.exports = new AnalyticsController();
