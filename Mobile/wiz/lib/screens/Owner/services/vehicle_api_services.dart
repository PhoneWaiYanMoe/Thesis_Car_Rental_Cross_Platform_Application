// lib/screens/Owner/services/vehicle_api_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:wiz/services/local_storage_service.dart';

class VehicleApiService {
  static const String baseUrl = 'http://10.0.2.2:3002';
  final _localStorageService = LocalStorageService();

  // Get auth token
  Future<String?> _getAuthToken() async {
    try {
      final token = await _localStorageService.getToken();
      return token;
    } catch (e) {
      print('Error getting auth token: $e');
      return null;
    }
  }

  // ==================== PUBLIC ROUTES ====================

  // Search vehicles (public)
  Future<Map<String, dynamic>> searchVehicles({
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
      final queryParams = <String, String>{'sortBy': sortBy, 'page': page.toString(), 'limit': limit.toString()};

      if (vehicleType != null) queryParams['vehicleType'] = vehicleType;
      if (transmission != null) queryParams['transmission'] = transmission;
      if (fuelType != null) queryParams['fuelType'] = fuelType;
      if (minSeats != null) queryParams['minSeats'] = minSeats.toString();
      if (minPrice != null) queryParams['minPrice'] = minPrice.toString();
      if (maxPrice != null) queryParams['maxPrice'] = maxPrice.toString();
      if (city != null) queryParams['city'] = city;
      if (district != null) queryParams['district'] = district;
      if (startDate != null) queryParams['startDate'] = startDate;
      if (endDate != null) queryParams['endDate'] = endDate;

      final uri = Uri.parse('$baseUrl/vehicles/search').replace(queryParameters: queryParams);
      final response = await http.get(uri);

      if (response.statusCode == 200) {
        return {'success': true, 'data': jsonDecode(response.body)};
      } else {
        return {'success': false, 'error': 'Failed to search vehicles'};
      }
    } catch (e) {
      print('Error searching vehicles: $e');
      return {'success': false, 'error': e.toString()};
    }
  }

  // Get vehicle by ID (public)
  Future<Map<String, dynamic>> getVehicleById(String vehicleId) async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/vehicles/$vehicleId'));

