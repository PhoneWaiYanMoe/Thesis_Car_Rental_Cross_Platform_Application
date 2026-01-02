// lib/screens/Cars/services/vehicle_api_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:wiz/screens/Cars/models/car.dart';

class VehicleApiService {
  static const String baseUrl = 'http://10.0.2.2:3002'; // vehicle-service

  /// Search vehicles with filters
  /// Returns VehicleSearchResponse with isLocationFiltered flag
  Future<VehicleSearchResponse> searchVehicles({
    String? vehicleType,
    String? transmission,
    String? fuelType,
    int? minSeats,
    int? minPrice,
    int? maxPrice,
    String? city,
    String? district,
    String? startDate,
    String? endDate,
    String sortBy = 'price',
    int page = 1,
    int limit = 20,
  }) async {
    try {
      // Build query parameters
      final queryParams = <String, String>{};

      if (vehicleType != null) queryParams['vehicleType'] = vehicleType.toLowerCase();
      if (transmission != null) queryParams['transmission'] = transmission.toLowerCase();
      if (fuelType != null) queryParams['fuelType'] = fuelType.toLowerCase();
      if (minSeats != null) queryParams['minSeats'] = minSeats.toString();
      if (minPrice != null) queryParams['minPrice'] = minPrice.toString();
      if (maxPrice != null) queryParams['maxPrice'] = maxPrice.toString();
      if (city != null) queryParams['city'] = city;
      if (district != null) queryParams['district'] = district;
      if (startDate != null) queryParams['startDate'] = startDate;
      if (endDate != null) queryParams['endDate'] = endDate;
      queryParams['sortBy'] = sortBy;
      queryParams['page'] = page.toString();
      queryParams['limit'] = limit.toString();

      final uri = Uri.parse('$baseUrl/vehicles/search').replace(queryParameters: queryParams);

      print('🔍 Searching vehicles: $uri');

      final response = await http.get(uri);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        print('✅ Found ${data['vehicles'].length} vehicles');

        // Check if location filtering was applied
        final hasLocationFilter = city != null || district != null;

        return VehicleSearchResponse.fromJson(data, hasLocationFilter: hasLocationFilter);
      } else {
        print('❌ Search failed: ${response.statusCode}');
        throw Exception('Failed to search vehicles: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Search error: $e');
      rethrow;
    }
  }

  /// Get vehicle details by ID
  Future<VehicleDetails> getVehicleDetails(String vehicleId) async {
    try {
      print('📦 Fetching vehicle details: $vehicleId');

      final response = await http.get(Uri.parse('$baseUrl/vehicles/$vehicleId'));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        print('✅ Vehicle details loaded');
        return VehicleDetails.fromJson(data['vehicle']);
      } else if (response.statusCode == 404) {
        throw Exception('Vehicle not found');
      } else {
        throw Exception('Failed to load vehicle details: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Get vehicle details error: $e');
      rethrow;
    }
  }

  /// Check vehicle availability for specific dates
  Future<VehicleAvailability> checkAvailability({
    required String vehicleId,
    required String startDate,
    required String endDate,
  }) async {
    try {
      print('📅 Checking availability: $vehicleId from $startDate to $endDate');

      final uri = Uri.parse(
        '$baseUrl/vehicles/$vehicleId/availability',
      ).replace(queryParameters: {'startDate': startDate, 'endDate': endDate});

      final response = await http.get(uri);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        print('✅ Availability checked: ${data['isAvailable']}');
        return VehicleAvailability.fromJson(data);
      } else if (response.statusCode == 404) {
        throw Exception('Vehicle not found');
      } else {
        throw Exception('Failed to check availability: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Check availability error: $e');
      rethrow;
    }
  }
}

// ==================== RESPONSE MODELS ====================

class VehicleSearchResponse {
  final List<VehicleSummary> vehicles;
  final Pagination pagination;
  final bool hasLocationFilter; // NEW: Track if location filter was applied
  final String? searchedCity;
  final String? searchedDistrict;

  VehicleSearchResponse({
    required this.vehicles,
    required this.pagination,
    this.hasLocationFilter = false,
    this.searchedCity,
    this.searchedDistrict,
  });

