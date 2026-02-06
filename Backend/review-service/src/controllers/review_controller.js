// Backend/review-service/src/controllers/review_controller.js
const { VehicleReview, OwnerReview } = require("../models/Review");
const bookingGrpcClient = require("../grpc/booking_grpc_client");
const userGrpcClient = require("../grpc/user_grpc_client");
const vehicleGrpcClient = require("../grpc/vehicle_grpc_client");
const eventEmitter = require("../events/eventEmitter");

class ReviewController {
  // ==================== SUBMIT REVIEWS ====================

  async submitVehicleReview(req, res, next) {
    try {
      const userId = req.user.userId;
      const { bookingId, vehicleId, rating, comment, photos } = req.body;

      console.log("📝 Submitting vehicle review:", {
        userId,
        bookingId,
        vehicleId,
        rating,
        hasPhotos: !!photos,
        photoCount: photos?.length || 0,
      });

      // Check if already reviewed
      const existingReview = await VehicleReview.findOne({ bookingId });
      if (existingReview) {
        return res.status(400).json({
          error: "You have already reviewed this vehicle",
        });
      }

      // Verify booking eligibility
      let bookingVerification;
      try {
        bookingVerification = await bookingGrpcClient.verifyBooking(
          bookingId,
          userId,
        );
      } catch (error) {
        console.error("❌ Booking verification failed:", error.message);
        return res.status(503).json({
          error: "Could not verify booking. Please try again later.",
          details: "Booking service unavailable",
        });
      }

      if (!bookingVerification.valid) {
        let reason = "Invalid booking for review";

        if (!bookingVerification.is_completed) {
          reason =
            "Booking must be completed or return submitted before you can review";
        } else if (!bookingVerification.is_customer) {
          reason =
            "Only the customer who booked this vehicle can submit a review";
        }

        return res.status(400).json({
          error: bookingVerification.message || reason,
          canReview: false,
          details: {
            isCompleted: bookingVerification.is_completed,
            isCustomer: bookingVerification.is_customer,
          },
        });
      }

      // Get booking details for owner ID
      let ownerId = null;
      try {
        const bookingDetails =
          await bookingGrpcClient.getBookingDetails(bookingId);
        ownerId = bookingDetails.owner_id;
      } catch (error) {
        console.error("❌ Could not fetch booking details:", error.message);
        return res.status(503).json({
          error: "Could not fetch booking details",
        });
      }

      if (!ownerId) {
        return res.status(400).json({
          error: "Could not determine vehicle owner",
        });
      }

      // Process photo file IDs
      let reviewPhotos = [];
      if (photos && Array.isArray(photos) && photos.length > 0) {
        console.log(`📸 Processing ${photos.length} review photos...`);

        // Validate photo count
        if (photos.length > 10) {
          return res.status(400).json({
            error: "Maximum 10 photos allowed per review",
          });
        }

        // Filter out empty strings and save file IDs directly
        reviewPhotos = photos.filter(
          (id) => id && typeof id === "string" && id.trim(),
        );
        console.log(`✅ Saving ${reviewPhotos.length} photo file IDs`);
      }

      // Create review with photo file IDs
      const review = new VehicleReview({
        bookingId,
        vehicleId,
        customerId: userId,
        ownerId: ownerId,
        rating,
        comment: comment || "",
        photos: reviewPhotos,
      });

      await review.save();

      // 📤 Emit review.created event
      await eventEmitter.emit("review.created", {
        reviewId: review._id.toString(),
        reviewType: "vehicle",
        bookingId: review.bookingId,
        vehicleId: review.vehicleId,
        customerId: review.customerId,
        ownerId: review.ownerId,
        rating: review.rating,
        hasComment: !!review.comment,
        photoCount: review.photos.length,
        createdAt: review.createdAt,
      });

      // Mark booking as reviewed
      try {
        await bookingGrpcClient.markBookingReviewed(bookingId, "vehicle");
      } catch (error) {
        console.warn("⚠️  Could not mark booking as reviewed:", error.message);
      }

      // Update vehicle rating via gRPC
      try {
        const allReviews = await VehicleReview.find({
          vehicleId,
          isVisible: true,
        });

        const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
        const newAvgRating = totalRating / allReviews.length;
        const newReviewCount = allReviews.length;

        await vehicleGrpcClient.updateVehicleRating(
          vehicleId,
          newAvgRating,
          newReviewCount,
        );

        console.log(
          `✅ Updated vehicle ${vehicleId} rating to ${newAvgRating.toFixed(1)}`,
        );
      } catch (error) {
        console.error("⚠️  Could not update vehicle rating:", error.message);
      }

      console.log(
        `✅ Vehicle review submitted: ${review._id} with ${reviewPhotos.length} photos`,
      );

      res.status(201).json({
        message: "Review submitted successfully",
        review: {
          id: review._id,
          vehicleId: review.vehicleId,
          userId: review.customerId,
          rating: review.rating,
          comment: review.comment,
          photos: review.photos,
          photoCount: review.photos.length,
          createdAt: review.createdAt,
        },
      });
    } catch (error) {
      console.error("❌ Submit vehicle review error:", error);
      next(error);
    }
  }

