import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:latlong2/latlong.dart';
import 'package:wiz/services/local_storage_service.dart';

class LocationApiService {
  // ✅ CHANGE THIS TO YOUR BACKEND URL
  // static const String baseUrl = 'http://10.0.2.2:3003';
  //static const String baseUrl = 'http://localhost:3003';
   static const String baseUrl = 'http://206.189.147.242'; 
  final _localStorageService = LocalStorageService();

  // Get auth token from local storage
  Future<String?> _getAuthToken() async {
    try {
      final token = await _localStorageService.getToken();
      return token;
    } catch (e) {
      print('Error getting auth token: $e');
      return null;
    }
  }

  // ✅ FIXED: Use backend autocomplete endpoint for real-time search
  Future<List<SearchResult>> searchLocation(String query) async {
    if (query.isEmpty || query.length < 2) return [];

    try {
      print('🔍 [FRONTEND] Calling backend autocomplete: "$query"');

      final response = await http
          .get(Uri.parse('$baseUrl/location/autocomplete?q=$query&limit=10'))
          .timeout(const Duration(seconds: 10));

      print('📡 [FRONTEND] Response status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        print('✅ [FRONTEND] Received ${data.length} results from backend');
        return data.map((json) => SearchResult.fromJson(json)).toList();
      } else {
        print('❌ [FRONTEND] Search failed: ${response.statusCode}');
        throw Exception('Failed to search location');
      }
    } catch (e) {
      print('❌ [FRONTEND] Error searching location: $e');
      return [];
    }
  }

  // Reverse geocoding (get address from coordinates)
  Future<String?> reverseGeocode(LatLng position) async {
    try {
      print('📍 [FRONTEND] Reverse geocoding: (${position.latitude}, ${position.longitude})');

      final response = await http
          .get(Uri.parse('$baseUrl/location/reverse?lat=${position.latitude}&lon=${position.longitude}'))
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final address = data['displayName'] ?? data['display_name'];
        print('✅ [FRONTEND] Reverse result: $address');
        return address;
      }
    } catch (e) {
      print('❌ [FRONTEND] Error reverse geocoding: $e');
    }
    return null;
  }

  // Get search history from backend
  Future<List<HistoryItem>> getSearchHistory({int limit = 10}) async {
    try {
      final token = await _getAuthToken();

      if (token == null) {
        print('⚠️ [FRONTEND] No auth token - cannot get history');
        return [];
      }

      final headers = <String, String>{'Content-Type': 'application/json', 'Authorization': 'Bearer $token'};

      final response = await http
          .get(Uri.parse('$baseUrl/location/history?limit=$limit'), headers: headers)
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        print('✅ [FRONTEND] Loaded ${data.length} history items from backend');
        return data.map((json) => HistoryItem.fromJson(json)).toList();
      } else if (response.statusCode == 401) {
        print('⚠️ [FRONTEND] History requires authentication');
        return [];
      } else {
        print('⚠️ [FRONTEND] History fetch failed: ${response.statusCode}');
        return [];
      }
    } catch (e) {
      print('❌ [FRONTEND] Error getting search history: $e');
    }
    return [];
  }

  // Save location to history (backend)
  Future<bool> saveToHistory({
    required String displayName,
    required String shortName,
    required String subtitle,
    required double latitude,
    required double longitude,
  }) async {
    try {
      final token = await _getAuthToken();

      if (token == null) {
        print('⚠️ [FRONTEND] No auth token - cannot save history');
        return false;
      }

      final headers = <String, String>{'Content-Type': 'application/json', 'Authorization': 'Bearer $token'};

      print('💾 [FRONTEND] Saving to history: $displayName');

      final response = await http
          .post(
            Uri.parse('$baseUrl/location/history'),
            headers: headers,
            body: jsonEncode({
              'displayName': displayName,
              'shortName': shortName,
              'subtitle': subtitle,
              'latitude': latitude,
              'longitude': longitude,
            }),
          )
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 201 || response.statusCode == 200) {
        print('✅ [FRONTEND] Saved to backend history: $shortName');
        return true;
      } else if (response.statusCode == 401) {
        print('⚠️ [FRONTEND] History save requires authentication');
        return false;
      } else {
        print('⚠️ [FRONTEND] History save failed: ${response.statusCode}');
        return false;
      }
    } catch (e) {
      print('❌ [FRONTEND] Error saving to history: $e');
    }
    return false;
  }

  // Delete from history
  Future<bool> deleteFromHistory(int id) async {
    try {
      final token = await _getAuthToken();

      if (token == null) {
        print('⚠️ [FRONTEND] No auth token - cannot delete history');
        return false;
      }

      final headers = <String, String>{'Content-Type': 'application/json', 'Authorization': 'Bearer $token'};

      final response = await http
          .delete(Uri.parse('$baseUrl/location/history/$id'), headers: headers)
          .timeout(const Duration(seconds: 10));

      return response.statusCode == 200;
    } catch (e) {
      print('❌ [FRONTEND] Error deleting from history: $e');
    }
    return false;
  }

  // Clear all history
  Future<bool> clearHistory() async {
    try {
      final token = await _getAuthToken();

      if (token == null) {
        print('⚠️ [FRONTEND] No auth token - cannot clear history');
        return false;
      }

      final headers = <String, String>{'Content-Type': 'application/json', 'Authorization': 'Bearer $token'};

      final response = await http
          .delete(Uri.parse('$baseUrl/location/history'), headers: headers)
          .timeout(const Duration(seconds: 10));

      return response.statusCode == 200;
    } catch (e) {
      print('❌ [FRONTEND] Error clearing history: $e');
    }
    return false;
  }

  // Calculate distance between two points
  Future<double?> calculateDistance(double lat1, double lon1, double lat2, double lon2) async {
    try {
      final response = await http
          .post(
            Uri.parse('$baseUrl/location/calculate-distance'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({'lat1': lat1, 'lon1': lon1, 'lat2': lat2, 'lon2': lon2}),
          )
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['distance'].toDouble();
      }
    } catch (e) {
      print('❌ [FRONTEND] Error calculating distance: $e');
    }
    return null;
  }

  // Check if location is in service area
  Future<ServiceAreaResult?> checkServiceArea(double latitude, double longitude) async {
    try {
      final response = await http
          .post(
            Uri.parse('$baseUrl/location/check-service-area'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({'latitude': latitude, 'longitude': longitude}),
          )
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return ServiceAreaResult.fromJson(data);
      }
    } catch (e) {
      print('❌ [FRONTEND] Error checking service area: $e');
    }
    return null;
  }
}

