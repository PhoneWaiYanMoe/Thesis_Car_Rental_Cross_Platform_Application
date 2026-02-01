const pool = require("../config/database");

class AnalyticsController {
  /**
   * Helper: Parse time range parameter
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
   * GET /analytics/users/stats?timeRange=30d
   * Platform-wide user statistics
   */
  getUserStats = async (req, res, next) => {
    // ✅ Changed to arrow function
    try {
      const { timeRange = "30d" } = req.query;
      const { startDate, endDate } = this.getDateRange(timeRange);

      // 1. Get total users
      const totalResult = await pool.query(
        "SELECT COUNT(*) as total FROM users",
      );
      const total = parseInt(totalResult.rows[0].total);

      // 2. Get new users in current period
      const newUsersResult = await pool.query(
        `SELECT COUNT(*) as count 
         FROM users 
         WHERE created_at >= $1 AND created_at <= $2`,
        [startDate, endDate],
      );
      const newUsers = parseInt(newUsersResult.rows[0].count);

      // 3. Get new users in previous period (for growth calculation)
      const previousPeriodStart = new Date(
        startDate.getTime() - (endDate.getTime() - startDate.getTime()),
      );
      const previousNewUsersResult = await pool.query(
        `SELECT COUNT(*) as count 
         FROM users 
         WHERE created_at >= $1 AND created_at < $2`,
        [previousPeriodStart, startDate],
      );
      const previousNewUsers = parseInt(previousNewUsersResult.rows[0].count);

      // 4. Calculate growth
      const growth = this.calculateGrowth(newUsers, previousNewUsers);

      // 5. Get users by role (renters vs owners)
      const byTypeResult = await pool.query(
        `SELECT role, COUNT(*) as count 
         FROM users 
         GROUP BY role`,
      );
      const byType = {
        renter: 0,
        owner: 0,
      };
      byTypeResult.rows.forEach((row) => {
        if (row.role === "customer") {
          byType.renter = parseInt(row.count);
        } else if (row.role === "owner") {
          byType.owner = parseInt(row.count);
        }
      });

      // 6. Get users by status
      const byStatusResult = await pool.query(
        `SELECT 
          CASE 
            WHEN is_verified = true THEN 'normal'
            ELSE 'pending'
          END as status,
          COUNT(*) as count
         FROM users
         GROUP BY is_verified`,
      );
      const byStatus = {
        normal: 0,
        stopped: 0,
        banned: 0,
        pending: 0,
      };
      byStatusResult.rows.forEach((row) => {
        byStatus[row.status] = parseInt(row.count);
      });

      // 7. Get active users
      const activeUsersResult = await pool.query(
        `SELECT COUNT(*) as count 
         FROM users 
         WHERE updated_at >= $1 AND updated_at <= $2`,
        [startDate, endDate],
      );
      const active = parseInt(activeUsersResult.rows[0].count);

      // 8. Calculate renters and owners counts
      const renters = byType.renter;
      const owners = byType.owner;

      res.json({
        total,
        active,
        newUsers,
        renters,
        owners,
        growth: parseFloat(growth.toFixed(2)),
        byType,
        byStatus,
      });
    } catch (error) {
      console.error("Get user stats error:", error);
      next(error);
    }
  };

  /**
   * GET /analytics/users/growth
   * User growth analytics with retention and churn
   */
  getUserGrowth = async (req, res, next) => {
    // ✅ Changed to arrow function
    try {
      const { startDate, endDate, groupBy = "day" } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          error: "startDate and endDate are required",
        });
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      // 1. Generate growth trend
      const growthResult = await pool.query(
        `SELECT 
          DATE(created_at) as period,
          COUNT(*) as new_users
         FROM users
         WHERE created_at >= $1 AND created_at <= $2
         GROUP BY DATE(created_at)
         ORDER BY DATE(created_at) ASC`,
        [start, end],
      );

      // 2. Calculate cumulative total users for each period
      let cumulativeTotal = 0;
      const totalUsersBeforeStart = await pool.query(
        `SELECT COUNT(*) as count FROM users WHERE created_at < $1`,
        [start],
      );
      cumulativeTotal = parseInt(totalUsersBeforeStart.rows[0].count);

      const growth = growthResult.rows.map((row) => {
        cumulativeTotal += parseInt(row.new_users);
        return {
          period: row.period,
          newUsers: parseInt(row.new_users),
          totalUsers: cumulativeTotal,
        };
      });

      // 3. Calculate retention rates
      const now = new Date();
      const day7Ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const day30Ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const day90Ago = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

      // Users created 7+ days ago who are still active
      const retention7Result = await pool.query(
        `SELECT 
          COUNT(CASE WHEN updated_at >= $1 THEN 1 END)::float / 
          NULLIF(COUNT(*), 0) as rate
         FROM users
         WHERE created_at < $1`,
        [day7Ago],
      );

      const retention30Result = await pool.query(
        `SELECT 
          COUNT(CASE WHEN updated_at >= $1 THEN 1 END)::float / 
          NULLIF(COUNT(*), 0) as rate
         FROM users
         WHERE created_at < $1`,
        [day30Ago],
      );

      const retention90Result = await pool.query(
        `SELECT 
          COUNT(CASE WHEN updated_at >= $1 THEN 1 END)::float / 
          NULLIF(COUNT(*), 0) as rate
         FROM users
         WHERE created_at < $1`,
        [day90Ago],
      );

      const retention = {
        day7: parseFloat((retention7Result.rows[0].rate || 0).toFixed(2)),
        day30: parseFloat((retention30Result.rows[0].rate || 0).toFixed(2)),
        day90: parseFloat((retention90Result.rows[0].rate || 0).toFixed(2)),
      };

      // 4. Calculate churn
      const churnResult = await pool.query(
        `SELECT COUNT(*) as count
         FROM users
         WHERE updated_at < $1`,
        [day30Ago],
      );
      const churnCount = parseInt(churnResult.rows[0].count);
      const totalUsers = await pool.query(
        "SELECT COUNT(*) as count FROM users",
      );
      const churnRate = churnCount / parseInt(totalUsers.rows[0].count) || 0;

      const churn = {
        rate: parseFloat(churnRate.toFixed(2)),
        count: churnCount,
      };

      // 5. Demographics (by type and status)
      const byTypeResult = await pool.query(
        `SELECT role, COUNT(*) as count 
         FROM users 
         GROUP BY role`,
      );
      const byType = {};
      byTypeResult.rows.forEach((row) => {
        byType[row.role] = parseInt(row.count);
      });

      const byStatusResult = await pool.query(
        `SELECT 
          CASE 
            WHEN is_verified = true THEN 'normal'
            ELSE 'pending'
          END as status,
          COUNT(*) as count
         FROM users
         GROUP BY is_verified`,
      );
      const byStatus = {};
      byStatusResult.rows.forEach((row) => {
        byStatus[row.status] = parseInt(row.count);
      });

      const demographics = {
        byType,
        byStatus,
      };

      res.json({
        growth,
        retention,
        churn,
        demographics,
      });
    } catch (error) {
      console.error("Get user growth error:", error);
      next(error);
    }
  };
}

module.exports = new AnalyticsController();
