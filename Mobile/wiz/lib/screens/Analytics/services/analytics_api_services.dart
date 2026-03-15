// lib/screens/Analytics/services/analytics_api_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:wiz/services/local_storage_service.dart';

class AnalyticsApiService {
  static const String baseUrl = 'http://206.189.147.242';

  final _localStorageService = LocalStorageService();

  Future<String?> _getAuthToken() async {
    try {
      final token = await _localStorageService.getToken();
      return token;
    } catch (e) {
      print('❌ Error getting auth token: $e');
      return null;
    }
  }

  Future<Map<String, dynamic>> getOwnerDashboard({
    String timeRange = '30d',
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    try {
      final token = await _getAuthToken();
      if (token == null) {
        return {'success': false, 'error': 'Authentication required'};
      }

      final queryParams = <String, String>{'timeRange': timeRange};

      if (timeRange == 'custom' && startDate != null && endDate != null) {
        queryParams['startDate'] = startDate.toIso8601String();
        queryParams['endDate'] = endDate.toIso8601String();
      }

      final uri = Uri.parse('$baseUrl/api/analytics/owner/dashboard').replace(queryParameters: queryParams);

      print('📊 Fetching analytics: $uri');

      final response = await http.get(
        uri,
        headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'},
      );

      print('📥 Analytics response: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        print('✅ Analytics data loaded successfully');
        return {'success': true, 'data': data['data']};
      } else if (response.statusCode == 401) {
        return {'success': false, 'error': 'Unauthorized - Please login again'};
      } else if (response.statusCode == 403) {
        return {'success': false, 'error': 'Owner role required'};
      } else {
        final errorData = jsonDecode(response.body);
        return {'success': false, 'error': errorData['error'] ?? 'Failed to load analytics'};
      }
    } catch (e) {
      print('❌ Analytics API error: $e');
      return {'success': false, 'error': 'Network error: ${e.toString()}'};
    }
  }

  Future<Map<String, dynamic>> getCustomerAnalytics({String timeRange = '30d'}) async {
    try {
      final token = await _getAuthToken();
      if (token == null) {
        return {'success': false, 'error': 'Authentication required'};
      }

      final uri = Uri.parse(
        '$baseUrl/api/analytics/customer/summary',
      ).replace(queryParameters: {'timeRange': timeRange});

      final response = await http.get(
        uri,
        headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'},
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {'success': true, 'data': data['data']};
      } else {
        return {'success': false, 'error': 'Failed to load customer analytics'};
      }
    } catch (e) {
      print('❌ Customer analytics error: $e');
      return {'success': false, 'error': e.toString()};
    }
  }
}

// ==================== MODELS ====================

class AnalyticsDashboard {
  final VehicleAnalytics vehicles;
  final BookingAnalytics bookings;
  final RevenueAnalytics revenue;
  final ReviewAnalytics reviews;
  final String timeRange;

  AnalyticsDashboard({
    required this.vehicles,
    required this.bookings,
    required this.revenue,
    required this.reviews,
    required this.timeRange,
  });

  factory AnalyticsDashboard.fromJson(Map<String, dynamic> json) {
    return AnalyticsDashboard(
      vehicles: VehicleAnalytics.fromJson(json['vehicles'] ?? {}),
      bookings: BookingAnalytics.fromJson(json['bookings'] ?? {}),
      revenue: RevenueAnalytics.fromJson(json['revenue'] ?? {}),
      reviews: ReviewAnalytics.fromJson(json['reviews'] ?? {}),
      timeRange: json['timeRange'] ?? '30d',
    );
  }
}

class VehicleAnalytics {
  final int totalVehicles;
  final int activeVehicles;
  final int rentedVehicles;
  final int availableVehicles;
  final double averageRating;
  final int totalRentals;
  final double utilizationRate;

  VehicleAnalytics({
    required this.totalVehicles,
    required this.activeVehicles,
    required this.rentedVehicles,
    required this.availableVehicles,
    required this.averageRating,
    required this.totalRentals,
    required this.utilizationRate,
  });