  async submitOwnerReview(req, res, next) {
    try {
      const userId = req.user.userId;
      const { bookingId, ownerId, rating, comment, aspects } = req.body;

      console.log("📝 Submitting owner review:", {
        userId,
        bookingId,
        ownerId,
        rating,
      });

      // Check if already reviewed
      const existingReview = await OwnerReview.findOne({ bookingId });
      if (existingReview) {
        return res.status(400).json({
          error: "You have already reviewed this owner",
        });
      }

      // Verify booking eligibility
      let bookingVerification;
      try {
        bookingVerification = await bookingGrpcClient.verifyBooking(
          bookingId,
          userId,
        );
      } catch (error) {
        console.error("❌ Booking verification failed:", error.message);
        return res.status(503).json({
          error: "Could not verify booking. Please try again later.",
          details: "Booking service unavailable",
        });
      }

      if (!bookingVerification.valid) {
        let reason = "Invalid booking for review";

        if (!bookingVerification.is_completed) {
          reason =
            "Booking must be completed or return submitted before you can review";
        } else if (!bookingVerification.is_customer) {
          reason = "Only the customer who booked can submit a review";
        }

        return res.status(400).json({
          error: bookingVerification.message || reason,
          canReview: false,
          details: {
            isCompleted: bookingVerification.is_completed,
            isCustomer: bookingVerification.is_customer,
          },
        });
      }

      // Create owner review (no photos for owner reviews)
      const review = new OwnerReview({
        bookingId,
        ownerId,
        customerId: userId,
        rating,
        comment: comment || "",
        aspects: aspects || null,
      });

      await review.save();

      // 📤 Emit review.owner_reviewed event
      await eventEmitter.emit("review.owner_reviewed", {
        reviewId: review._id.toString(),
        reviewType: "owner",
        bookingId: review.bookingId,
        ownerId: review.ownerId,
        customerId: review.customerId,
        rating: review.rating,
        hasComment: !!review.comment,
        hasAspects: !!review.aspects,
        aspects: review.aspects,
        createdAt: review.createdAt,
      });

      // Mark booking as reviewed
      try {
        await bookingGrpcClient.markBookingReviewed(bookingId, "owner");
      } catch (error) {
        console.warn("⚠️  Could not mark booking as reviewed:", error.message);
      }

      console.log(`✅ Owner review submitted: ${review._id}`);

      res.status(201).json({
        message: "Owner review submitted successfully",
        review: {
          id: review._id,
          ownerId: review.ownerId,
          userId: review.customerId,
          rating: review.rating,
          comment: review.comment,
          aspects: review.aspects,
          createdAt: review.createdAt,
        },
      });
    } catch (error) {
      console.error("❌ Submit owner review error:", error);
      next(error);
    }
  }

