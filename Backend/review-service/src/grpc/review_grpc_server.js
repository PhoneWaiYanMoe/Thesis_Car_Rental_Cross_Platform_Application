const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");
const { VehicleReview, OwnerReview } = require("../models/Review");

const PROTO_PATH = path.join(__dirname, "../../proto/review.proto");
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const reviewProto = grpc.loadPackageDefinition(packageDefinition).review;

class ReviewGrpcServer {
  constructor() {
    this.server = new grpc.Server();
  }

  async getVehicleReviewSummary(call, callback) {
    try {
      const { vehicle_id } = call.request;

      const reviews = await VehicleReview.find({ 
        vehicleId: vehicle_id, 
        isVisible: true 
      });

      if (reviews.length === 0) {
        return callback(null, {
          average_rating: 0,
          total_reviews: 0,
          rating_distribution: {
            five_star: 0, four_star: 0, three_star: 0, two_star: 0, one_star: 0
          }
        });
      }

      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = totalRating / reviews.length;

      const distribution = {
        five_star: reviews.filter(r => r.rating === 5).length,
        four_star: reviews.filter(r => r.rating === 4).length,
        three_star: reviews.filter(r => r.rating === 3).length,
        two_star: reviews.filter(r => r.rating === 2).length,
        one_star: reviews.filter(r => r.rating === 1).length,
      };

      callback(null, {
        average_rating: parseFloat(avgRating.toFixed(1)),
        total_reviews: reviews.length,
        rating_distribution: distribution
      });

    } catch (error) {
      console.error("❌ gRPC getVehicleReviewSummary error:", error);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message,
      });
    }
  }

  async getOwnerReviewSummary(call, callback) {
    try {
      const { owner_id } = call.request;

      const reviews = await OwnerReview.find({ 
        ownerId: owner_id, 
        isVisible: true 
      });

      if (reviews.length === 0) {
        return callback(null, {
          average_rating: 0,
          total_reviews: 0,
          rating_distribution: {
            five_star: 0, four_star: 0, three_star: 0, two_star: 0, one_star: 0
          },
          aspect_ratings: {
            communication: 0,
            reliability: 0,
            car_condition: 0
          }
        });
      }

      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = totalRating / reviews.length;

      const distribution = {
        five_star: reviews.filter(r => r.rating === 5).length,
        four_star: reviews.filter(r => r.rating === 4).length,
        three_star: reviews.filter(r => r.rating === 3).length,
        two_star: reviews.filter(r => r.rating === 2).length,
        one_star: reviews.filter(r => r.rating === 1).length,
      };

      // Calculate aspect ratings
      const reviewsWithAspects = reviews.filter(r => r.aspects);
      const aspectRatings = {
        communication: 0,
        reliability: 0,
        car_condition: 0
      };

      if (reviewsWithAspects.length > 0) {
        const sumAspects = reviewsWithAspects.reduce((acc, r) => ({
          communication: acc.communication + (r.aspects?.communication || 0),
          reliability: acc.reliability + (r.aspects?.reliability || 0),
          car_condition: acc.car_condition + (r.aspects?.carCondition || 0)
        }), { communication: 0, reliability: 0, car_condition: 0 });

        aspectRatings.communication = parseFloat((sumAspects.communication / reviewsWithAspects.length).toFixed(1));
        aspectRatings.reliability = parseFloat((sumAspects.reliability / reviewsWithAspects.length).toFixed(1));
        aspectRatings.car_condition = parseFloat((sumAspects.car_condition / reviewsWithAspects.length).toFixed(1));
      }

      callback(null, {
        average_rating: parseFloat(avgRating.toFixed(1)),
        total_reviews: reviews.length,
        rating_distribution: distribution,
        aspect_ratings: aspectRatings
      });

    } catch (error) {
      console.error("❌ gRPC getOwnerReviewSummary error:", error);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message,
      });
    }
  }

  async canReviewBooking(call, callback) {
    try {
      const { booking_id, user_id } = call.request;

      const vehicleReview = await VehicleReview.findOne({ 
        bookingId: booking_id 
      });
      const ownerReview = await OwnerReview.findOne({ 
        bookingId: booking_id 
      });

      callback(null, {
        can_review_vehicle: !vehicleReview,
        can_review_owner: !ownerReview,
        vehicle_already_reviewed: !!vehicleReview,
        owner_already_reviewed: !!ownerReview,
        message: vehicleReview || ownerReview 
          ? "Some reviews already submitted" 
          : "Can submit reviews"
      });

    } catch (error) {
      console.error("❌ gRPC canReviewBooking error:", error);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message,
      });
    }
  }

  async getReviewByBooking(call, callback) {
    try {
      const { booking_id, review_type } = call.request;

      let review;
      if (review_type === 'vehicle') {
        review = await VehicleReview.findOne({ bookingId: booking_id });
      } else {
        review = await OwnerReview.findOne({ bookingId: booking_id });
      }

      if (!review) {
        return callback(null, {
          has_review: false,
          review_id: '',
          rating: 0,
          comment: '',
          created_at: ''
        });
      }

      callback(null, {
        has_review: true,
        review_id: review._id.toString(),
        rating: review.rating,
        comment: review.comment || '',
        created_at: review.createdAt.toISOString()
      });

    } catch (error) {
      console.error("❌ gRPC getReviewByBooking error:", error);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message,
      });
    }
  }

  start(port = 50054) {
    this.server.addService(reviewProto.ReviewService.service, {
      GetVehicleReviewSummary: this.getVehicleReviewSummary.bind(this),
      GetOwnerReviewSummary: this.getOwnerReviewSummary.bind(this),
      CanReviewBooking: this.canReviewBooking.bind(this),
      GetReviewByBooking: this.getReviewByBooking.bind(this)
    });

    this.server.bindAsync(
      `0.0.0.0:${port}`,
      grpc.ServerCredentials.createInsecure(),
      (err, port) => {
        if (err) {
          console.error("❌ Failed to start gRPC server:", err);
          return;
        }
        console.log(`✅ Review gRPC server running on port ${port}`);
      }
    );
  }

  stop() {
    this.server.tryShutdown(() => {
      console.log("gRPC server stopped");
    });
  }
}

module.exports = ReviewGrpcServer;