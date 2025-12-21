const { VehicleReview, OwnerReview } = require('../models/Review');
const bookingGrpcClient = require('../grpc/booking_grpc_client');
const userGrpcClient = require('../grpc/user_grpc_client');

class ReviewController {
  
  // ==================== SUBMIT REVIEWS ====================
  
  async submitVehicleReview(req, res, next) {
    try {
      const userId = req.user.userId;
      const { bookingId, vehicleId, rating, comment, photos } = req.body;

      // Check if already reviewed
      const existingReview = await VehicleReview.findOne({ bookingId });
      if (existingReview) {
        return res.status(400).json({ 
          error: "You have already reviewed this vehicle" 
        });
      }

      // Verify booking via gRPC
      try {
        const bookingVerification = await bookingGrpcClient.verifyBooking(bookingId, userId);
        if (!bookingVerification.valid) {
          return res.status(400).json({ 
            error: bookingVerification.message || "Invalid booking for review" 
          });
        }
      } catch (error) {
        console.warn("⚠️  Booking verification failed, proceeding with caution");
      }

      // Get booking details for owner ID
      let ownerId = null;
      try {
        const bookingDetails = await bookingGrpcClient.getBookingDetails(bookingId);
        ownerId = bookingDetails.owner_id;
      } catch (error) {
        console.warn("⚠️  Could not fetch booking details");
      }

      // Create review
      const review = new VehicleReview({
        bookingId,
        vehicleId,
        customerId: userId,
        ownerId: ownerId || 'unknown',
        rating,
        comment,
        photos: photos || []
      });

      await review.save();

      // Mark booking as reviewed
      try {
        await bookingGrpcClient.markBookingReviewed(bookingId, 'vehicle');
      } catch (error) {
        console.warn("⚠️  Could not mark booking as reviewed");
      }

      console.log(`✅ Vehicle review submitted: ${review._id}`);

      res.status(201).json({
        message: "Review submitted successfully",
        review: {
          id: review._id,
          vehicleId: review.vehicleId,
          userId: review.customerId,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt
        }
      });

    } catch (error) {
      console.error("Submit vehicle review error:", error);
      next(error);
    }
  }

  async submitOwnerReview(req, res, next) {
    try {
      const userId = req.user.userId;
      const { bookingId, ownerId, rating, comment, aspects } = req.body;

      // Check if already reviewed
      const existingReview = await OwnerReview.findOne({ bookingId });
      if (existingReview) {
        return res.status(400).json({ 
          error: "You have already reviewed this owner" 
        });
      }

      // Verify booking via gRPC
      try {
        const bookingVerification = await bookingGrpcClient.verifyBooking(bookingId, userId);
        if (!bookingVerification.valid) {
          return res.status(400).json({ 
            error: bookingVerification.message || "Invalid booking for review" 
          });
        }
      } catch (error) {
        console.warn("⚠️  Booking verification failed, proceeding with caution");
      }

      // Create review
      const review = new OwnerReview({
        bookingId,
        ownerId,
        customerId: userId,
        rating,
        comment,
        aspects: aspects || null
      });

      await review.save();

      // Mark booking as reviewed
      try {
        await bookingGrpcClient.markBookingReviewed(bookingId, 'owner');
      } catch (error) {
        console.warn("⚠️  Could not mark booking as reviewed");
      }

      console.log(`✅ Owner review submitted: ${review._id}`);

      res.status(201).json({
        message: "Owner review submitted successfully",
        review: {
          id: review._id,
          ownerId: review.ownerId,
          userId: review.customerId,
          rating: review.rating,
          createdAt: review.createdAt
        }
      });

    } catch (error) {
      console.error("Submit owner review error:", error);
      next(error);
    }
  }

  // ==================== GET REVIEWS ====================