// Search Result Model
class SearchResult {
  final String placeId;
  final String displayName;
  final LatLng position;
  final String? road;
  final String? suburb;
  final String? city;
  final String? country;
  final String type;

  SearchResult({
    required this.placeId,
    required this.displayName,
    required this.position,
    this.road,
    this.suburb,
    this.city,
    this.country,
    required this.type,
  });

  factory SearchResult.fromJson(Map<String, dynamic> json) {
    final address = json['address'] ?? {};

    return SearchResult(
      placeId: json['placeId']?.toString() ?? json['place_id']?.toString() ?? '',
      displayName: json['displayName'] ?? json['display_name'] ?? '',
      position: LatLng(
        double.parse(json['latitude']?.toString() ?? json['lat']?.toString() ?? '0'),
        double.parse(json['longitude']?.toString() ?? json['lon']?.toString() ?? '0'),
      ),
      road: address['road'],
      suburb: address['suburb'],
      city: address['city'],
      country: address['country'],
      type: json['type'] ?? 'unknown',
    );
  }

  String get shortName {
    if (road != null && suburb != null) {
      return '$road, $suburb';
    } else if (road != null) {
      return road!;
    } else if (suburb != null) {
      return suburb!;
    }
    return displayName.split(',').first;
  }

  String get subtitle {
    List<String> parts = [];
    if (suburb != null && road == null) parts.add(suburb!);
    if (city != null) parts.add(city!);
    if (country != null) parts.add(country!);
    return parts.join(', ');
  }
}

// History Item Model (from backend)
class HistoryItem {
  final int id;
  final String displayName;
  final String shortName;
  final String subtitle;
  final LatLng position;
  final DateTime createdAt;

  HistoryItem({
    required this.id,
    required this.displayName,
    required this.shortName,
    required this.subtitle,
    required this.position,
    required this.createdAt,
  });

  factory HistoryItem.fromJson(Map<String, dynamic> json) {
    return HistoryItem(
      id: json['id'],
      displayName: json['display_name'] ?? json['displayName'] ?? '',
      shortName: json['short_name'] ?? json['shortName'] ?? '',
      subtitle: json['subtitle'] ?? '',
      position: LatLng(
        double.parse(json['latitude']?.toString() ?? '0'),
        double.parse(json['longitude']?.toString() ?? '0'),
      ),
      createdAt: DateTime.parse(json['created_at'] ?? json['createdAt'] ?? DateTime.now().toIso8601String()),
    );
  }

  SearchResult toSearchResult() {
    final displayNameValue = displayName.trim().isNotEmpty
        ? displayName
        : shortName.trim().isNotEmpty
        ? shortName
        : 'Unknown Location';

    return SearchResult(placeId: id.toString(), displayName: displayNameValue, position: position, type: 'history');
  }
}

// Place Details Model
class PlaceDetails {
  final String placeId;
  final String displayName;
  final LatLng position;
  final Map<String, dynamic> address;
  final String type;

  PlaceDetails({
    required this.placeId,
    required this.displayName,
    required this.position,
    required this.address,
    required this.type,
  });

  factory PlaceDetails.fromJson(Map<String, dynamic> json) {
    return PlaceDetails(
      placeId: json['placeId']?.toString() ?? json['place_id']?.toString() ?? '',
      displayName: json['displayName'] ?? json['display_name'] ?? '',
      position: LatLng(
        double.parse(json['latitude']?.toString() ?? json['lat']?.toString() ?? '0'),
        double.parse(json['longitude']?.toString() ?? json['lon']?.toString() ?? '0'),
      ),
      address: json['address'] ?? {},
      type: json['type'] ?? 'unknown',
    );
  }
}

// Service Area Result Model
class ServiceAreaResult {
  final bool inServiceArea;
  final double distance;
  final String message;

  ServiceAreaResult({required this.inServiceArea, required this.distance, required this.message});

  factory ServiceAreaResult.fromJson(Map<String, dynamic> json) {
    return ServiceAreaResult(
      inServiceArea: json['in_service_area'] ?? json['inServiceArea'] ?? false,
      distance: (json['distance'] ?? 0).toDouble(),
      message: json['message'] ?? '',
    );
  }
}
