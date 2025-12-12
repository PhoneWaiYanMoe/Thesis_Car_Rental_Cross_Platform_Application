const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const nominatimService = require('../services/nominatim_service');
const cacheService = require('../services/cache_service');

// Load proto file
const PROTO_PATH = path.join(__dirname, '../../proto/location.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const locationProto = grpc.loadPackageDefinition(packageDefinition).location;

class LocationGrpcServer {
  constructor() {
    this.server = new grpc.Server();
  }

  // Search for locations
  async searchLocation(call, callback) {
    try {
      const { query, limit } = call.request;

      if (!query || query.trim().length === 0) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: 'Query parameter is required'
        });
      }

      // Check cache
      const cacheKey = `search:${query}:${limit || 10}`;
      const cached = await cacheService.get(cacheKey);
      
      if (cached) {
        console.log('✅ gRPC Cache hit for:', query);
        return callback(null, { results: JSON.parse(cached) });
      }

      // Call Nominatim service
      const results = await nominatimService.search(query, limit || 10);

      // Cache for 1 hour
      await cacheService.set(cacheKey, JSON.stringify(results), 3600);

      callback(null, { results });
    } catch (error) {
      console.error('❌ gRPC searchLocation error:', error);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message
      });
    }
  }

  // Reverse geocoding
  async reverseGeocode(call, callback) {
    try {
      const { latitude, longitude } = call.request;

      if (!latitude || !longitude) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: 'Latitude and longitude are required'
        });
      }

      // Check cache
      const cacheKey = `reverse:${latitude}:${longitude}`;
      const cached = await cacheService.get(cacheKey);
      
      if (cached) {
        console.log('✅ gRPC Cache hit for reverse geocode');
        return callback(null, JSON.parse(cached));
      }

      // Call Nominatim service
      const result = await nominatimService.reverse(latitude, longitude);

      // Cache for 24 hours
      await cacheService.set(cacheKey, JSON.stringify(result), 86400);

      callback(null, result);
    } catch (error) {
      console.error('❌ gRPC reverseGeocode error:', error);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message
      });
    }
  }

  // Get place details
  async getPlaceDetails(call, callback) {
    try {
      const { place_id } = call.request;

      if (!place_id) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: 'Place ID is required'
        });
      }

      // Check cache
      const cacheKey = `details:${place_id}`;
      const cached = await cacheService.get(cacheKey);
      
      if (cached) {
        return callback(null, JSON.parse(cached));
      }

      // Call Nominatim service
      const result = await nominatimService.getDetails(place_id);

      // Cache for 24 hours
      await cacheService.set(cacheKey, JSON.stringify(result), 86400);

      callback(null, result);
    } catch (error) {
      console.error('❌ gRPC getPlaceDetails error:', error);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message
      });
    }
  }

  // Calculate distance
  async calculateDistance(call, callback) {
    try {
      const { lat1, lon1, lat2, lon2 } = call.request;

      if (!lat1 || !lon1 || !lat2 || !lon2) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: 'All coordinates are required'
        });
      }

      const distance = nominatimService.calculateDistance(lat1, lon1, lat2, lon2);

      callback(null, {
        distance: Math.round(distance * 100) / 100,
        unit: 'km'
      });
    } catch (error) {
      console.error('❌ gRPC calculateDistance error:', error);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message
      });
    }
  }

  // Check service area
  async checkServiceArea(call, callback) {
    try {
      const { latitude, longitude } = call.request;

      if (!latitude || !longitude) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: 'Latitude and longitude are required'
        });
      }

      // Ho Chi Minh City center
      const hcmCenter = { lat: 10.8231, lon: 106.6297 };
      const maxDistance = 50; // 50km radius

      const distance = nominatimService.calculateDistance(
        latitude,
        longitude,
        hcmCenter.lat,
        hcmCenter.lon
      );

      const inServiceArea = distance <= maxDistance;

      callback(null, {
        in_service_area: inServiceArea,
        distance: Math.round(distance * 100) / 100,
        message: inServiceArea
          ? 'Location is within service area'
          : `Location is ${Math.round(distance)}km away from service area`
      });
    } catch (error) {
      console.error('❌ gRPC checkServiceArea error:', error);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message
      });
    }
  }

  start(port = 50051) {
    // Add service implementation
    this.server.addService(locationProto.LocationService.service, {
      SearchLocation: this.searchLocation.bind(this),
      ReverseGeocode: this.reverseGeocode.bind(this),
      GetPlaceDetails: this.getPlaceDetails.bind(this),
      CalculateDistance: this.calculateDistance.bind(this),
      CheckServiceArea: this.checkServiceArea.bind(this)
    });

    // Start server
    this.server.bindAsync(
      `0.0.0.0:${port}`,
      grpc.ServerCredentials.createInsecure(),
      (err, port) => {
        if (err) {
          console.error('❌ Failed to start gRPC server:', err);
          return;
        }
        console.log(`✅ Location gRPC server running on port ${port}`);
      }
    );
  }

  stop() {
    this.server.tryShutdown(() => {
      console.log('gRPC server stopped');
    });
  }
}

module.exports = LocationGrpcServer;