  // ==================== GET REVIEWS ====================

  async getVehicleReviews(req, res, next) {
    try {
      const { vehicleId } = req.params;
      const { sortBy = "newest", minRating, page = 1, limit = 10 } = req.query;

      console.log(`📖 Fetching vehicle reviews for: ${vehicleId}`);

      const query = { vehicleId, isVisible: true };

      if (minRating) {
        query.rating = { $gte: parseInt(minRating) };
      }

      let sort = {};
      if (sortBy === "highest") {
        sort = { rating: -1, createdAt: -1 };
      } else if (sortBy === "lowest") {
        sort = { rating: 1, createdAt: -1 };
      } else if (sortBy === "helpful") {
        sort = { helpful: -1, createdAt: -1 };
      } else {
        sort = { createdAt: -1 };
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [reviews, total, allReviews] = await Promise.all([
        VehicleReview.find(query)
          .sort(sort)
          .limit(parseInt(limit))
          .skip(skip)
          .lean(),
        VehicleReview.countDocuments(query),
        VehicleReview.find({ vehicleId, isVisible: true }).lean(),
      ]);

      const userIds = [...new Set(reviews.map((r) => r.customerId))];
      let userProfiles = {};

      try {
        const profiles = await userGrpcClient.getUserProfiles(userIds);
        profiles.forEach((profile) => {
          userProfiles[profile.user_id] = profile;
        });
      } catch (error) {
        console.warn("⚠️  Could not fetch user profiles");
      }

      // Calculate summary statistics
      const avgRating =
        allReviews.length > 0
          ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
          : 0;

      const ratingDistribution = {
        5: allReviews.filter((r) => r.rating === 5).length,
        4: allReviews.filter((r) => r.rating === 4).length,
        3: allReviews.filter((r) => r.rating === 3).length,
        2: allReviews.filter((r) => r.rating === 2).length,
        1: allReviews.filter((r) => r.rating === 1).length,
      };

      // Count reviews with photos
      const reviewsWithPhotos = allReviews.filter(
        (r) => r.photos && r.photos.length > 0,
      ).length;

      // Format reviews - photos are file IDs
      const formattedReviews = reviews.map((review) => {
        const userProfile = userProfiles[review.customerId] || {};
        return {
          id: review._id,
          user: {
            id: review.customerId,
            name: userProfile.full_name || "Unknown User",
            avatar: userProfile.avatar_url || null,
          },
          rating: review.rating,
          comment: review.comment,
          photos: review.photos || [], // These are file IDs
          hasPhotos: !!(review.photos && review.photos.length > 0),
          photoCount: review.photos?.length || 0,
          createdAt: review.createdAt,
          helpful: review.helpful,
          ownerResponse: review.ownerResponse?.text || null,
        };
      });

      console.log(
        `✅ Found ${reviews.length} reviews (${reviewsWithPhotos} with photos)`,
      );

      res.json({
        reviews: formattedReviews,
        summary: {
          averageRating: parseFloat(avgRating.toFixed(1)),
          totalReviews: allReviews.length,
          reviewsWithPhotos,
          ratingDistribution,
        },
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
        },
      });
    } catch (error) {
      console.error("❌ Get vehicle reviews error:", error);
      next(error);
    }
  }