  factory VehicleAnalytics.fromJson(Map<String, dynamic> json) {
    return VehicleAnalytics(
      totalVehicles: (json['totalVehicles'] as num?)?.toInt() ?? 0,
      activeVehicles: (json['activeVehicles'] as num?)?.toInt() ?? 0,
      rentedVehicles: (json['rentedVehicles'] as num?)?.toInt() ?? 0,
      availableVehicles: (json['availableVehicles'] as num?)?.toInt() ?? 0,
      averageRating: (json['averageRating'] as num?)?.toDouble() ?? 0.0,
      totalRentals: (json['totalRentals'] as num?)?.toInt() ?? 0,
      utilizationRate: (json['utilizationRate'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

class BookingAnalytics {
  final int totalBookings;
  final int activeBookings;
  final int completedBookings;
  final int cancelledBookings;
  final double acceptanceRate;
  final double averageDuration;
  final List<TrendData> trend;

  BookingAnalytics({
    required this.totalBookings,
    required this.activeBookings,
    required this.completedBookings,
    required this.cancelledBookings,
    required this.acceptanceRate,
    required this.averageDuration,
    required this.trend,
  });

  factory BookingAnalytics.fromJson(Map<String, dynamic> json) {
    return BookingAnalytics(
      totalBookings: (json['totalBookings'] as num?)?.toInt() ?? 0,
      activeBookings: (json['activeBookings'] as num?)?.toInt() ?? 0,
      completedBookings: (json['completedBookings'] as num?)?.toInt() ?? 0,
      cancelledBookings: (json['cancelledBookings'] as num?)?.toInt() ?? 0,
      acceptanceRate: (json['acceptanceRate'] as num?)?.toDouble() ?? 0.0,
      averageDuration: (json['averageDuration'] as num?)?.toDouble() ?? 0.0,
      trend: (json['trend'] as List<dynamic>?)?.map((t) => TrendData.fromJson(t)).toList() ?? [],
    );
  }
}

class RevenueAnalytics {
  final double totalRevenue;
  final double pendingRevenue;
  final double completedRevenue;
  final double refundedAmount;
  final double averageBookingValue;
  final double growth;
  final List<TrendData> trend;

  RevenueAnalytics({
    required this.totalRevenue,
    required this.pendingRevenue,
    required this.completedRevenue,
    required this.refundedAmount,
    required this.averageBookingValue,
    required this.growth,
    required this.trend,
  });

  factory RevenueAnalytics.fromJson(Map<String, dynamic> json) {
    return RevenueAnalytics(
      totalRevenue: (json['totalRevenue'] as num?)?.toDouble() ?? 0.0,
      pendingRevenue: (json['pendingRevenue'] as num?)?.toDouble() ?? 0.0,
      completedRevenue: (json['completedRevenue'] as num?)?.toDouble() ?? 0.0,
      refundedAmount: (json['refundedAmount'] as num?)?.toDouble() ?? 0.0,
      averageBookingValue: (json['averageBookingValue'] as num?)?.toDouble() ?? 0.0,
      growth: (json['growth'] as num?)?.toDouble() ?? 0.0,
      trend: (json['trend'] as List<dynamic>?)?.map((t) => TrendData.fromJson(t)).toList() ?? [],
    );
  }
}

class ReviewAnalytics {
  final double averageRating;
  final int totalReviews;
  final int vehicleReviews;
  final int ownerReviews;
  final Map<String, int> ratingDistribution;

  ReviewAnalytics({
    required this.averageRating,
    required this.totalReviews,
    required this.vehicleReviews,
    required this.ownerReviews,
    required this.ratingDistribution,
  });

  factory ReviewAnalytics.fromJson(Map<String, dynamic> json) {
    final distribution = json['ratingDistribution'] as Map<String, dynamic>?;
    final ratingMap = <String, int>{};

    if (distribution != null) {
      distribution.forEach((key, value) {
        // Safe cast: API may return double here too
        ratingMap[key] = (value as num?)?.toInt() ?? 0;
      });
    }

    return ReviewAnalytics(
      averageRating: (json['averageRating'] as num?)?.toDouble() ?? 0.0,
      totalReviews: (json['totalReviews'] as num?)?.toInt() ?? 0,
      vehicleReviews: (json['vehicleReviews'] as num?)?.toInt() ?? 0,
      ownerReviews: (json['ownerReviews'] as num?)?.toInt() ?? 0,
      ratingDistribution: ratingMap,
    );
  }
}

class TrendData {
  final String period;
  final double value; // changed to double to safely handle both int and double

  TrendData({required this.period, required this.value});

  factory TrendData.fromJson(Map<String, dynamic> json) {
    final raw = json['value'] ?? json['total'] ?? json['count'] ?? json['revenue'] ?? 0;
    return TrendData(period: json['period'] ?? json['date'] ?? '', value: (raw as num).toDouble());
  }
}
