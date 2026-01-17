import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:wiz/services/local_storage_service.dart';
import 'package:wiz/services/media_api_service.dart';

class ReviewApiService {
  static const String baseUrl = 'http://10.0.2.2:3005'; // review-service
  final _localStorageService = LocalStorageService();
  final _mediaApiService = MediaApiService();

  Future<String?> _getAuthToken() async {
    try {
      final token = await _localStorageService.getToken();
      return token;
    } catch (e) {
      print('Error getting auth token: $e');
      return null;
    }
  }

  /// ✅ FIXED: Submit vehicle review with correct ownerType and type
  Future<void> submitVehicleReview({
    required String bookingId,
    required String vehicleId,
    required int rating,
    String? comment,
    List<File>? photoFiles,
  }) async {
    try {
      final token = await _getAuthToken();
      if (token == null) {
        throw Exception('Authentication required');
      }

      List<String>? photoIds;

      // ✅ FIX: Upload photos with ownerType: "REVIEW" and type: "review_photo"
      if (photoFiles != null && photoFiles.isNotEmpty) {
        print('📸 Uploading ${photoFiles.length} review photos...');

        photoIds = await _mediaApiService.uploadBatch(
          files: photoFiles,
          ownerId: bookingId, // Use bookingId as ownerId
          ownerType: 'REVIEW', // ✅ Changed from 'REQUEST' to 'REVIEW'
          type: 'review_photo', // ✅ Correct type for review photos
        );

        print('✅ Review photos uploaded: $photoIds');
      }

      final headers = {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'};

      final body = jsonEncode({
        'bookingId': bookingId,
        'vehicleId': vehicleId,
        'rating': rating,
        if (comment != null && comment.isNotEmpty) 'comment': comment,
        if (photoIds != null && photoIds.isNotEmpty) 'photos': photoIds,
      });

      print('📤 Submitting vehicle review for booking: $bookingId');

      final response = await http.post(Uri.parse('$baseUrl/reviews/vehicle'), headers: headers, body: body);

      if (response.statusCode == 201) {
        print('✅ Vehicle review submitted successfully');
      } else {
        final errorData = jsonDecode(response.body);
        throw Exception(errorData['error'] ?? 'Failed to submit vehicle review');
      }
    } catch (e) {
      print('❌ Submit vehicle review error: $e');
      rethrow;
    }
  }

  /// Submit owner review (no photos needed for owner reviews)
  Future<void> submitOwnerReview({
    required String bookingId,
    required String ownerId,
    required int rating,
    String? comment,
    int? communicationRating,
    int? reliabilityRating,
    int? carConditionRating,
  }) async {
    try {
      final token = await _getAuthToken();
      if (token == null) {
        throw Exception('Authentication required');
      }

      final headers = {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'};

      final Map<String, dynamic> aspects = {};
      if (communicationRating != null && communicationRating > 0) {
        aspects['communication'] = communicationRating;
      }
      if (reliabilityRating != null && reliabilityRating > 0) {
        aspects['reliability'] = reliabilityRating;
      }
      if (carConditionRating != null && carConditionRating > 0) {
        aspects['carCondition'] = carConditionRating;
      }

      final body = jsonEncode({
        'bookingId': bookingId,
        'ownerId': ownerId,
        'rating': rating,
        if (comment != null && comment.isNotEmpty) 'comment': comment,
        if (aspects.isNotEmpty) 'aspects': aspects,
      });

      print('📤 Submitting owner review for booking: $bookingId');

      final response = await http.post(Uri.parse('$baseUrl/reviews/owner'), headers: headers, body: body);

      if (response.statusCode == 201) {
        print('✅ Owner review submitted successfully');
      } else {
        final errorData = jsonDecode(response.body);
        throw Exception(errorData['error'] ?? 'Failed to submit owner review');
      }
    } catch (e) {
      print('❌ Submit owner review error: $e');
      rethrow;
    }
  }

  /// Get vehicle reviews
  Future<VehicleReviewsResponse> getVehicleReviews({
    required String vehicleId,
    String sortBy = 'newest',
    int? minRating,
    int page = 1,
    int limit = 10,
  }) async {
    try {
      final queryParams = {
        'sortBy': sortBy,
        'page': page.toString(),
        'limit': limit.toString(),
        if (minRating != null) 'minRating': minRating.toString(),
      };

      final uri = Uri.parse('$baseUrl/reviews/vehicle/$vehicleId').replace(queryParameters: queryParams);

      final response = await http.get(uri);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return VehicleReviewsResponse.fromJson(data);
      } else {
        throw Exception('Failed to get vehicle reviews');
      }
    } catch (e) {
      print('❌ Get vehicle reviews error: $e');
      rethrow;
    }
  }

  /// Get owner reviews
  Future<OwnerReviewsResponse> getOwnerReviews({
    required String ownerId,
    String sortBy = 'newest',
    int page = 1,
    int limit = 10,
  }) async {
    try {
      final queryParams = {'sortBy': sortBy, 'page': page.toString(), 'limit': limit.toString()};

      final uri = Uri.parse('$baseUrl/reviews/owner/$ownerId').replace(queryParameters: queryParams);

      final response = await http.get(uri);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return OwnerReviewsResponse.fromJson(data);
      } else {
        throw Exception('Failed to get owner reviews');
      }
    } catch (e) {
      print('❌ Get owner reviews error: $e');
      rethrow;
    }
  }
}