  async getOwnerReviews(req, res, next) {
    try {
      const { ownerId } = req.params;
      const { sortBy = "newest", page = 1, limit = 10 } = req.query;

      console.log(`📖 Fetching owner reviews for: ${ownerId}`);

      const query = { ownerId, isVisible: true };

      let sort = {};
      if (sortBy === "highest") {
        sort = { rating: -1, createdAt: -1 };
      } else if (sortBy === "lowest") {
        sort = { rating: 1, createdAt: -1 };
      } else {
        sort = { createdAt: -1 };
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [reviews, total, allReviews] = await Promise.all([
        OwnerReview.find(query)
          .sort(sort)
          .limit(parseInt(limit))
          .skip(skip)
          .lean(),
        OwnerReview.countDocuments(query),
        OwnerReview.find({ ownerId, isVisible: true }).lean(),
      ]);

      const userIds = [...new Set(reviews.map((r) => r.customerId))];
      let userProfiles = {};

      try {
        const profiles = await userGrpcClient.getUserProfiles(userIds);
        profiles.forEach((profile) => {
          userProfiles[profile.user_id] = profile;
        });
      } catch (error) {
        console.warn("⚠️  Could not fetch user profiles");
      }

      const avgRating =
        allReviews.length > 0
          ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
          : 0;

      const formattedReviews = reviews.map((review) => {
        const userProfile = userProfiles[review.customerId] || {};
        return {
          id: review._id,
          user: {
            id: review.customerId,
            name: userProfile.full_name || "Unknown User",
            avatar: userProfile.avatar_url || null,
          },
          rating: review.rating,
          comment: review.comment,
          aspects: review.aspects || null,
          createdAt: review.createdAt,
        };
      });

      console.log(`✅ Found ${reviews.length} owner reviews`);

      res.json({
        reviews: formattedReviews,
        summary: {
          averageRating: parseFloat(avgRating.toFixed(1)),
          totalReviews: allReviews.length,
        },
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
        },
      });
    } catch (error) {
      console.error("❌ Get owner reviews error:", error);
      next(error);
    }
  }

  // ==================== NEW: GET ALL REVIEWS WITH PAGINATION ====================

