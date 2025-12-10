import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:latlong2/latlong.dart';

class NominatimService {
  static const String _baseUrl = 'https://nominatim.openstreetmap.org';
  static const String _userAgent = 'WizCarRental/1.0';

  // Search for locations
  Future<List<SearchResult>> searchLocation(String query) async {
    if (query.isEmpty) return [];

    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/search?q=$query&format=json&limit=10&addressdetails=1'),
        headers: {'User-Agent': _userAgent},
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.map((json) => SearchResult.fromJson(json)).toList();
      } else {
        throw Exception('Failed to search location');
      }
    } catch (e) {
      print('Error searching location: $e');
      return [];
    }
  }

  // Reverse geocoding (get address from coordinates)
  Future<String?> reverseGeocode(LatLng position) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/reverse?lat=${position.latitude}&lon=${position.longitude}&format=json'),
        headers: {'User-Agent': _userAgent},
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['display_name'];
      }
    } catch (e) {
      print('Error reverse geocoding: $e');
    }
    return null;
  }

  // Get place details
  Future<PlaceDetails?> getPlaceDetails(String placeId) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/details?place_id=$placeId&format=json'),
        headers: {'User-Agent': _userAgent},
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return PlaceDetails.fromJson(data);
      }
    } catch (e) {
      print('Error getting place details: $e');
    }
    return null;
  }
}

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
      placeId: json['place_id']?.toString() ?? '',
      displayName: json['display_name'] ?? '',
      position: LatLng(
        double.parse(json['lat'].toString()),
        double.parse(json['lon'].toString()),
      ),
      road: address['road'],
      suburb: address['suburb'] ?? address['neighbourhood'],
      city: address['city'] ?? address['town'] ?? address['village'],
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
      placeId: json['place_id']?.toString() ?? '',
      displayName: json['display_name'] ?? '',
      position: LatLng(
        double.parse(json['lat'].toString()),
        double.parse(json['lon'].toString()),
      ),
      address: json['address'] ?? {},
      type: json['type'] ?? 'unknown',
    );
  }
}