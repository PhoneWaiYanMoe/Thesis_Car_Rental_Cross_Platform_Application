// Mobile/wiz/lib/screens/Cars/services/favorites_api_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:wiz/services/local_storage_service.dart';

class FavoritesApiService {
  static const String baseUrl = 'http://10.0.2.2:3001'; // user-service
  final LocalStorageService _storage = LocalStorageService();

  /// Get user's favorite vehicles
  Future<FavoritesResponse> getFavorites({int page = 1, int limit = 20}) async {
    try {
      final token = await _storage.getToken();
      if (token == null) throw Exception('Not authenticated');

      final uri = Uri.parse(
        '$baseUrl/favorites',
      ).replace(queryParameters: {'page': page.toString(), 'limit': limit.toString()});

      print('🔍 Fetching favorites...');

      final response = await http.get(
        uri,
        headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        print('✅ Loaded ${data['favorites'].length} favorites');
        return FavoritesResponse.fromJson(data);
      } else if (response.statusCode == 401) {
        throw Exception('Session expired. Please login again.');
      } else {
        print('❌ Get favorites failed: ${response.statusCode}');
        throw Exception('Failed to get favorites: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Get favorites error: $e');
      rethrow;
    }
  }

  /// Add vehicle to favorites
  Future<bool> addFavorite(String vehicleId) async {
    try {
      final token = await _storage.getToken();
      if (token == null) throw Exception('Not authenticated');

      print('➕ Adding vehicle to favorites: $vehicleId');

      final response = await http.post(
        Uri.parse('$baseUrl/favorites'),
        headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
        body: jsonEncode({'vehicleId': vehicleId}),
      );

      if (response.statusCode == 201) {
        print('✅ Vehicle added to favorites');
        return true;
      } else if (response.statusCode == 401) {
        throw Exception('Session expired. Please login again.');
      } else {
        final data = jsonDecode(response.body);
        throw Exception(data['error'] ?? 'Failed to add favorite');
      }
    } catch (e) {
      print('❌ Add favorite error: $e');
      rethrow;
    }
  }

  /// Remove vehicle from favorites
  Future<bool> removeFavorite(String vehicleId) async {
    try {
      final token = await _storage.getToken();
      if (token == null) throw Exception('Not authenticated');

      print('➖ Removing vehicle from favorites: $vehicleId');

      final response = await http.delete(
        Uri.parse('$baseUrl/favorites/$vehicleId'),
        headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        print('✅ Vehicle removed from favorites');
        return true;
      } else if (response.statusCode == 401) {
        throw Exception('Session expired. Please login again.');
      } else {
        final data = jsonDecode(response.body);
        throw Exception(data['error'] ?? 'Failed to remove favorite');
      }
    } catch (e) {
      print('❌ Remove favorite error: $e');
      rethrow;
    }
  }

  /// Check if vehicle is favorited
  Future<bool> checkFavorite(String vehicleId) async {
    try {
      final token = await _storage.getToken();
      if (token == null) return false;

      final response = await http.get(
        Uri.parse('$baseUrl/favorites/check/$vehicleId'),
        headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['isFavorited'] ?? false;
      }
      return false;
    } catch (e) {
      print('❌ Check favorite error: $e');
      return false;
    }
  }

  /// Get favorite count
  Future<int> getFavoriteCount() async {
    try {
      final token = await _storage.getToken();
      if (token == null) return 0;

      final response = await http.get(
        Uri.parse('$baseUrl/favorites/count'),
        headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['count'] ?? 0;
      }
      return 0;
    } catch (e) {
      print('❌ Get favorite count error: $e');
      return 0;
    }
  }
}

// ==================== RESPONSE MODELS ====================

class FavoritesResponse {
  final List<FavoriteVehicle> favorites;
  final Pagination pagination;

  FavoritesResponse({required this.favorites, required this.pagination});

  factory FavoritesResponse.fromJson(Map<String, dynamic> json) {
    return FavoritesResponse(
      favorites: (json['favorites'] as List?)?.map((f) => FavoriteVehicle.fromJson(f)).toList() ?? [],
      pagination: Pagination.fromJson(json['pagination'] ?? {}),
    );
  }
}

class FavoriteVehicle {
  final String vehicleId;
  final String addedAt;
  final VehicleDetails? vehicleDetails;

  FavoriteVehicle({required this.vehicleId, required this.addedAt, this.vehicleDetails});

  factory FavoriteVehicle.fromJson(Map<String, dynamic> json) {
    return FavoriteVehicle(
      vehicleId: json['vehicleId'] ?? '',
      addedAt: json['addedAt'] ?? '',
      vehicleDetails: json['vehicleDetails'] != null ? VehicleDetails.fromJson(json['vehicleDetails']) : null,
    );
  }
}

class VehicleDetails {
  final String vehicleId;
  final String ownerId;
  final String name;
  final String vehicleType;
  final int pricePerDay;
  final String status;
  final double averageRating;
  final int totalRentals;

  VehicleDetails({
    required this.vehicleId,
    required this.ownerId,
    required this.name,
    required this.vehicleType,
    required this.pricePerDay,
    required this.status,
    required this.averageRating,
    required this.totalRentals,
  });

  factory VehicleDetails.fromJson(Map<String, dynamic> json) {
    return VehicleDetails(
      vehicleId: json['vehicle_id'] ?? '',
      ownerId: json['owner_id'] ?? '',
      name: json['name'] ?? '',
      vehicleType: json['vehicle_type'] ?? '',
      pricePerDay: json['price_per_day'] ?? 0,
      status: json['status'] ?? '',
      averageRating: (json['average_rating'] ?? 0.0).toDouble(),
      totalRentals: json['total_rentals'] ?? 0,
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