  async getAllReviews(req, res, next) {
    try {
      const { page = 1, limit = 10, sortBy = "newest", type } = req.query;

      console.log(`📖 Fetching all reviews (page ${page}, limit ${limit})`);

      const skip = (parseInt(page) - 1) * parseInt(limit);

      let sort = {};
      if (sortBy === "highest") {
        sort = { rating: -1, createdAt: -1 };
      } else if (sortBy === "lowest") {
        sort = { rating: 1, createdAt: -1 };
      } else {
        sort = { createdAt: -1 };
      }

      let vehicleReviews = [];
      let ownerReviews = [];
      let totalVehicle = 0;
      let totalOwner = 0;

      // If type is specified, fetch only that type
      if (type === "vehicle") {
        [vehicleReviews, totalVehicle] = await Promise.all([
          VehicleReview.find({ isVisible: true })
            .sort(sort)
            .limit(parseInt(limit))
            .skip(skip)
            .lean(),
          VehicleReview.countDocuments({ isVisible: true }),
        ]);
      } else if (type === "owner") {
        [ownerReviews, totalOwner] = await Promise.all([
          OwnerReview.find({ isVisible: true })
            .sort(sort)
            .limit(parseInt(limit))
            .skip(skip)
            .lean(),
          OwnerReview.countDocuments({ isVisible: true }),
        ]);
      } else {
        // Fetch both types
        [vehicleReviews, ownerReviews, totalVehicle, totalOwner] =
          await Promise.all([
            VehicleReview.find({ isVisible: true }).sort(sort).lean(),
            OwnerReview.find({ isVisible: true }).sort(sort).lean(),
            VehicleReview.countDocuments({ isVisible: true }),
            OwnerReview.countDocuments({ isVisible: true }),
          ]);
      }

      // Combine and sort all reviews
      const allReviews = [
        ...vehicleReviews.map((r) => ({ ...r, type: "vehicle" })),
        ...ownerReviews.map((r) => ({ ...r, type: "owner" })),
      ];

      // Sort combined reviews
      allReviews.sort((a, b) => {
        if (sortBy === "highest") {
          return b.rating - a.rating || b.createdAt - a.createdAt;
        } else if (sortBy === "lowest") {
          return a.rating - b.rating || b.createdAt - a.createdAt;
        } else {
          return b.createdAt - a.createdAt;
        }
      });

      // Apply pagination to combined results
      const paginatedReviews = allReviews.slice(skip, skip + parseInt(limit));

      // Get unique user IDs
      const userIds = [...new Set(paginatedReviews.map((r) => r.customerId))];
      let userProfiles = {};

      try {
        const profiles = await userGrpcClient.getUserProfiles(userIds);
        profiles.forEach((profile) => {
          userProfiles[profile.user_id] = profile;
        });
      } catch (error) {
        console.warn("⚠️  Could not fetch user profiles");
      }

      // Format reviews
      const formattedReviews = paginatedReviews.map((review) => {
        const userProfile = userProfiles[review.customerId] || {};
        const baseReview = {
          id: review._id,
          type: review.type,
          user: {
            id: review.customerId,
            name: userProfile.full_name || "Unknown User",
            avatar: userProfile.avatar_url || null,
          },
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt,
        };

        if (review.type === "vehicle") {
          return {
            ...baseReview,
            vehicleId: review.vehicleId,
            ownerId: review.ownerId,
            photos: review.photos || [],
            hasPhotos: !!(review.photos && review.photos.length > 0),
            photoCount: review.photos?.length || 0,
            helpful: review.helpful,
            ownerResponse: review.ownerResponse?.text || null,
          };
        } else {
          return {
            ...baseReview,
            ownerId: review.ownerId,
            aspects: review.aspects || null,
          };
        }
      });

      const total = totalVehicle + totalOwner;

      console.log(
        `✅ Found ${paginatedReviews.length} reviews (${vehicleReviews.length} vehicle, ${ownerReviews.length} owner)`,
      );

      res.json({
        reviews: formattedReviews,
        summary: {
          totalReviews: total,
          vehicleReviews: totalVehicle,
          ownerReviews: totalOwner,
        },
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error("❌ Get all reviews error:", error);
      next(error);
    }
  }

  // ==================== REVIEW ACTIONS ====================

  async postResponse(req, res, next) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      const { response } = req.body;

      const review = await VehicleReview.findById(id);

      if (!review) {
        return res.status(404).json({ error: "Review not found" });
      }

      if (review.ownerId !== userId) {
        return res.status(403).json({
          error: "Only the vehicle owner can respond to reviews",
        });
      }

      review.ownerResponse = {
        text: response,
        respondedAt: new Date(),
      };

      await review.save();

      // 📤 Emit review.response_posted event
      await eventEmitter.emit("review.response_posted", {
        reviewId: review._id.toString(),
        vehicleId: review.vehicleId,
        ownerId: review.ownerId,
        customerId: review.customerId,
        response: response,
        respondedAt: review.ownerResponse.respondedAt,
      });

      console.log(`✅ Owner response posted for review: ${id}`);

      res.json({
        message: "Response posted successfully",
      });
    } catch (error) {
      console.error("❌ Post response error:", error);
      next(error);
    }
  }

  async reportReview(req, res, next) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      const { reason, details } = req.body;

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
        reportedAt: new Date(),
      };

      await review.save();

      console.log(`⚠️  Review reported: ${id} by ${userId}`);

      res.json({
        message: "Review reported, will be reviewed by support",
      });
    } catch (error) {
      console.error("❌ Report review error:", error);
      next(error);
    }
  }

  async markHelpful(req, res, next) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;

      let review = await VehicleReview.findById(id);
      let reviewType = "vehicle";

      if (!review) {
        review = await OwnerReview.findById(id);
        reviewType = "owner";
      }

      if (!review) {
        return res.status(404).json({ error: "Review not found" });
      }

      if (review.helpfulBy.includes(userId)) {
        return res.status(400).json({
          error: "You have already marked this review as helpful",
        });
      }

      review.helpful += 1;
      review.helpfulBy.push(userId);

      await review.save();

      console.log(`👍 Review marked helpful: ${id}`);

      res.json({
        message: "Marked as helpful",
        helpfulCount: review.helpful,
      });
    } catch (error) {
      console.error("❌ Mark helpful error:", error);
      next(error);
    }
  }
}

module.exports = new ReviewController();
