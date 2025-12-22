const mongoose = require("mongoose");

// Vehicle Review Schema
const vehicleReviewSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      required: true,
      unique: true, // Move unique here instead of index
    },
    vehicleId: {
      type: String,
      required: true,
      index: true,
    },
    customerId: {
      type: String,
      required: true,
      index: true,
    },
    ownerId: {
      type: String,
      required: true,
      index: true,
    },
    rating: {
      type: Number, // Changed from mongoose.Schema.Types.Decimal128
      required: true,
      min: 1,
      max: 5,
      get: (v) => parseFloat(v), // Ensure it's always a number
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    photos: [
      {
        type: String,
      },
    ],
    ownerResponse: {
      text: String,
      respondedAt: Date,
    },
    helpful: {
      type: Number,
      default: 0,
    },
    helpfulBy: [
      {
        type: String,
      },
    ],
    reported: {
      type: Boolean,
      default: false,
    },
    reportDetails: {
      reason: {
        type: String,
        enum: ["spam", "offensive", "inappropriate", "fake"],
      },
      details: String,
      reportedBy: String,
      reportedAt: Date,
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

// Owner Review Schema
const ownerReviewSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      required: true,
      unique: true, // Move unique here
    },
    ownerId: {
      type: String,
      required: true,
      index: true,
    },
    customerId: {
      type: String,
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      get: (v) => parseFloat(v),
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    aspects: {
      communication: {
        type: Number,
        min: 1,
        max: 5,
      },
      reliability: {
        type: Number,
        min: 1,
        max: 5,
      },
      carCondition: {
        type: Number,
        min: 1,
        max: 5,
      },
    },
    helpful: {
      type: Number,
      default: 0,
    },
    helpfulBy: [
      {
        type: String,
      },
    ],
    reported: {
      type: Boolean,
      default: false,
    },
    reportDetails: {
      reason: {
        type: String,
        enum: ["spam", "offensive", "inappropriate", "fake"],
      },
      details: String,
      reportedBy: String,
      reportedAt: Date,
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

// Indexes
vehicleReviewSchema.index({ vehicleId: 1, createdAt: -1 });
vehicleReviewSchema.index({ customerId: 1, vehicleId: 1 });
vehicleReviewSchema.index({ rating: 1 });

ownerReviewSchema.index({ ownerId: 1, createdAt: -1 });
ownerReviewSchema.index({ customerId: 1, ownerId: 1 });
ownerReviewSchema.index({ rating: 1 });

const VehicleReview = mongoose.model("VehicleReview", vehicleReviewSchema);
const OwnerReview = mongoose.model("OwnerReview", ownerReviewSchema);

module.exports = {
  VehicleReview,
  OwnerReview,
};
