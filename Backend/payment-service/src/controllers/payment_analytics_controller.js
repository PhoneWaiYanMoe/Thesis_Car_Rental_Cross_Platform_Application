// Backend/payment-service/src/controllers/analytics_controller.js
const pool = require("../config/database");

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
   * 1. GET /analytics/payments/revenue?timeRange=30d
   * Platform-wide revenue statistics (Admin)
   */
  async getPlatformRevenue(req, res, next) {
    try {
      const { timeRange = "30d" } = req.query;
      const { startDate, endDate } = this.getDateRange(timeRange);

      console.log(`📊 Getting platform revenue stats for ${timeRange}`);

      // Get current period revenue stats
      const currentStats = await pool.query(
        `SELECT 
          COUNT(*) FILTER (WHERE type = 'deposit' AND status = 'succeeded') as deposits_count,
          COUNT(*) FILTER (WHERE type = 'final_payment' AND status = 'succeeded') as final_payments_count,
          COALESCE(SUM(amount) FILTER (WHERE type = 'deposit' AND status = 'succeeded'), 0) as deposits_revenue,
          COALESCE(SUM(amount) FILTER (WHERE type = 'final_payment' AND status = 'succeeded'), 0) as final_payments_revenue,
          COALESCE(SUM(amount) FILTER (WHERE status = 'succeeded'), 0) as total_revenue
         FROM transactions
         WHERE created_at BETWEEN $1 AND $2`,
        [startDate, endDate],
      );

      // Get refunds
      const refundsResult = await pool.query(
        `SELECT COALESCE(SUM(amount), 0) as total_refunds
         FROM refunds
         WHERE initiated_at BETWEEN $1 AND $2
         AND status IN ('succeeded', 'processing')`,
        [startDate, endDate],
      );

      // Get previous period for growth calculation
      const previousPeriodStart = new Date(
        startDate.getTime() - (endDate.getTime() - startDate.getTime()),
      );
      const previousStats = await pool.query(
        `SELECT COALESCE(SUM(amount), 0) as total
         FROM transactions
         WHERE created_at BETWEEN $1 AND $2
         AND status = 'succeeded'`,
        [previousPeriodStart, startDate],
      );

      // Get daily trend data
      const trendData = await pool.query(
        `SELECT 
          DATE(created_at) as date,
          COALESCE(SUM(amount) FILTER (WHERE type = 'deposit' AND status = 'succeeded'), 0) as deposits,
          COALESCE(SUM(amount) FILTER (WHERE type = 'final_payment' AND status = 'succeeded'), 0) as final_payments,
          COALESCE(SUM(amount) FILTER (WHERE status = 'succeeded'), 0) as net
         FROM transactions
         WHERE created_at BETWEEN $1 AND $2
         GROUP BY DATE(created_at)
         ORDER BY DATE(created_at) ASC`,
        [startDate, endDate],
      );

      // Get refunds trend
      const refundsTrend = await pool.query(
        `SELECT 
          DATE(initiated_at) as date,
          COALESCE(SUM(amount), 0) as refunds
         FROM refunds
         WHERE initiated_at BETWEEN $1 AND $2
         GROUP BY DATE(initiated_at)`,
        [startDate, endDate],
      );

      // Get provider breakdown
      const providerBreakdown = await pool.query(
        `SELECT 
          provider,
          COALESCE(SUM(amount), 0) as revenue,
          COUNT(*) as transaction_count
         FROM transactions
         WHERE created_at BETWEEN $1 AND $2
         AND status = 'succeeded'
         GROUP BY provider`,
        [startDate, endDate],
      );

      const stats = currentStats.rows[0];
      const totalRefunds = parseInt(refundsResult.rows[0].total_refunds);
      const totalRevenue = parseInt(stats.total_revenue);
      const netRevenue = totalRevenue - totalRefunds;

      const growth = this.calculateGrowth(
        totalRevenue,
        parseInt(previousStats.rows[0].total),
      );

      // Merge trend data with refunds
      const trendMap = new Map();
      trendData.rows.forEach((row) => {
        const dateStr = row.date.toISOString().split("T")[0];
        trendMap.set(dateStr, {
          deposits: parseInt(row.deposits),
          finalPayments: parseInt(row.final_payments),
          net: parseInt(row.net),
          refunds: 0,
        });
      });

      refundsTrend.rows.forEach((row) => {
        const dateStr = row.date.toISOString().split("T")[0];
        if (trendMap.has(dateStr)) {
          trendMap.get(dateStr).refunds = parseInt(row.refunds);
        } else {
          trendMap.set(dateStr, {
            deposits: 0,
            finalPayments: 0,
            net: 0,
            refunds: parseInt(row.refunds),
          });
        }
      });

      const trend = Array.from(trendMap.entries())
        .map(([date, data]) => ({
          date: date,
          deposits: data.deposits,
          finalPayments: data.finalPayments,
          refunds: data.refunds,
          net: data.net - data.refunds,
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      console.log(
        `✅ Total revenue: ${totalRevenue.toLocaleString()} VND, Net: ${netRevenue.toLocaleString()} VND`,
      );

      res.json({
        totalRevenue: totalRevenue,
        deposits: parseInt(stats.deposits_revenue),
        finalPayments: parseInt(stats.final_payments_revenue),
        refunds: totalRefunds,
        netRevenue: netRevenue,
        growth: parseFloat(growth.toFixed(2)),
        trend: trend,
        byProvider: providerBreakdown.rows.reduce((acc, row) => {
          acc[row.provider] = parseInt(row.revenue);
          return acc;
        }, {}),
      });
    } catch (error) {
      console.error("❌ Get platform revenue error:", error);
      next(error);
    }
  }

  /**
   * 2. GET /analytics/payments/detailed
   * Detailed payment analytics (Admin)
   */
  async getDetailedPaymentAnalytics(req, res, next) {
    try {
      const { startDate, endDate, provider } = req.query;

      let query = `
        SELECT 
          COUNT(*) as total_transactions,
          COALESCE(SUM(amount), 0) as total_revenue,
          AVG(amount) as average_transaction,
          COUNT(*) FILTER (WHERE status = 'succeeded') as successful_count,
          COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
          COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_count
        FROM transactions
        WHERE 1=1
      `;

      const params = [];
      let paramIndex = 1;

      if (startDate) {
        query += ` AND created_at >= $${paramIndex}`;
        params.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        query += ` AND created_at <= $${paramIndex}`;
        params.push(endDate);
        paramIndex++;
      }

      if (provider) {
        query += ` AND provider = $${paramIndex}`;
        params.push(provider);
        paramIndex++;
      }

      const result = await pool.query(query, params);
      const stats = result.rows[0];

      const totalTransactions = parseInt(stats.total_transactions);
      const successfulCount = parseInt(stats.successful_count);
      const successRate =
        totalTransactions > 0 ? successfulCount / totalTransactions : 0;

      res.json({
        summary: {
          totalTransactions: totalTransactions,
          totalRevenue: parseInt(stats.total_revenue),
          averageTransaction: parseFloat(
            (stats.average_transaction || 0).toFixed(2),
          ),
          successRate: parseFloat((successRate * 100).toFixed(2)),
        },
        breakdown: {
          successful: successfulCount,
          failed: parseInt(stats.failed_count),
          cancelled: parseInt(stats.cancelled_count),
        },
      });
    } catch (error) {
      console.error("❌ Get detailed payment analytics error:", error);
      next(error);
    }
  }

  /**
   * 3. GET /analytics/payments/owner/:ownerId/revenue?timeRange=30d
   * Owner revenue statistics
   */
  async getOwnerRevenue(req, res, next) {
    try {
      const { ownerId } = req.params;
      const { timeRange = "30d" } = req.query;
      const { startDate, endDate } = this.getDateRange(timeRange);

      console.log(`📊 Getting revenue stats for owner: ${ownerId}`);

      // Verify ownership (if not admin)
      if (req.user.role !== "admin" && req.user.userId !== ownerId) {
        return res.status(403).json({
          error: "Unauthorized to view these statistics",
        });
      }

      // Get owner's revenue from transactions
      // Note: We need to join with bookings to get owner_id
      // Since we don't have direct access to bookings table, we'll use gRPC or metadata
      const revenueStats = await pool.query(
        `SELECT 
          COUNT(*) FILTER (WHERE type = 'deposit' AND status = 'succeeded') as deposit_count,
          COUNT(*) FILTER (WHERE type = 'final_payment' AND status = 'succeeded') as final_payment_count,
          COALESCE(SUM(amount) FILTER (WHERE type = 'deposit' AND status = 'succeeded'), 0) as deposit_revenue,
          COALESCE(SUM(amount) FILTER (WHERE type = 'final_payment' AND status = 'succeeded'), 0) as final_payment_revenue,
          COALESCE(SUM(amount) FILTER (WHERE status = 'succeeded'), 0) as total_revenue,
          COALESCE(SUM(amount) FILTER (WHERE status IN ('pending', 'processing')), 0) as pending_revenue,
          AVG(amount) FILTER (WHERE status = 'succeeded') as avg_booking_value
         FROM transactions
         WHERE created_at BETWEEN $1 AND $2
         AND metadata->>'ownerId' = $3`,
        [startDate, endDate, ownerId],
      );

      // Get refunded amounts
      const refundStats = await pool.query(
        `SELECT COALESCE(SUM(r.amount), 0) as refunded_amount
        FROM refunds r
        JOIN transactions t ON r.transaction_id = t.transaction_id
        WHERE r.initiated_at BETWEEN $1 AND $2
        AND t.metadata->>'ownerId' = $3
        AND r.status IN ('succeeded', 'processing')`,
        [startDate, endDate, ownerId],
      );

      // Get previous period for growth
      const previousPeriodStart = new Date(
        startDate.getTime() - (endDate.getTime() - startDate.getTime()),
      );
      const previousRevenue = await pool.query(
        `SELECT COALESCE(SUM(amount), 0) as total
         FROM transactions
         WHERE created_at BETWEEN $1 AND $2
         AND metadata->>'ownerId' = $3
         AND status = 'succeeded'`,
        [previousPeriodStart, startDate, ownerId],
      );

      // Get daily trend
      const trendData = await pool.query(
        `SELECT 
          DATE(created_at) as date,
          COALESCE(SUM(amount) FILTER (WHERE type = 'deposit'), 0) as deposits,
          COALESCE(SUM(amount) FILTER (WHERE type = 'final_payment'), 0) as final_payments,
          COALESCE(SUM(amount), 0) as total
         FROM transactions
         WHERE created_at BETWEEN $1 AND $2
         AND metadata->>'ownerId' = $3
         AND status = 'succeeded'
         GROUP BY DATE(created_at)
         ORDER BY DATE(created_at) ASC`,
        [startDate, endDate, ownerId],
      );

      const stats = revenueStats.rows[0];
      const totalRevenue = parseInt(stats.total_revenue);
      const refundedAmount = parseInt(refundStats.rows[0].refunded_amount);
      const completedRevenue = totalRevenue - refundedAmount;

      const growth = this.calculateGrowth(
        totalRevenue,
        parseInt(previousRevenue.rows[0].total),
      );

      console.log(
        `✅ Owner ${ownerId} revenue: ${totalRevenue.toLocaleString()} VND`,
      );

      res.json({
        totalRevenue: totalRevenue,
        pendingRevenue: parseInt(stats.pending_revenue),
        completedRevenue: completedRevenue,
        refundedAmount: refundedAmount,
        averageBookingValue: parseFloat(
          parseFloat(stats.avg_booking_value || 0).toFixed(2),
        ),
        growth: parseFloat(growth.toFixed(2)),
        trend: trendData.rows.map((row) => ({
          date: row.date.toISOString().split("T")[0],
          deposits: parseInt(row.deposits),
          finalPayments: parseInt(row.final_payments),
          total: parseInt(row.total),
        })),
        topEarningVehicles: [], // Would need vehicle service integration
      });
    } catch (error) {
      console.error("❌ Get owner revenue error:", error);
      next(error);
    }
  }

  /**
   * 4. GET /analytics/payments/vehicle/:vehicleId/revenue?timeRange=30d
   * Vehicle revenue statistics
   */
  async getVehicleRevenue(req, res, next) {
    try {
      const { vehicleId } = req.params;
      const { timeRange = "30d" } = req.query;
      const { startDate, endDate } = this.getDateRange(timeRange);

      console.log(`📊 Getting revenue stats for vehicle: ${vehicleId}`);

      // Get vehicle revenue
      const revenueStats = await pool.query(
        `SELECT 
          COALESCE(SUM(amount), 0) as total_revenue,
          AVG(amount) as avg_booking_value,
          COUNT(*) FILTER (WHERE status = 'succeeded') as booking_count
         FROM transactions
         WHERE created_at BETWEEN $1 AND $2
         AND metadata->>'vehicleId' = $3
         AND status = 'succeeded'`,
        [startDate, endDate, vehicleId],
      );

      // Get daily trend
      const trendData = await pool.query(
        `SELECT 
          DATE(created_at) as date,
          COALESCE(SUM(amount), 0) as revenue,
          COUNT(*) as bookings
         FROM transactions
         WHERE created_at BETWEEN $1 AND $2
         AND metadata->>'vehicleId' = $3
         AND status = 'succeeded'
         GROUP BY DATE(created_at)
         ORDER BY DATE(created_at) ASC`,
        [startDate, endDate, vehicleId],
      );

      const stats = revenueStats.rows[0];

      console.log(
        `✅ Vehicle ${vehicleId} revenue: ${parseInt(
          stats.total_revenue,
        ).toLocaleString()} VND`,
      );

      res.json({
        totalRevenue: parseInt(stats.total_revenue),
        averageBookingValue: parseFloat(
          parseFloat(stats.avg_booking_value || 0).toFixed(2),
        ),
        bookingCount: parseInt(stats.booking_count),
        trend: trendData.rows.map((row) => ({
          date: row.date.toISOString().split("T")[0],
          revenue: parseInt(row.revenue),
          bookings: parseInt(row.bookings),
        })),
      });
    } catch (error) {
      console.error("❌ Get vehicle revenue error:", error);
      next(error);
    }
  }
}

module.exports = new AnalyticsController();
