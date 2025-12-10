import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import 'package:latlong2/latlong.dart';

class LocationHistoryService {
  static const String _historyKey = 'location_search_history';
  static const int _maxHistoryItems = 10;

  Future<void> saveToHistory(LocationHistoryItem item) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final history = await getHistory();

      history.removeWhere((h) => 
        h.displayName == item.displayName || 
        (h.position.latitude == item.position.latitude && 
         h.position.longitude == item.position.longitude)
      );

      history.insert(0, item);

      if (history.length > _maxHistoryItems) {
        history.removeRange(_maxHistoryItems, history.length);
      }

      final jsonList = history.map((h) => h.toJson()).toList();
      await prefs.setString(_historyKey, jsonEncode(jsonList));
    } catch (e) {
      print('Error saving location history: $e');
    }
  }

  Future<List<LocationHistoryItem>> getHistory() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final historyJson = prefs.getString(_historyKey);

      if (historyJson == null || historyJson.isEmpty) {
        return [];
      }

      final List<dynamic> jsonList = jsonDecode(historyJson);
      return jsonList.map((json) => LocationHistoryItem.fromJson(json)).toList();
    } catch (e) {
      print('Error getting location history: $e');
      return [];
    }
  }

  Future<void> clearHistory() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_historyKey);
    } catch (e) {
      print('Error clearing location history: $e');
    }
  }

  Future<void> removeFromHistory(LocationHistoryItem item) async {
    try {
      final history = await getHistory();
      history.removeWhere((h) => 
        h.displayName == item.displayName && 
        h.position.latitude == item.position.latitude &&
        h.position.longitude == item.position.longitude
      );

      final prefs = await SharedPreferences.getInstance();
      final jsonList = history.map((h) => h.toJson()).toList();
      await prefs.setString(_historyKey, jsonEncode(jsonList));
    } catch (e) {
      print('Error removing from history: $e');
    }
  }
}

class LocationHistoryItem {
  final String displayName;
  final String shortName;
  final String subtitle;
  final LatLng position;
  final DateTime timestamp;

  LocationHistoryItem({
    required this.displayName,
    required this.shortName,
    required this.subtitle,
    required this.position,
    required this.timestamp,
  });

  Map<String, dynamic> toJson() {
    return {
      'displayName': displayName,
      'shortName': shortName,
      'subtitle': subtitle,
      'latitude': position.latitude,
      'longitude': position.longitude,
      'timestamp': timestamp.toIso8601String(),
    };
  }

  factory LocationHistoryItem.fromJson(Map<String, dynamic> json) {
    return LocationHistoryItem(
      displayName: json['displayName'] ?? '',
      shortName: json['shortName'] ?? '',
      subtitle: json['subtitle'] ?? '',
      position: LatLng(
        json['latitude'] ?? 0.0,
        json['longitude'] ?? 0.0,
      ),
      timestamp: DateTime.parse(json['timestamp']),
    );
  }
}