  async getVehicleReviews(req, res, next) {
    try {
      const { vehicleId } = req.params;
      const { sortBy = 'newest', minRating, page = 1, limit = 10 } = req.query;

      // Build query
      const query = { vehicleId, isVisible: true };
      if (minRating) {
        query.rating = { $gte: parseFloat(minRating) };
      }

      // Build sort
      let sort = {};
      if (sortBy === 'highest') {
        sort = { rating: -1, createdAt: -1 };
      } else if (sortBy === 'lowest') {
        sort = { rating: 1, createdAt: -1 };
      } else {
        sort = { createdAt: -1 };
      }

      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [reviews, total, allReviews] = await Promise.all([
        VehicleReview.find(query)
          .sort(sort)
          .limit(parseInt(limit))
          .skip(skip)
          .lean(),
        VehicleReview.countDocuments(query),
        VehicleReview.find({ vehicleId, isVisible: true }).lean()
      ]);

      // Get user profiles for all reviews
      const userIds = [...new Set(reviews.map(r => r.customerId))];
      let userProfiles = {};
      
      try {
        const profiles = await userGrpcClient.getUserProfiles(userIds);
        profiles.forEach(profile => {
          userProfiles[profile.user_id] = profile;
        });
      } catch (error) {
        console.warn("⚠️  Could not fetch user profiles");
      }

      // Calculate summary
      const avgRating = allReviews.length > 0
        ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
        : 0;

      const ratingDistribution = {
        5: allReviews.filter(r => r.rating === 5).length,
        4: allReviews.filter(r => r.rating === 4).length,
        3: allReviews.filter(r => r.rating === 3).length,
        2: allReviews.filter(r => r.rating === 2).length,
        1: allReviews.filter(r => r.rating === 1).length,
      };

      // Format reviews
      const formattedReviews = reviews.map(review => {
        const userProfile = userProfiles[review.customerId] || {};
        return {
          id: review._id,
          user: {
            id: review.customerId,
            name: userProfile.full_name || 'Unknown User',
            avatar: userProfile.avatar_url || null
          },
          rating: review.rating,
          comment: review.comment,
          photos: review.photos,
          createdAt: review.createdAt,
          helpful: review.helpful,
          ownerResponse: review.ownerResponse?.text || null
        };
      });

      res.json({
        reviews: formattedReviews,
        summary: {
          averageRating: parseFloat(avgRating.toFixed(1)),
          totalReviews: allReviews.length,
          ratingDistribution
        },
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit)
        }
      });

    } catch (error) {
      console.error("Get vehicle reviews error:", error);
      next(error);
    }
  }

  async getOwnerReviews(req, res, next) {
    try {
      const { ownerId } = req.params;
      const { sortBy = 'newest', page = 1, limit = 10 } = req.query;

      // Build query
      const query = { ownerId, isVisible: true };

      // Build sort
      let sort = {};
      if (sortBy === 'highest') {
        sort = { rating: -1, createdAt: -1 };
      } else if (sortBy === 'lowest') {
        sort = { rating: 1, createdAt: -1 };
      } else {
        sort = { createdAt: -1 };
      }

      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [reviews, total, allReviews] = await Promise.all([
        OwnerReview.find(query)
          .sort(sort)
          .limit(parseInt(limit))
          .skip(skip)
          .lean(),
        OwnerReview.countDocuments(query),
        OwnerReview.find({ ownerId, isVisible: true }).lean()
      ]);

      // Get user profiles
      const userIds = [...new Set(reviews.map(r => r.customerId))];
      let userProfiles = {};
      
      try {
        const profiles = await userGrpcClient.getUserProfiles(userIds);
        profiles.forEach(profile => {
          userProfiles[profile.user_id] = profile;
        });
      } catch (error) {
        console.warn("⚠️  Could not fetch user profiles");
      }

      // Calculate summary
      const avgRating = allReviews.length > 0
        ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
        : 0;

      // Format reviews
      const formattedReviews = reviews.map(review => {
        const userProfile = userProfiles[review.customerId] || {};
        return {
          id: review._id,
          user: {
            id: review.customerId,
            name: userProfile.full_name || 'Unknown User',
            avatar: userProfile.avatar_url || null
          },
          rating: review.rating,
          comment: review.comment,
          aspects: review.aspects || null,
          createdAt: review.createdAt
        };
      });

      res.json({
        reviews: formattedReviews,
        summary: {
          averageRating: parseFloat(avgRating.toFixed(1)),
          totalReviews: allReviews.length
        },
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit)
        }
      });

    } catch (error) {
      console.error("Get owner reviews error:", error);
      next(error);
    }
  }

  // ==================== REVIEW ACTIONS ====================

  async postResponse(req, res, next) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      const { response } = req.body;

      // Find review and verify owner
      const review = await VehicleReview.findById(id);
      
      if (!review) {
        return res.status(404).json({ error: "Review not found" });
      }

      if (review.ownerId !== userId) {
        return res.status(403).json({ 
          error: "Only the vehicle owner can respond to reviews" 
        });
      }

      review.ownerResponse = {
        text: response,
        respondedAt: new Date()
      };

      await review.save();

      console.log(`✅ Owner response posted for review: ${id}`);

      res.json({
        message: "Response posted successfully"
      });

    } catch (error) {
      console.error("Post response error:", error);
      next(error);
    }
  }

  async reportReview(req, res, next) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      const { reason, details } = req.body;

      // Try both review types
      let review = await VehicleReview.findById(id);
      if (!review) {
        review = await OwnerReview.findById(id);
      }

      if (!review) {
        return res.status(404).json({ error: "Review not found" });
      }

      review.reported = true;
      review.reportDetails = {
        reason,
        details,
        reportedBy: userId,
        reportedAt: new Date()
      };

      await review.save();

      console.log(`⚠️  Review reported: ${id} by ${userId}`);

      res.json({
        message: "Review reported, will be reviewed by support"
      });

    } catch (error) {
      console.error("Report review error:", error);
      next(error);
    }
  }

  async markHelpful(req, res, next) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;

      // Try both review types
      let review = await VehicleReview.findById(id);
      let reviewType = 'vehicle';
      
      if (!review) {
        review = await OwnerReview.findById(id);
        reviewType = 'owner';
      }

      if (!review) {
        return res.status(404).json({ error: "Review not found" });
      }

      // Check if already marked helpful
      if (review.helpfulBy.includes(userId)) {
        return res.status(400).json({ 
          error: "You have already marked this review as helpful" 
        });
      }

      review.helpful += 1;
      review.helpfulBy.push(userId);

      await review.save();

      console.log(`👍 Review marked helpful: ${id}`);

      res.json({
        message: "Marked as helpful",
        helpfulCount: review.helpful
      });

    } catch (error) {
      console.error("Mark helpful error:", error);
      next(error);
    }
  }
}

module.exports = new ReviewController();