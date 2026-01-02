// lib/screens/Booking/services/booking_api_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:wiz/services/local_storage_service.dart';

class BookingApiService {
  static const String baseUrl = 'http://10.0.2.2:3004'; // booking-service
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

  /// Create a new booking
  Future<CreateBookingResponse> createBooking({
    required String vehicleId,
    required DateTime startDate,
    required DateTime endDate,
    required Map<String, dynamic> pickupLocation,
    required Map<String, dynamic> dropoffLocation,
    required bool driverRequired,
    required int insuranceCoverage,
    required String paymentMethodId,
    String? additionalNotes,
  }) async {
    try {
      final token = await _getAuthToken();
      if (token == null) {
        throw Exception('Authentication required');
      }

      final headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      };

      final body = jsonEncode({
        'vehicleId': vehicleId,
        'startDate': startDate.toIso8601String(),
        'endDate': endDate.toIso8601String(),
        'pickupLocation': pickupLocation,
        'dropoffLocation': dropoffLocation,
        'driverRequired': driverRequired,
        'insuranceCoverage': insuranceCoverage,
        'paymentMethodId': paymentMethodId,
        if (additionalNotes != null) 'additionalNotes': additionalNotes,
      });

      print('📝 Creating booking for vehicle: $vehicleId');

      final response = await http.post(
        Uri.parse('$baseUrl/bookings'),
        headers: headers,
        body: body,
      );

      if (response.statusCode == 201) {
        final data = jsonDecode(response.body);
        print('✅ Booking created successfully: ${data['booking']['id']}');
        return CreateBookingResponse.fromJson(data);
      } else {
        final errorData = jsonDecode(response.body);
        print('❌ Create booking failed: ${response.statusCode} - ${errorData['error']}');
        throw Exception(errorData['error'] ?? 'Failed to create booking');
      }
    } catch (e) {
      print('❌ Create booking error: $e');
      rethrow;
    }
  }

  /// Mock photo upload - returns mock URLs
  /// TODO: Replace with actual media service integration
  Future<List<String>> mockUploadPhotos(List<String> photoPaths) async {
    // Simulate upload delay
    await Future.delayed(const Duration(seconds: 1));

    // Return mock URLs
    return photoPaths.map((path) => 'https://mock-cdn.com/photos/${DateTime.now().millisecondsSinceEpoch}_${path.split('/').last}').toList();
  }

  /// Confirm car pickup (with photos)
  Future<void> confirmPickup({
    required String bookingId,
    required List<String> pickupPhotos,
    required int odometerReading,
    String? notes,
  }) async {
    try {
      final token = await _getAuthToken();
      if (token == null) {
        throw Exception('Authentication required');
      }

      // Mock upload photos for now
      final uploadedPhotos = await mockUploadPhotos(pickupPhotos);

      final headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      };

      final body = jsonEncode({
        'pickupPhotos': uploadedPhotos,
        'odometerReading': odometerReading,
        if (notes != null) 'notes': notes,
      });

      print('📸 Confirming pickup for booking: $bookingId');

      final response = await http.post(
        Uri.parse('$baseUrl/bookings/$bookingId/confirm-pickup'),
        headers: headers,
        body: body,
      );

      if (response.statusCode == 200) {
        print('✅ Pickup confirmed successfully');
      } else {
        final errorData = jsonDecode(response.body);
        print('❌ Confirm pickup failed: ${response.statusCode} - ${errorData['error']}');
        throw Exception(errorData['error'] ?? 'Failed to confirm pickup');
      }
    } catch (e) {
      print('❌ Confirm pickup error: $e');
      rethrow;
    }
  }

  /// Confirm car return (with photos)
  Future<void> confirmReturn({
    required String bookingId,
    required List<String> returnPhotos,
    required int odometerReading,
    String? notes,
  }) async {
    try {
      final token = await _getAuthToken();
      if (token == null) {
        throw Exception('Authentication required');
      }

      // Mock upload photos for now
      final uploadedPhotos = await mockUploadPhotos(returnPhotos);

      final headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      };

      final body = jsonEncode({
        'returnPhotos': uploadedPhotos,
        'odometerReading': odometerReading,
        if (notes != null) 'notes': notes,
      });

      print('📸 Confirming return for booking: $bookingId');

      final response = await http.post(
        Uri.parse('$baseUrl/bookings/$bookingId/confirm-return'),
        headers: headers,
        body: body,
      );

      if (response.statusCode == 200) {
        print('✅ Return confirmed successfully');
      } else {
        final errorData = jsonDecode(response.body);
        print('❌ Confirm return failed: ${response.statusCode} - ${errorData['error']}');
        throw Exception(errorData['error'] ?? 'Failed to confirm return');
      }
    } catch (e) {
      print('❌ Confirm return error: $e');
      rethrow;
    }
  }

  /// Get booking details
  Future<BookingDetails> getBookingDetails(String bookingId) async {
    try {
      final token = await _getAuthToken();
      if (token == null) {
        throw Exception('Authentication required');
      }

      final headers = {
        'Authorization': 'Bearer $token',
      };

      final response = await http.get(
        Uri.parse('$baseUrl/bookings/$bookingId'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return BookingDetails.fromJson(data['booking']);
      } else {
        throw Exception('Failed to get booking details: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Get booking details error: $e');
      rethrow;
    }
  }

  /// Get my bookings
  Future<MyBookingsResponse> getMyBookings({
    String? status,
    int page = 1,
    int limit = 10,
  }) async {
    try {
      final token = await _getAuthToken();
      if (token == null) {
        throw Exception('Authentication required');
      }

      final queryParams = <String, String>{
        'page': page.toString(),
        'limit': limit.toString(),
      };

      if (status != null && status != 'all') {
        queryParams['status'] = status;
      }

      final headers = {
        'Authorization': 'Bearer $token',
      };

      final response = await http.get(
        Uri.parse('$baseUrl/bookings/my-bookings').replace(queryParameters: queryParams),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return MyBookingsResponse.fromJson(data);
      } else {
        throw Exception('Failed to get bookings: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Get my bookings error: $e');
      rethrow;
    }
  }
}

// ==================== RESPONSE MODELS ====================

class CreateBookingResponse {
  final BookingDetails booking;
  final String message;

  CreateBookingResponse({
    required this.booking,
    required this.message,
  });

  factory CreateBookingResponse.fromJson(Map<String, dynamic> json) {
    return CreateBookingResponse(
      booking: BookingDetails.fromJson(json['booking']),
      message: json['message'] ?? 'Booking created successfully',
    );
  }
}

class BookingDetails {
  final String id;
  final String vehicleId;
  final String customerId;
  final String ownerId;
  final String status;
  final DateTime startDate;
  final DateTime endDate;
  final Map<String, dynamic> pickupLocation;
  final Map<String, dynamic> dropoffLocation;
  final bool driverRequired;
  final int insuranceCoverage;
  final String? paymentMethodId;
  final String? additionalNotes;
  final DateTime createdAt;

  BookingDetails({
    required this.id,
    required this.vehicleId,
    required this.customerId,
    required this.ownerId,
    required this.status,
    required this.startDate,
    required this.endDate,
    required this.pickupLocation,
    required this.dropoffLocation,
    required this.driverRequired,
    required this.insuranceCoverage,
    this.paymentMethodId,
    this.additionalNotes,
    required this.createdAt,
  });

  factory BookingDetails.fromJson(Map<String, dynamic> json) {
    return BookingDetails(
      id: json['id'] ?? '',
      vehicleId: json['vehicleId'] ?? '',
      customerId: json['customerId'] ?? '',
      ownerId: json['ownerId'] ?? '',
      status: json['status'] ?? 'pending',
      startDate: DateTime.parse(json['startDate']),
      endDate: DateTime.parse(json['endDate']),
      pickupLocation: json['pickupLocation'] ?? {},
      dropoffLocation: json['dropoffLocation'] ?? {},
      driverRequired: json['driverRequired'] ?? false,
      insuranceCoverage: json['insuranceCoverage'] ?? 0,
      paymentMethodId: json['paymentMethodId'],
      additionalNotes: json['additionalNotes'],
      createdAt: DateTime.parse(json['createdAt']),
    );
  }
}

class MyBookingsResponse {
  final List<BookingDetails> bookings;
  final Pagination pagination;

  MyBookingsResponse({
    required this.bookings,
    required this.pagination,
  });

  factory MyBookingsResponse.fromJson(Map<String, dynamic> json) {
    return MyBookingsResponse(
      bookings: (json['bookings'] as List?)
              ?.map((b) => BookingDetails.fromJson(b))
              .toList() ??
          [],
      pagination: Pagination.fromJson(json['pagination'] ?? {}),
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
}