// ==================== RESPONSE MODELS ====================

class VehicleReviewsResponse {
  final List<VehicleReview> reviews;
  final ReviewSummary summary;
  final ReviewPagination pagination;

  VehicleReviewsResponse({required this.reviews, required this.summary, required this.pagination});

  factory VehicleReviewsResponse.fromJson(Map<String, dynamic> json) {
    return VehicleReviewsResponse(
      reviews: (json['reviews'] as List?)?.map((r) => VehicleReview.fromJson(r)).toList() ?? [],
      summary: ReviewSummary.fromJson(json['summary'] ?? {}),
      pagination: ReviewPagination.fromJson(json['pagination'] ?? {}),
    );
  }
}

class OwnerReviewsResponse {
  final List<OwnerReview> reviews;
  final OwnerReviewSummary summary;
  final ReviewPagination pagination;

  OwnerReviewsResponse({required this.reviews, required this.summary, required this.pagination});

  factory OwnerReviewsResponse.fromJson(Map<String, dynamic> json) {
    return OwnerReviewsResponse(
      reviews: (json['reviews'] as List?)?.map((r) => OwnerReview.fromJson(r)).toList() ?? [],
      summary: OwnerReviewSummary.fromJson(json['summary'] ?? {}),
      pagination: ReviewPagination.fromJson(json['pagination'] ?? {}),
    );
  }
}

class VehicleReview {
  final String id;
  final ReviewUser user;
  final int rating;
  final String? comment;
  final List<String> photos;
  final DateTime createdAt;
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
      photos: json['photos'] != null ? List<String>.from(json['photos']) : [],
      createdAt: DateTime.parse(json['createdAt']),
      helpful: json['helpful'] ?? 0,
      ownerResponse: json['ownerResponse'],
    );
  }
}

class OwnerReview {
  final String id;
  final ReviewUser user;
  final int rating;
  final String? comment;
  final AspectRatings? aspects;
  final DateTime createdAt;

  OwnerReview({
    required this.id,
    required this.user,
    required this.rating,
    this.comment,
    this.aspects,
    required this.createdAt,
  });

  factory OwnerReview.fromJson(Map<String, dynamic> json) {
    return OwnerReview(
      id: json['id'] ?? '',
      user: ReviewUser.fromJson(json['user'] ?? {}),
      rating: json['rating'] ?? 0,
      comment: json['comment'],
      aspects: json['aspects'] != null ? AspectRatings.fromJson(json['aspects']) : null,
      createdAt: DateTime.parse(json['createdAt']),
    );
  }
}

class ReviewUser {
  final String id;
  final String name;
  final String? avatar;

  ReviewUser({required this.id, required this.name, this.avatar});

  factory ReviewUser.fromJson(Map<String, dynamic> json) {
    return ReviewUser(id: json['id'] ?? '', name: json['name'] ?? 'Unknown User', avatar: json['avatar']);
  }
}

class AspectRatings {
  final int communication;
  final int reliability;
  final int carCondition;

  AspectRatings({required this.communication, required this.reliability, required this.carCondition});

  factory AspectRatings.fromJson(Map<String, dynamic> json) {
    return AspectRatings(
      communication: json['communication'] ?? 0,
      reliability: json['reliability'] ?? 0,
      carCondition: json['carCondition'] ?? 0,
    );
  }
}

class ReviewSummary {
  final double averageRating;
  final int totalReviews;
  final Map<int, int> ratingDistribution;

  ReviewSummary({required this.averageRating, required this.totalReviews, required this.ratingDistribution});

  factory ReviewSummary.fromJson(Map<String, dynamic> json) {
    final distribution = json['ratingDistribution'] ?? {};
    return ReviewSummary(
      averageRating: (json['averageRating'] ?? 0).toDouble(),
      totalReviews: json['totalReviews'] ?? 0,
      ratingDistribution: {
        5: distribution['5'] ?? 0,
        4: distribution['4'] ?? 0,
        3: distribution['3'] ?? 0,
        2: distribution['2'] ?? 0,
        1: distribution['1'] ?? 0,
      },
    );
  }
}

class OwnerReviewSummary {
  final double averageRating;
  final int totalReviews;

  OwnerReviewSummary({required this.averageRating, required this.totalReviews});

  factory OwnerReviewSummary.fromJson(Map<String, dynamic> json) {
    return OwnerReviewSummary(
      averageRating: (json['averageRating'] ?? 0).toDouble(),
      totalReviews: json['totalReviews'] ?? 0,
    );
  }
}

class ReviewPagination {
  final int total;
  final int page;
  final int limit;

  ReviewPagination({required this.total, required this.page, required this.limit});

  factory ReviewPagination.fromJson(Map<String, dynamic> json) {
    return ReviewPagination(total: json['total'] ?? 0, page: json['page'] ?? 1, limit: json['limit'] ?? 10);
  }
}
