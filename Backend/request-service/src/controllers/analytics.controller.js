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
        startDate = new Date(0); // Default to all time
    }

    return { startDate, endDate: now };
  }

  /**
   * 1. GET /analytics/requests/stats?timeRange=30d
   * Platform request statistics
   */
  async getRequestStats(req, res, next) {
    try {
      const { timeRange } = req.query;
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
  /**
   * GET /analytics/staff/performance?timeRange=30d
   */
  async getStaffPerformance(req, res, next) {
    try {
      const { timeRange } = req.query;
      const { startDate, endDate } = this.getDateRange(timeRange);

      /**
       * 1️⃣ Final decision per request (approved / denied)
       * - take the LATEST decision only
       */
      const finalDecisionResult = await pool.query(
        `
      WITH final_decision AS (
        SELECT DISTINCT ON (ra.request_id)
          ra.request_id,
          ra.performed_by AS staff_id,
          ra.action,
          ra.created_at
        FROM request_actions ra
        WHERE ra.action IN ('request_approved', 'request_denied')
          AND ra.created_at BETWEEN $1 AND $2
        ORDER BY ra.request_id, ra.created_at DESC
      )
      SELECT
        staff_id,
        COUNT(DISTINCT request_id) AS total_handled,
        COUNT(*) FILTER (WHERE action = 'request_approved') AS approved,
        COUNT(*) FILTER (WHERE action = 'request_denied') AS denied
      FROM final_decision
      GROUP BY staff_id
      `,
        [startDate, endDate],
      );

      /**
       * 2️⃣ Average response time
       * - first meaningful staff action per request
       */
      const responseTimeResult = await pool.query(
        `
      WITH first_action AS (
        SELECT
          ra.request_id,
          ra.performed_by AS staff_id,
          MIN(ra.created_at) AS first_action_at
        FROM request_actions ra
        WHERE ra.action != 'request_created'
          AND ra.created_at BETWEEN $1 AND $2
        GROUP BY ra.request_id, ra.performed_by
      )
      SELECT
        fa.staff_id,
        AVG(EXTRACT(EPOCH FROM (fa.first_action_at - r.created_at)) / 3600)
          AS avg_response_time
      FROM first_action fa
      JOIN requests r ON r.id = fa.request_id
      GROUP BY fa.staff_id
      `,
        [startDate, endDate],
      );

      /**
       * 3️⃣ Category breakdown (unique requests)
       */
      const categoryResult = await pool.query(
        `
      SELECT
        ra.performed_by AS staff_id,
        r.category,
        COUNT(DISTINCT ra.request_id) AS count
      FROM request_actions ra
      JOIN requests r ON r.id = ra.request_id
      WHERE ra.action != 'request_created'
        AND ra.created_at BETWEEN $1 AND $2
      GROUP BY ra.performed_by, r.category
      `,
        [startDate, endDate],
      );

      /**
       * 4️⃣ Build maps
       */
      const responseTimeMap = {};
      responseTimeResult.rows.forEach((row) => {
        responseTimeMap[row.staff_id] = parseFloat(
          Number(row.avg_response_time || 0).toFixed(2),
        );
      });

      const categoryMap = {};
      categoryResult.rows.forEach((row) => {
        if (!categoryMap[row.staff_id]) {
          categoryMap[row.staff_id] = {};
        }
        categoryMap[row.staff_id][row.category] = parseInt(row.count);
      });

      /**
       * 5️⃣ Build staff list
       */
      let totalHandled = 0;
      let totalApproved = 0;

      const staff = finalDecisionResult.rows.map((row) => {
        const handled = parseInt(row.total_handled);
        const approved = parseInt(row.approved);
        const denied = parseInt(row.denied);

        totalHandled += handled;
        totalApproved += approved;

        return {
          staffId: row.staff_id,
          username: row.staff_id, // enrichment happens in user-service
          totalHandled: handled,
          approved,
          denied,
          avgResponseTime: responseTimeMap[row.staff_id] ?? 0,
          approvalRate:
            handled > 0 ? parseFloat((approved / handled).toFixed(2)) : 0,
          byCategory: categoryMap[row.staff_id] || {},
        };
      });

      /**
       * 6️⃣ Summary
       */
      const summary = {
        totalStaff: staff.length,
        totalHandled,
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
      };

      res.json({
        success: true,
        message: "Success",
        staff,
        summary,
      });
    } catch (error) {
      console.error("❌ Get staff performance error:", error);
      next(error);
    }
  }
}

module.exports = new AnalyticsController();
