// Backend/review-service/src/controllers/analytics_controller.js
const { VehicleReview, OwnerReview } = require("../models/Review");

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
   * GET /analytics/reviews/owner/:ownerId/stats?timeRange=30d
   * Get review statistics for owner and their vehicles
   */
  async getOwnerReviewStats(req, res, next) {
    try {
      const { ownerId } = req.params;
      const { timeRange = "30d" } = req.query;
      const { startDate, endDate } = this.getDateRange(timeRange);

      console.log(`📊 Getting review stats for owner: ${ownerId}`);

      // Verify ownership (if not admin)
      if (req.user.role !== "admin" && req.user.userId !== ownerId) {
        return res.status(403).json({
          error: "Unauthorized to view these statistics",
        });
      }

      // Get vehicle reviews for this owner's vehicles
      const vehicleReviews = await VehicleReview.find({
        ownerId: ownerId,
        isVisible: true,
        createdAt: { $gte: startDate, $lte: endDate },
      }).sort({ createdAt: -1 });

      // Get owner reviews (reviews of the owner as a host)
      const ownerReviews = await OwnerReview.find({
        ownerId: ownerId,
        isVisible: true,
        createdAt: { $gte: startDate, $lte: endDate },
      }).sort({ createdAt: -1 });

      // Calculate total reviews
      const totalReviews = vehicleReviews.length + ownerReviews.length;

      // Calculate average rating for vehicle reviews
      const vehicleAvgRating =
        vehicleReviews.length > 0
          ? vehicleReviews.reduce((sum, r) => sum + r.rating, 0) /
            vehicleReviews.length
          : 0;

      // Calculate average rating for owner reviews
      const ownerAvgRating =
        ownerReviews.length > 0
          ? ownerReviews.reduce((sum, r) => sum + r.rating, 0) /
            ownerReviews.length
          : 0;

      // Calculate overall average rating
      const overallAvgRating =
        totalReviews > 0
          ? (vehicleReviews.reduce((sum, r) => sum + r.rating, 0) +
              ownerReviews.reduce((sum, r) => sum + r.rating, 0)) /
            totalReviews
          : 0;

      // Calculate rating distribution
      const allReviews = [...vehicleReviews, ...ownerReviews];
      const ratingDistribution = {
        5: allReviews.filter((r) => r.rating === 5).length,
        4: allReviews.filter((r) => r.rating === 4).length,
        3: allReviews.filter((r) => r.rating === 3).length,
        2: allReviews.filter((r) => r.rating === 2).length,
        1: allReviews.filter((r) => r.rating === 1).length,
      };

      // Get recent reviews (last 10)
      const recentReviews = allReviews.slice(0, 10).map((review) => ({
        id: review._id,
        rating: review.rating,
        comment: review.comment || "",
        createdAt: review.createdAt,
        type: review.vehicleId ? "vehicle" : "owner",
        vehicleId: review.vehicleId || null,
      }));

      // Calculate trend data (group by day)
      const trendMap = new Map();
      allReviews.forEach((review) => {
        const date = review.createdAt.toISOString().split("T")[0];
        if (!trendMap.has(date)) {
          trendMap.set(date, { count: 0, totalRating: 0 });
        }
        const data = trendMap.get(date);
        data.count++;
        data.totalRating += review.rating;
      });

      const trend = Array.from(trendMap.entries())
        .map(([date, data]) => ({
          period: date,
          averageRating: parseFloat((data.totalRating / data.count).toFixed(2)),
          count: data.count,
        }))
        .sort((a, b) => new Date(a.period) - new Date(b.period));

      console.log(
        `✅ Owner ${ownerId} has ${totalReviews} total reviews, avg rating: ${overallAvgRating.toFixed(
          2,
        )}`,
      );

      res.json({
        averageRating: parseFloat(overallAvgRating.toFixed(2)),
        totalReviews: totalReviews,
        vehicleReviews: vehicleReviews.length,
        ownerReviews: ownerReviews.length,
        ratingDistribution: ratingDistribution,
        recentReviews: recentReviews,
        trend: trend,
      });
    } catch (error) {
      console.error("❌ Get owner review stats error:", error);
      next(error);
    }
  }

  /**
   * GET /analytics/reviews/vehicle/:vehicleId/stats?timeRange=30d
   * Get review statistics for a specific vehicle
   */
  async getVehicleReviewStats(req, res, next) {
    try {
      const { vehicleId } = req.params;
      const { timeRange = "30d" } = req.query;
      const { startDate, endDate } = this.getDateRange(timeRange);

      console.log(`📊 Getting review stats for vehicle: ${vehicleId}`);

      // Get vehicle reviews
      const reviews = await VehicleReview.find({
        vehicleId: vehicleId,
        isVisible: true,
        createdAt: { $gte: startDate, $lte: endDate },
      }).sort({ createdAt: -1 });

      // Calculate average rating
      const averageRating =
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0;

      // Calculate rating distribution
      const ratingDistribution = {
        5: reviews.filter((r) => r.rating === 5).length,
        4: reviews.filter((r) => r.rating === 4).length,
        3: reviews.filter((r) => r.rating === 3).length,
        2: reviews.filter((r) => r.rating === 2).length,
        1: reviews.filter((r) => r.rating === 1).length,
      };

      // Get recent reviews
      const recentReviews = reviews.slice(0, 10).map((review) => ({
        id: review._id,
        rating: review.rating,
        comment: review.comment || "",
        createdAt: review.createdAt,
        customerId: review.customerId,
        helpful: review.helpful,
        hasResponse: !!review.ownerResponse,
      }));

      // Calculate trend
      const trendMap = new Map();
      reviews.forEach((review) => {
        const date = review.createdAt.toISOString().split("T")[0];
        if (!trendMap.has(date)) {
          trendMap.set(date, { count: 0, totalRating: 0 });
        }
        const data = trendMap.get(date);
        data.count++;
        data.totalRating += review.rating;
      });

      const trend = Array.from(trendMap.entries())
        .map(([date, data]) => ({
          period: date,
          averageRating: parseFloat((data.totalRating / data.count).toFixed(2)),
          count: data.count,
        }))
        .sort((a, b) => new Date(a.period) - new Date(b.period));

      console.log(
        `✅ Vehicle ${vehicleId} has ${reviews.length} reviews, avg rating: ${averageRating.toFixed(
          2,
        )}`,
      );

      res.json({
        averageRating: parseFloat(averageRating.toFixed(2)),
        totalReviews: reviews.length,
        ratingDistribution: ratingDistribution,
        recentReviews: recentReviews,
        trend: trend,
        responseRate:
          reviews.length > 0
            ? parseFloat(
                (
                  (reviews.filter((r) => r.ownerResponse).length /
                    reviews.length) *
                  100
                ).toFixed(2),
              )
            : 0,
      });
    } catch (error) {
      console.error("❌ Get vehicle review stats error:", error);
      next(error);
    }
  }

  /**
   * GET /analytics/reviews/platform/stats?timeRange=30d
   * Platform-wide review statistics (Admin only)
   */
  async getPlatformReviewStats(req, res, next) {
    try {
      const { timeRange = "30d" } = req.query;
      const { startDate, endDate } = this.getDateRange(timeRange);

      console.log(`Getting platform review stats for ${timeRange}`);

      // Get all vehicle reviews
      const vehicleReviews = await VehicleReview.find({
        createdAt: { $gte: startDate, $lte: endDate },
      });

      // Get all owner reviews
      const ownerReviews = await OwnerReview.find({
        createdAt: { $gte: startDate, $lte: endDate },
      });

      const totalReviews = vehicleReviews.length + ownerReviews.length;

      // Calculate average ratings
      const vehicleAvgRating =
        vehicleReviews.length > 0
          ? vehicleReviews.reduce((sum, r) => sum + r.rating, 0) /
            vehicleReviews.length
          : 0;

      const ownerAvgRating =
        ownerReviews.length > 0
          ? ownerReviews.reduce((sum, r) => sum + r.rating, 0) /
            ownerReviews.length
          : 0;

      // Calculate overall average
      const overallAvgRating =
        totalReviews > 0
          ? (vehicleReviews.reduce((sum, r) => sum + r.rating, 0) +
              ownerReviews.reduce((sum, r) => sum + r.rating, 0)) /
            totalReviews
          : 0;

      // Rating distribution
      const allReviews = [...vehicleReviews, ...ownerReviews];
      const ratingDistribution = {
        5: allReviews.filter((r) => r.rating === 5).length,
        4: allReviews.filter((r) => r.rating === 4).length,
        3: allReviews.filter((r) => r.rating === 3).length,
        2: allReviews.filter((r) => r.rating === 2).length,
        1: allReviews.filter((r) => r.rating === 1).length,
      };

      // Count reported reviews
      const reportedCount = allReviews.filter((r) => r.reported).length;

      // Count reviews with responses
      const reviewsWithResponses = vehicleReviews.filter(
        (r) => r.ownerResponse,
      ).length;

      // Response rate
      const responseRate =
        vehicleReviews.length > 0
          ? (reviewsWithResponses / vehicleReviews.length) * 100
          : 0;

      // Trend data
      const trendMap = new Map();
      allReviews.forEach((review) => {
        const date = review.createdAt.toISOString().split("T")[0];
        if (!trendMap.has(date)) {
          trendMap.set(date, { count: 0, totalRating: 0 });
        }
        const data = trendMap.get(date);
        data.count++;
        data.totalRating += review.rating;
      });

      const trend = Array.from(trendMap.entries())
        .map(([date, data]) => ({
          date: date,
          count: data.count,
          averageRating: parseFloat((data.totalRating / data.count).toFixed(2)),
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      console.log(
        `✅ Platform has ${totalReviews} total reviews, avg rating: ${overallAvgRating.toFixed(
          2,
        )}`,
      );

      res.json({
        totalReviews: totalReviews,
        vehicleReviews: vehicleReviews.length,
        ownerReviews: ownerReviews.length,
        averageRating: parseFloat(overallAvgRating.toFixed(2)),
        vehicleAverageRating: parseFloat(vehicleAvgRating.toFixed(2)),
        ownerAverageRating: parseFloat(ownerAvgRating.toFixed(2)),
        ratingDistribution: ratingDistribution,
        reportedReviews: reportedCount,
        responseRate: parseFloat(responseRate.toFixed(2)),
        trend: trend,
      });
    } catch (error) {
      console.error("❌ Get platform review stats error:", error);
      next(error);
    }
  }
}

module.exports = new AnalyticsController();
