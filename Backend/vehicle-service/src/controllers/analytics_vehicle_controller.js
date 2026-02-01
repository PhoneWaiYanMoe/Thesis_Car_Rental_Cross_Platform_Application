// Backend/vehicle-service/src/controllers/analytics_vehicle_controller.js
const pool = require("../config/database");

// ✅ HELPER FUNCTIONS (outside class)
function getDateRange(timeRange) {
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

function calculateGrowth(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

class AnalyticsVehicleController {
  /**
   * GET /analytics/vehicles/stats?timeRange=30d
   * Platform-wide vehicle statistics
   */
  async getVehicleStats(req, res, next) {
    try {
      const { timeRange = "30d" } = req.query;

      // Parse time range - ✅ NOW CALLS THE FUNCTION DIRECTLY
      const { startDate, endDate } = getDateRange(timeRange);

      // Get total vehicles
      const totalResult = await pool.query(
        `SELECT COUNT(*) as total FROM vehicles`,
      );

      // Get vehicles by status
      const statusResult = await pool.query(
        `SELECT 
          COUNT(*) FILTER (WHERE status = 'active') as available,
          COUNT(*) FILTER (WHERE status = 'pending') as maintenance,
          COUNT(*) FILTER (WHERE status = 'stopped') as stopped,
          COUNT(*) FILTER (WHERE status = 'banned') as banned
         FROM vehicles`,
      );

      // Get vehicles by type
      const typeResult = await pool.query(
        `SELECT 
          vehicle_type,
          COUNT(*) as count
         FROM vehicles
         GROUP BY vehicle_type`,
      );

      // Calculate growth (vehicles created in current period vs previous period)
      const currentPeriodResult = await pool.query(
        `SELECT COUNT(*) as count 
         FROM vehicles 
         WHERE created_at >= $1 AND created_at <= $2`,
        [startDate, endDate],
      );

      const previousPeriodStart = new Date(startDate);
      previousPeriodStart.setTime(
        previousPeriodStart.getTime() -
          (endDate.getTime() - startDate.getTime()),
      );

      const previousPeriodResult = await pool.query(
        `SELECT COUNT(*) as count 
         FROM vehicles 
         WHERE created_at >= $1 AND created_at < $2`,
        [previousPeriodStart, startDate],
      );

      const currentCount = parseInt(currentPeriodResult.rows[0].count);
      const previousCount = parseInt(previousPeriodResult.rows[0].count);
      const growth = calculateGrowth(currentCount, previousCount); // ✅ CALL DIRECTLY

      // Get top performing vehicles
      const topPerformingResult = await pool.query(
        `SELECT 
          v.vehicle_id,
          v.name,
          v.total_rentals as rentals,
          v.average_rating as rating,
          (SELECT photo_url FROM vehicle_photos 
           WHERE vehicle_id = v.vehicle_id AND is_primary = true 
           LIMIT 1) as primary_photo
         FROM vehicles v
         WHERE v.status = 'active'
         ORDER BY v.total_rentals DESC, v.average_rating DESC
         LIMIT 10`,
      );

      // Get currently rented vehicles count
      const rentedResult = await pool.query(
        `SELECT COUNT(*) as count
         FROM vehicle_unavailability
         WHERE start_date <= CURRENT_DATE 
         AND end_date >= CURRENT_DATE
         AND booking_id IS NOT NULL`,
      );

      // Format by type
      const byType = {};
      typeResult.rows.forEach((row) => {
        byType[row.vehicle_type] = parseInt(row.count);
      });

      // Format by status
      const byStatus = {
        active: parseInt(statusResult.rows[0].available),
        pending: parseInt(statusResult.rows[0].maintenance),
        stopped: parseInt(statusResult.rows[0].stopped),
        banned: parseInt(statusResult.rows[0].banned),
      };

      res.json({
        total: parseInt(totalResult.rows[0].total),
        available: parseInt(statusResult.rows[0].available),
        rented: parseInt(rentedResult.rows[0].count),
        maintenance: parseInt(statusResult.rows[0].maintenance),
        growth: parseFloat(growth.toFixed(2)),
        byType,
        byStatus,
        topPerforming: topPerformingResult.rows.map((v) => ({
          vehicleId: v.vehicle_id,
          name: v.name,
          rentals: v.rentals || 0,
          rating: v.rating ? parseFloat(parseFloat(v.rating).toFixed(2)) : 0.0,
          primaryPhoto: v.primary_photo,
        })),
      });
    } catch (error) {
      console.error("❌ Get vehicle stats error:", error);
      next(error);
    }
  }

  /**
   * GET /analytics/vehicles/owner/:ownerId/stats?timeRange=30d
   * Vehicle statistics for specific owner
   */
  async getOwnerVehicleStats(req, res, next) {
    try {
      const { ownerId } = req.params;
      const { timeRange = "30d" } = req.query;

      // Verify ownership if not admin
      if (req.user.role !== "admin" && req.user.userId !== ownerId) {
        return res.status(403).json({
          error:
            "Access denied. You can only view your own vehicle statistics.",
        });
      }

      // Get total vehicles for owner
      const totalResult = await pool.query(
        `SELECT COUNT(*) as total FROM vehicles WHERE owner_id = $1`,
        [ownerId],
      );

      // Get vehicles by status
      const statusResult = await pool.query(
        `SELECT 
          COUNT(*) FILTER (WHERE status = 'active') as active,
          COUNT(*) FILTER (WHERE status = 'pending') as pending,
          COUNT(*) FILTER (WHERE status = 'stopped') as stopped
         FROM vehicles
         WHERE owner_id = $1`,
        [ownerId],
      );

      // Get currently rented vehicles
      const rentedResult = await pool.query(
        `SELECT COUNT(DISTINCT v.vehicle_id) as count
         FROM vehicles v
         JOIN vehicle_unavailability vu ON v.vehicle_id = vu.vehicle_id
         WHERE v.owner_id = $1
         AND vu.start_date <= CURRENT_DATE 
         AND vu.end_date >= CURRENT_DATE
         AND vu.booking_id IS NOT NULL`,
        [ownerId],
      );

      // Get available vehicles (active and not currently rented)
      const availableResult = await pool.query(
        `SELECT COUNT(*) as count
         FROM vehicles v
         WHERE v.owner_id = $1
         AND v.status = 'active'
         AND NOT EXISTS (
           SELECT 1 FROM vehicle_unavailability vu
           WHERE vu.vehicle_id = v.vehicle_id
           AND vu.start_date <= CURRENT_DATE 
           AND vu.end_date >= CURRENT_DATE
           AND vu.booking_id IS NOT NULL
         )`,
        [ownerId],
      );

      // Get average rating across all vehicles
      const ratingResult = await pool.query(
        `SELECT 
          AVG(average_rating) as avg_rating,
          SUM(total_rentals) as total_rentals
         FROM vehicles
         WHERE owner_id = $1`,
        [ownerId],
      );

      // Get top performing vehicles
      const topPerformingResult = await pool.query(
        `SELECT 
          v.vehicle_id,
          v.name,
          v.total_rentals as rentals,
          v.average_rating as rating,
          (SELECT photo_url FROM vehicle_photos 
           WHERE vehicle_id = v.vehicle_id AND is_primary = true 
           LIMIT 1) as primary_photo
         FROM vehicles v
         WHERE v.owner_id = $1
         ORDER BY v.total_rentals DESC, v.average_rating DESC
         LIMIT 5`,
        [ownerId],
      );

      // Get vehicles by type
      const typeResult = await pool.query(
        `SELECT 
          vehicle_type,
          COUNT(*) as count
         FROM vehicles
         WHERE owner_id = $1
         GROUP BY vehicle_type`,
        [ownerId],
      );

      // Calculate utilization rate (simple average)
      const utilizationRate =
        parseInt(totalResult.rows[0].total) > 0
          ? parseInt(rentedResult.rows[0].count) /
            parseInt(totalResult.rows[0].total)
          : 0;

      // Format by type
      const byType = {};
      typeResult.rows.forEach((row) => {
        byType[row.vehicle_type] = parseInt(row.count);
      });

      res.json({
        totalVehicles: parseInt(totalResult.rows[0].total),
        activeVehicles: parseInt(statusResult.rows[0].active),
        rentedVehicles: parseInt(rentedResult.rows[0].count),
        availableVehicles: parseInt(availableResult.rows[0].count),
        averageRating: ratingResult.rows[0].avg_rating
          ? parseFloat(parseFloat(ratingResult.rows[0].avg_rating).toFixed(2))
          : 0.0,
        totalRentals: parseInt(ratingResult.rows[0].total_rentals || 0),
        utilizationRate: parseFloat(utilizationRate.toFixed(2)),
        topPerforming: topPerformingResult.rows.map((v) => ({
          vehicleId: v.vehicle_id,
          name: v.name,
          rentals: v.rentals,
          rating: parseFloat(v.rating),
          utilizationRate: 0, // TODO: Calculate per-vehicle utilization
          primaryPhoto: v.primary_photo,
        })),
        byType,
      });
    } catch (error) {
      console.error("❌ Get owner vehicle stats error:", error);
      next(error);
    }
  }
}

module.exports = new AnalyticsVehicleController();
