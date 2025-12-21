// MongoDB initialization script
// This runs automatically when the container starts

db = db.getSiblingDB('wiz_reviews');

// Create collections with validation
db.createCollection('vehiclereviews', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['bookingId', 'vehicleId', 'customerId', 'rating'],
      properties: {
        bookingId: {
          bsonType: 'string',
          description: 'Booking ID is required'
        },
        vehicleId: {
          bsonType: 'string',
          description: 'Vehicle ID is required'
        },
        customerId: {
          bsonType: 'string',
          description: 'Customer ID is required'
        },
        rating: {
          bsonType: 'double',
          minimum: 1,
          maximum: 5,
          description: 'Rating must be between 1 and 5'
        }
      }
    }
  }
});

db.createCollection('ownerreviews', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['bookingId', 'ownerId', 'customerId', 'rating'],
      properties: {
        bookingId: {
          bsonType: 'string',
          description: 'Booking ID is required'
        },
        ownerId: {
          bsonType: 'string',
          description: 'Owner ID is required'
        },
        customerId: {
          bsonType: 'string',
          description: 'Customer ID is required'
        },
        rating: {
          bsonType: 'double',
          minimum: 1,
          maximum: 5,
          description: 'Rating must be between 1 and 5'
        }
      }
    }
  }
});

// Create indexes
db.vehiclereviews.createIndex({ bookingId: 1 }, { unique: true });
db.vehiclereviews.createIndex({ vehicleId: 1, createdAt: -1 });
db.vehiclereviews.createIndex({ customerId: 1, vehicleId: 1 }, { unique: true });
db.vehiclereviews.createIndex({ rating: 1 });

db.ownerreviews.createIndex({ bookingId: 1 }, { unique: true });
db.ownerreviews.createIndex({ ownerId: 1, createdAt: -1 });
db.ownerreviews.createIndex({ customerId: 1, ownerId: 1 }, { unique: true });
db.ownerreviews.createIndex({ rating: 1 });

print('✅ MongoDB initialized successfully');
print('📊 Database: wiz_reviews');
print('📝 Collections created: vehiclereviews, ownerreviews');
print('🔍 Indexes created');