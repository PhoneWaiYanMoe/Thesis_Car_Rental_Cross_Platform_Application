const mongoose = require('mongoose');

// Vehicle Review Schema
const vehicleReviewSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    required: true,
    index: true
  },
  vehicleId: {
    type: String,
    required: true,
    index: true
  },
  customerId: {
    type: String,
    required: true,
    index: true
  },
  ownerId: {
    type: String,
    required: true,
    index: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  photos: [{
    type: String
  }],
  ownerResponse: {
    text: String,
    respondedAt: Date
  },
  helpful: {
    type: Number,
    default: 0
  },
  helpfulBy: [{
    type: String
  }],
  reported: {
    type: Boolean,
    default: false
  },
  reportDetails: {
    reason: {
      type: String,
      enum: ['spam', 'offensive', 'inappropriate', 'fake']
    },
    details: String,
    reportedBy: String,
    reportedAt: Date
  },
  isVisible: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Owner Review Schema
const ownerReviewSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    required: true,
    index: true
  },
  ownerId: {
    type: String,
    required: true,
    index: true
  },
  customerId: {
    type: String,
    required: true,
    index: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  aspects: {
    communication: {
      type: Number,
      min: 1,
      max: 5
    },
    reliability: {
      type: Number,
      min: 1,
      max: 5
    },
    carCondition: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  helpful: {
    type: Number,
    default: 0
  },
  helpfulBy: [{
    type: String
  }],
  reported: {
    type: Boolean,
    default: false
  },
  reportDetails: {
    reason: {
      type: String,
      enum: ['spam', 'offensive', 'inappropriate', 'fake']
    },
    details: String,
    reportedBy: String,
    reportedAt: Date
  },
  isVisible: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for performance
vehicleReviewSchema.index({ vehicleId: 1, createdAt: -1 });
vehicleReviewSchema.index({ customerId: 1, vehicleId: 1 }, { unique: true });
vehicleReviewSchema.index({ rating: 1 });

ownerReviewSchema.index({ ownerId: 1, createdAt: -1 });
ownerReviewSchema.index({ customerId: 1, ownerId: 1 }, { unique: true });
ownerReviewSchema.index({ rating: 1 });

// Prevent duplicate reviews for same booking
vehicleReviewSchema.index({ bookingId: 1 }, { unique: true });
ownerReviewSchema.index({ bookingId: 1 }, { unique: true });

const VehicleReview = mongoose.model('VehicleReview', vehicleReviewSchema);
const OwnerReview = mongoose.model('OwnerReview', ownerReviewSchema);

module.exports = {
  VehicleReview,
  OwnerReview
};