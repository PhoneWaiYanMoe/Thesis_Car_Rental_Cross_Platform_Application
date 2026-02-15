// lib/screens/Cars/services/review_api_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class ReviewApiService {
  // static const String baseUrl = 'http://10.0.2.2:3005'; // review-service
  static const String baseUrl = 'http://localhost:3005';
  /// Get vehicle reviews
  Future<VehicleReviewsResponse> getVehicleReviews({
    required String vehicleId,
    String sortBy = 'newest',
    int? minRating,
    int page = 1,
    int limit = 10,
  }) async {
    try {
      final queryParams = <String, String>{
        'sortBy': sortBy,
        'page': page.toString(),
        'limit': limit.toString(),
      };

      if (minRating != null) {
        queryParams['minRating'] = minRating.toString();
      }

      final uri = Uri.parse('$baseUrl/reviews/vehicle/$vehicleId').replace(queryParameters: queryParams);

      print('🔍 Fetching reviews for vehicle: $vehicleId');

      final response = await http.get(uri);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        print('✅ Loaded ${data['reviews'].length} reviews');
        return VehicleReviewsResponse.fromJson(data);
      } else if (response.statusCode == 404) {
        // No reviews found
        return VehicleReviewsResponse(
          reviews: [],
          summary: ReviewSummary(
            averageRating: 0.0,
            totalReviews: 0,
            ratingDistribution: RatingDistribution(fiveStar: 0, fourStar: 0, threeStar: 0, twoStar: 0, oneStar: 0),
          ),
          pagination: Pagination(total: 0, page: page, limit: limit),
        );
      } else {
        print('❌ Get reviews failed: ${response.statusCode}');
        throw Exception('Failed to get reviews: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Get reviews error: $e');
      rethrow;
    }
  }
}

// ==================== RESPONSE MODELS ====================

class VehicleReviewsResponse {
  final List<VehicleReview> reviews;
  final ReviewSummary summary;
  final Pagination pagination;

  VehicleReviewsResponse({
    required this.reviews,
    required this.summary,
    required this.pagination,
  });

  factory VehicleReviewsResponse.fromJson(Map<String, dynamic> json) {
    return VehicleReviewsResponse(
      reviews: (json['reviews'] as List?)
              ?.map((r) => VehicleReview.fromJson(r))
              .toList() ??
          [],
      summary: ReviewSummary.fromJson(json['summary'] ?? {}),
      pagination: Pagination.fromJson(json['pagination'] ?? {}),
    );
  }
}

class VehicleReview {
  final String id;
  final ReviewUser user;
  final int rating;
  final String? comment;
  final List<String> photos;
  final String createdAt;
  final int helpful;
  final String? ownerResponse;

  VehicleReview({
    required this.id,
    required this.user,
    required this.rating,
    this.comment,
    required this.photos,
    required this.createdAt,
    required this.helpful,
    this.ownerResponse,
  });

  factory VehicleReview.fromJson(Map<String, dynamic> json) {
    return VehicleReview(
      id: json['id'] ?? '',
      user: ReviewUser.fromJson(json['user'] ?? {}),
      rating: json['rating'] ?? 0,
      comment: json['comment'],
      photos: (json['photos'] as List?)?.cast<String>() ?? [],
      createdAt: json['createdAt'] ?? '',
      helpful: json['helpful'] ?? 0,
      ownerResponse: json['ownerResponse'],
    );
  }
}

class ReviewUser {
  final String id;
  final String name;
  final String? avatar;

  ReviewUser({
    required this.id,
    required this.name,
    this.avatar,
  });

  factory ReviewUser.fromJson(Map<String, dynamic> json) {
    return ReviewUser(
      id: json['id'] ?? '',
      name: json['name'] ?? 'Anonymous',
      avatar: json['avatar'],
    );
  }
}

class ReviewSummary {
  final double averageRating;
  final int totalReviews;
  final RatingDistribution ratingDistribution;

  ReviewSummary({
    required this.averageRating,
    required this.totalReviews,
    required this.ratingDistribution,
  });

  factory ReviewSummary.fromJson(Map<String, dynamic> json) {
    return ReviewSummary(
      averageRating: (json['averageRating'] ?? 0.0).toDouble(),
      totalReviews: json['totalReviews'] ?? 0,
      ratingDistribution: RatingDistribution.fromJson(json['ratingDistribution'] ?? {}),
    );
  }
}

class RatingDistribution {
  final int fiveStar;
  final int fourStar;
  final int threeStar;
  final int twoStar;
  final int oneStar;

  RatingDistribution({
    required this.fiveStar,
    required this.fourStar,
    required this.threeStar,
    required this.twoStar,
    required this.oneStar,
  });

  factory RatingDistribution.fromJson(Map<String, dynamic> json) {
    return RatingDistribution(
      fiveStar: json['5'] ?? json['fiveStar'] ?? 0,
      fourStar: json['4'] ?? json['fourStar'] ?? 0,
      threeStar: json['3'] ?? json['threeStar'] ?? 0,
      twoStar: json['2'] ?? json['twoStar'] ?? 0,
      oneStar: json['1'] ?? json['oneStar'] ?? 0,
    );
  }
}

class Pagination {
  final int total;
  final int page;
  final int limit;

  Pagination({
    required this.total,
    required this.page,
    required this.limit,
  });

  factory Pagination.fromJson(Map<String, dynamic> json) {
    return Pagination(
      total: json['total'] ?? 0,
      page: json['page'] ?? 1,
      limit: json['limit'] ?? 10,
    );
  }

  int get totalPages => (total / limit).ceil();
  bool get hasNextPage => page < totalPages;
  bool get hasPreviousPage => page > 1;
}