  factory VehicleSearchResponse.fromJson(
    Map<String, dynamic> json, {
    bool hasLocationFilter = false,
    String? searchedCity,
    String? searchedDistrict,
  }) {
    return VehicleSearchResponse(
      vehicles: (json['vehicles'] as List).map((v) => VehicleSummary.fromJson(v)).toList(),
      pagination: Pagination.fromJson(json['pagination']),
      hasLocationFilter: hasLocationFilter,
      searchedCity: searchedCity,
      searchedDistrict: searchedDistrict,
    );
  }

  // Check if we found vehicles in the searched location
  bool get hasVehiclesInSearchedLocation => hasLocationFilter && vehicles.isNotEmpty;

  // Check if we need to show "no vehicles in area" message
  bool get shouldShowNoVehiclesMessage => hasLocationFilter && vehicles.isEmpty;
}

class VehicleSummary {
  final String id;
  final String name;
  final String vehicleType;
  final String transmission;
  final String fuelType;
  final int seats;
  final int year;
  final int pricePerDay;
  final double rating;
  final int totalRentals;
  final String? primaryPhoto;
  final Map<String, dynamic> location;
  final bool instantBooking;
  final bool driverSupported;
  final bool deliveryAvailable;
  final bool isAvailable;

  VehicleSummary({
    required this.id,
    required this.name,
    required this.vehicleType,
    required this.transmission,
    required this.fuelType,
    required this.seats,
    required this.year,
    required this.pricePerDay,
    required this.rating,
    required this.totalRentals,
    this.primaryPhoto,
    required this.location,
    required this.instantBooking,
    required this.driverSupported,
    required this.deliveryAvailable,
    required this.isAvailable,
  });

  factory VehicleSummary.fromJson(Map<String, dynamic> json) {
    return VehicleSummary(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      vehicleType: json['vehicleType'] ?? '',
      transmission: json['transmission'] ?? '',
      fuelType: json['fuelType'] ?? '',
      seats: json['seats'] ?? 5,
      year: json['year'] ?? 2020,
      pricePerDay: json['pricePerDay'] ?? 0,
      rating: (json['rating'] ?? 0.0).toDouble(),
      totalRentals: json['totalRentals'] ?? 0,
      primaryPhoto: json['primaryPhoto'],
      location: json['location'] ?? {},
      instantBooking: json['instantBooking'] ?? false,
      driverSupported: json['driverSupported'] ?? false,
      deliveryAvailable: json['deliveryAvailable'] ?? false,
      isAvailable: json['isAvailable'] ?? true,
    );
  }

  // Convert to Car model for compatibility
  Car toCar() {
    return Car(
      image: primaryPhoto ?? 'assets/images/Car.png',
      images: [primaryPhoto ?? 'assets/images/Car.png'],
      name: name,
      rating: rating,
      reviews: totalRentals,
      price: pricePerDay,
      owner: 'Vehicle Owner',
      ownerAvatar: 'assets/images/article_2.png',
      ownerJoinedDate: DateTime.now(),
      location: location['city'] ?? location['district'] ?? 'Unknown',
      seats: seats,
      fuel: _capitalize(fuelType),
      type: _capitalize(vehicleType),
      transmission: _capitalize(transmission),
      instant: instantBooking,
      driver: driverSupported,
      discount: false,
      brand: name.split(' ').first,
      year: year,
      mileage: 'Unknown',
      color: 'Unknown',
      features: [],
      rules: [],
      limitsAndFees: {},
    );
  }

  String _capitalize(String s) {
    if (s.isEmpty) return s;
    return s[0].toUpperCase() + s.substring(1).toLowerCase();
  }
}

class VehicleDetails {
  final String id;
  final String ownerId;
  final String name;
  final String description;
  final Map<String, dynamic> specifications;
  final List<Map<String, dynamic>> photos;
  final List<String> features;
  final Map<String, dynamic> pricing;
  final Map<String, dynamic> location;
  final Map<String, dynamic> availability;
  final Map<String, dynamic> performance;
  final Map<String, dynamic> rules;
  final String createdAt;

