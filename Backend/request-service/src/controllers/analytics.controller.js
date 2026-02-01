// Backend/request-service/src/controllers/analytics.controller.js
const pool = require("../config/database");
const {
  successResponse,
  errorResponse,
} = require("../utils/responseFormatter");

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
   * 1. GET /analytics/requests/stats?timeRange=30d
   * Platform request statistics
   */
  async getRequestStats(req, res, next) {
    try {
      const { timeRange = "30d" } = req.query;
      const { startDate, endDate } = this.getDateRange(timeRange);

      // Get request stats
      const stats = await pool.query(
        `SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'pending') as pending,
          COUNT(*) FILTER (WHERE status = 'approved') as approved,
          COUNT(*) FILTER (WHERE status = 'denied') as denied,
          COUNT(*) FILTER (WHERE status = 'inprocess') as inprocess,
          COUNT(*) FILTER (WHERE status = 'onhold') as onhold
         FROM requests
         WHERE created_at BETWEEN $1 AND $2`,
        [startDate, endDate],
      );

      // Get category breakdown
      const categoryBreakdown = await pool.query(
        `SELECT 
          category,
          COUNT(*) as count
         FROM requests
         WHERE created_at BETWEEN $1 AND $2
         GROUP BY category`,
        [startDate, endDate],
      );

      // Get status breakdown
      const statusBreakdown = await pool.query(
        `SELECT 
          status,
          COUNT(*) as count
         FROM requests
         WHERE created_at BETWEEN $1 AND $2
         GROUP BY status`,
        [startDate, endDate],
      );

      // Calculate average response time (in hours)
      const avgResponseTime = await pool.query(
        `SELECT 
          AVG(EXTRACT(EPOCH FROM (handled_at - created_at)) / 3600) as avg_hours
         FROM requests
         WHERE handled_at IS NOT NULL
         AND created_at BETWEEN $1 AND $2`,
        [startDate, endDate],
      );

      const row = stats.rows[0];

      res.json(
        successResponse({
          total: parseInt(row.total),
          pending: parseInt(row.pending),
          approved: parseInt(row.approved),
          denied: parseInt(row.denied),
          byCategory: categoryBreakdown.rows.reduce((acc, cat) => {
            acc[cat.category] = parseInt(cat.count);
            return acc;
          }, {}),
          byStatus: statusBreakdown.rows.reduce((acc, status) => {
            acc[status.status] = parseInt(status.count);
            return acc;
          }, {}),
          avgResponseTime: Number(
            avgResponseTime.rows[0].avg_hours || 0,
          ).toFixed(2),
        }),
      );
    } catch (error) {
      console.error("❌ Get request stats error:", error);
      next(error);
    }
  }

  /**
   * 2. GET /analytics/staff/performance?timeRange=30d
   * Staff performance analytics
   */
  async getStaffPerformance(req, res, next) {
    try {
      const { timeRange = "30d" } = req.query;
      const { startDate, endDate } = this.getDateRange(timeRange);

      // Get staff performance data
      const staffData = await pool.query(
        `SELECT 
          handled_by as staff_id,
          COUNT(*) as total_handled,
          COUNT(*) FILTER (WHERE status = 'approved') as approved,
          COUNT(*) FILTER (WHERE status = 'denied') as denied,
          AVG(EXTRACT(EPOCH FROM (handled_at - created_at)) / 3600) as avg_response_time
         FROM requests
         WHERE handled_by IS NOT NULL
         AND created_at BETWEEN $1 AND $2
         GROUP BY handled_by`,
        [startDate, endDate],
      );

      // Get category breakdown per staff
      const categoryByStaff = await pool.query(
        `SELECT 
          handled_by as staff_id,
          category,
          COUNT(*) as count
         FROM requests
         WHERE handled_by IS NOT NULL
         AND created_at BETWEEN $1 AND $2
         GROUP BY handled_by, category`,
        [startDate, endDate],
      );

      // Build category map
      const categoryMap = {};
      categoryByStaff.rows.forEach((row) => {
        if (!categoryMap[row.staff_id]) {
          categoryMap[row.staff_id] = {};
        }
        categoryMap[row.staff_id][row.category] = parseInt(row.count);
      });

      // Calculate totals
      let totalStaff = staffData.rows.length;
      let totalHandled = 0;
      let totalApproved = 0;

      const staff = staffData.rows.map((row) => {
        const handled = parseInt(row.total_handled);
        const approved = parseInt(row.approved);
        totalHandled += handled;
        totalApproved += approved;

        return {
          staffId: row.staff_id,
          username: row.staff_id, // Could be enriched via user service
          totalHandled: handled,
          approved: approved,
          denied: parseInt(row.denied),
          avgResponseTime: parseFloat(
            Number(row.avg_response_time || 0).toFixed(2),
          ),
          approvalRate:
            handled > 0 ? parseFloat((approved / handled).toFixed(2)) : 0,
          byCategory: categoryMap[row.staff_id] || {},
        };
      });

      res.json(
        successResponse({
          staff: staff,
          summary: {
            totalStaff: totalStaff,
            totalHandled: totalHandled,
            avgResponseTime:
              staff.length > 0
                ? parseFloat(
                    (
                      staff.reduce((sum, s) => sum + s.avgResponseTime, 0) /
                      staff.length
                    ).toFixed(2),
                  )
                : 0,
            avgApprovalRate:
              totalHandled > 0
                ? parseFloat((totalApproved / totalHandled).toFixed(2))
                : 0,
          },
        }),
      );
    } catch (error) {
      console.error("❌ Get staff performance error:", error);
      next(error);
    }
  }
}

module.exports = new AnalyticsController();