      if (response.statusCode == 200) {
        return {'success': true, 'data': jsonDecode(response.body)};
      } else {
        return {'success': false, 'error': 'Vehicle not found'};
      }
    } catch (e) {
      print('Error getting vehicle: $e');
      return {'success': false, 'error': e.toString()};
    }
  }

  // Check vehicle availability
  Future<Map<String, dynamic>> checkAvailability({
    required String vehicleId,
    required String startDate,
    required String endDate,
  }) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/vehicles/$vehicleId/availability?startDate=$startDate&endDate=$endDate'),
      );

      if (response.statusCode == 200) {
        return {'success': true, 'data': jsonDecode(response.body)};
      } else {
        return {'success': false, 'error': 'Failed to check availability'};
      }
    } catch (e) {
      print('Error checking availability: $e');
      return {'success': false, 'error': e.toString()};
    }
  }

  // ==================== OWNER ROUTES (REQUIRES AUTH) ====================

  // Get my vehicles
  Future<Map<String, dynamic>> getMyVehicles({String status = 'all', String sortBy = 'name'}) async {
    try {
      final token = await _getAuthToken();
      if (token == null) {
        return {'success': false, 'error': 'Authentication required'};
      }

      final headers = {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'};

      final uri = Uri.parse(
        '$baseUrl/vehicles/owner/my-vehicles',
      ).replace(queryParameters: {'status': status, 'sortBy': sortBy});

      final response = await http.get(uri, headers: headers);

      if (response.statusCode == 200) {
        return {'success': true, 'data': jsonDecode(response.body)};
      } else if (response.statusCode == 401) {
        return {'success': false, 'error': 'Unauthorized'};
      } else if (response.statusCode == 403) {
        return {'success': false, 'error': 'Owner role required'};
      } else {
        return {'success': false, 'error': 'Failed to load vehicles'};
      }
    } catch (e) {
      print('Error getting my vehicles: $e');
      return {'success': false, 'error': e.toString()};
    }
  }

  // Create vehicle
  Future<Map<String, dynamic>> createVehicle({
    required String name,
    required String description,
    required String vehicleType,
    required String transmission,
    required String fuelType,
    required int seats,
    required int year,
    required int mileage,
    required String licensePlate,
    required int pricePerDay,
    required Map<String, dynamic> location,
    List<String>? features,
    Map<String, dynamic>? rules,
    bool driverSupported = false,
    bool instantBooking = false,
    bool deliveryAvailable = false,
    List<String>? photoIds,
  }) async {
    try {
      final token = await _getAuthToken();
      if (token == null) {
        return {'success': false, 'error': 'Authentication required'};
      }

      final headers = {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'};

      final body = jsonEncode({
        'name': name,
        'description': description,
        'vehicleType': vehicleType,
        'transmission': transmission,
        'fuelType': fuelType,
        'seats': seats,
        'year': year,
        'mileage': mileage,
        'licensePlate': licensePlate,
        'pricePerDay': pricePerDay,
        'location': location,
        'features': features ?? [],
        'rules': rules ?? {},
        'driverSupported': driverSupported,
        'instantBooking': instantBooking,
        'deliveryAvailable': deliveryAvailable,
        'photoIds': photoIds ?? [],
      });

      final response = await http.post(Uri.parse('$baseUrl/vehicles/owner'), headers: headers, body: body);

      if (response.statusCode == 201) {
        return {'success': true, 'data': jsonDecode(response.body)};
      } else if (response.statusCode == 403) {
        return {'success': false, 'error': 'Owner role required'};
      } else {
        final errorData = jsonDecode(response.body);
        return {'success': false, 'error': errorData['error'] ?? 'Failed to create vehicle'};
      }
    } catch (e) {
      print('Error creating vehicle: $e');
      return {'success': false, 'error': e.toString()};
    }
  }

  // Get my vehicle by ID
  Future<Map<String, dynamic>> getMyVehicleById(String vehicleId) async {
    try {
      final token = await _getAuthToken();
      if (token == null) {
        return {'success': false, 'error': 'Authentication required'};
      }

      final headers = {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'};

      final response = await http.get(Uri.parse('$baseUrl/vehicles/owner/$vehicleId'), headers: headers);

      if (response.statusCode == 200) {
        return {'success': true, 'data': jsonDecode(response.body)};
      } else if (response.statusCode == 404) {
        return {'success': false, 'error': 'Vehicle not found or not yours'};
      } else {
        return {'success': false, 'error': 'Failed to load vehicle'};
      }
    } catch (e) {
      print('Error getting my vehicle: $e');
      return {'success': false, 'error': e.toString()};
    }
  }

  // Update vehicle
  Future<Map<String, dynamic>> updateVehicle({
    required String vehicleId,
    String? name,
    String? description,
    int? pricePerDay,
    List<String>? features,
    Map<String, dynamic>? rules,
  }) async {
    try {
      final token = await _getAuthToken();
      if (token == null) {
        return {'success': false, 'error': 'Authentication required'};
      }

      final headers = {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'};

      final body = <String, dynamic>{};
      if (name != null) body['name'] = name;
      if (description != null) body['description'] = description;
      if (pricePerDay != null) body['pricePerDay'] = pricePerDay;
      if (features != null) body['features'] = features;
      if (rules != null) body['rules'] = rules;

      final response = await http.put(
        Uri.parse('$baseUrl/vehicles/owner/$vehicleId'),
        headers: headers,
        body: jsonEncode(body),
      );

      if (response.statusCode == 200) {
        return {'success': true, 'data': jsonDecode(response.body)};
      } else if (response.statusCode == 404) {
        return {'success': false, 'error': 'Vehicle not found or not yours'};
      } else {
        return {'success': false, 'error': 'Failed to update vehicle'};
      }
    } catch (e) {
      print('Error updating vehicle: $e');
      return {'success': false, 'error': e.toString()};
    }
  }

  // Delete vehicle
  Future<Map<String, dynamic>> deleteVehicle(String vehicleId) async {
    try {
      final token = await _getAuthToken();
      if (token == null) {
        return {'success': false, 'error': 'Authentication required'};
      }

      final headers = {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'};

      final response = await http.delete(Uri.parse('$baseUrl/vehicles/owner/$vehicleId'), headers: headers);

      if (response.statusCode == 200) {
        return {'success': true, 'data': jsonDecode(response.body)};
      } else if (response.statusCode == 404) {
        return {'success': false, 'error': 'Vehicle not found or not yours'};
      } else {
        return {'success': false, 'error': 'Failed to delete vehicle'};
      }
    } catch (e) {
      print('Error deleting vehicle: $e');
      return {'success': false, 'error': e.toString()};
    }
  }

  // Upload photos (mock - returns mock URLs)
  Future<Map<String, dynamic>> uploadPhotos({required String vehicleId, required List<String> photoUrls}) async {
    try {
      final token = await _getAuthToken();
      if (token == null) {
        return {'success': false, 'error': 'Authentication required'};
      }

      final headers = {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'};

      final body = jsonEncode({'photoUrls': photoUrls});

      final response = await http.post(
        Uri.parse('$baseUrl/vehicles/owner/$vehicleId/photos'),
        headers: headers,
        body: body,
      );

      if (response.statusCode == 201) {
        return {'success': true, 'data': jsonDecode(response.body)};
      } else {
        return {'success': false, 'error': 'Failed to upload photos'};
      }
    } catch (e) {
      print('Error uploading photos: $e');
      return {'success': false, 'error': e.toString()};
    }
  }
}