  VehicleDetails({
    required this.id,
    required this.ownerId,
    required this.name,
    required this.description,
    required this.specifications,
    required this.photos,
    required this.features,
    required this.pricing,
    required this.location,
    required this.availability,
    required this.performance,
    required this.rules,
    required this.createdAt,
  });

  factory VehicleDetails.fromJson(Map<String, dynamic> json) {
    return VehicleDetails(
      id: json['id'] ?? '',
      ownerId: json['ownerId'] ?? '',
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      specifications: json['specifications'] ?? {},
      photos: (json['photos'] as List?)?.cast<Map<String, dynamic>>() ?? [],
      features: (json['features'] as List?)?.cast<String>() ?? [],
      pricing: json['pricing'] ?? {},
      location: json['location'] ?? {},
      availability: json['availability'] ?? {},
      performance: json['performance'] ?? {},
      rules: json['rules'] ?? {},
      createdAt: json['createdAt'] ?? '',
    );
  }

  // Convert to Car model
  Car toCar() {
    final specs = specifications;
    final perf = performance;

    return Car(
      image: photos.isNotEmpty ? photos[0]['url'] ?? 'assets/images/Car.png' : 'assets/images/Car.png',
      images: photos.map((p) => p['url']?.toString() ?? 'assets/images/Car.png').toList(),
      name: name,
      rating: (perf['rating'] ?? 0.0).toDouble(),
      reviews: perf['reviewCount'] ?? 0,
      price: pricing['pricePerDay'] ?? 0,
      owner: 'Vehicle Owner',
      ownerAvatar: 'assets/images/article_2.png',
      ownerJoinedDate: DateTime.now(),
      location: location['city'] ?? location['district'] ?? 'Unknown',
      seats: specs['seats'] ?? 5,
      fuel: _capitalize(specs['fuelType'] ?? 'gasoline'),
      type: _capitalize(specs['vehicleType'] ?? 'sedan'),
      transmission: _capitalize(specs['transmission'] ?? 'automatic'),
      instant: availability['instantBooking'] ?? false,
      driver: availability['driverSupported'] ?? false,
      discount: false,
      brand: name.split(' ').first,
      year: specs['year'] ?? 2020,
      mileage: '${specs['mileage'] ?? 0} km',
      color: 'Unknown',
      features: features,
      rules: [], // Can be extracted from rules map
      limitsAndFees: {},
    );
  }

  String _capitalize(String s) {
    if (s.isEmpty) return s;
    return s[0].toUpperCase() + s.substring(1).toLowerCase();
  }
}

class VehicleAvailability {
  final String vehicleId;
  final bool isAvailable;
  final String message;
  final List<UnavailablePeriod> unavailablePeriods;

  VehicleAvailability({
    required this.vehicleId,
    required this.isAvailable,
    required this.message,
    required this.unavailablePeriods,
  });

  factory VehicleAvailability.fromJson(Map<String, dynamic> json) {
    return VehicleAvailability(
      vehicleId: json['vehicleId'] ?? '',
      isAvailable: json['isAvailable'] ?? false,
      message: json['message'] ?? '',
      unavailablePeriods:
          (json['unavailablePeriods'] as List?)?.map((p) => UnavailablePeriod.fromJson(p)).toList() ?? [],
    );
  }
}

class UnavailablePeriod {
  final String startDate;
  final String endDate;
  final String reason;

  UnavailablePeriod({required this.startDate, required this.endDate, required this.reason});

  factory UnavailablePeriod.fromJson(Map<String, dynamic> json) {
    return UnavailablePeriod(
      startDate: json['startDate'] ?? '',
      endDate: json['endDate'] ?? '',
      reason: json['reason'] ?? '',
    );
  }
}

class Pagination {
  final int total;
  final int page;
  final int limit;

  Pagination({required this.total, required this.page, required this.limit});

  factory Pagination.fromJson(Map<String, dynamic> json) {
    return Pagination(total: json['total'] ?? 0, page: json['page'] ?? 1, limit: json['limit'] ?? 20);
  }

  int get totalPages => (total / limit).ceil();
  bool get hasNextPage => page < totalPages;
  bool get hasPreviousPage => page > 1;
}
