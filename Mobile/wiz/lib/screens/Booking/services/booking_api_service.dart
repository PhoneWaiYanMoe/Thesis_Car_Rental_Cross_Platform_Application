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

  // ==================== CUSTOMER APIS ====================

  /// Check verification status
  Future<VerificationStatus> checkVerificationStatus() async {
    try {
      final token = await _getAuthToken();
      if (token == null) {
        throw Exception('Authentication required');
      }

      final headers = {'Authorization': 'Bearer $token'};

      final response = await http.get(Uri.parse('$baseUrl/bookings/verification/me'), headers: headers);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return VerificationStatus.fromJson(data);
      } else {
        throw Exception('Failed to check verification status');
      }
    } catch (e) {
      print('❌ Check verification error: $e');
      rethrow;
    }
  }

  /// Upload verification (license + selfies) - MOCK
  Future<void> uploadVerification({
    required String fullName,
    required String licenseNumber,
    required String expiryDate,
    required String licenseFrontPhoto, // Mock path
    required String licenseBackPhoto, // Mock path
    required String frontSelfie, // Mock path
    required String leftSelfie, // Mock path
    required String rightSelfie, // Mock path
  }) async {
    try {
      final token = await _getAuthToken();
      if (token == null) {
        throw Exception('Authentication required');
      }

      final headers = {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'};

      // Mock: In real implementation, upload to media service first
      final body = jsonEncode({
        'fullName': fullName,
        'licenseNumber': licenseNumber,
        'expiryDate': expiryDate,
        'licenseFrontPhoto': 'https://mock-cdn.com/licenses/$licenseFrontPhoto',
        'licenseBackPhoto': 'https://mock-cdn.com/licenses/$licenseBackPhoto',
        'frontSelfie': 'https://mock-cdn.com/selfies/$frontSelfie',
        'leftSelfie': 'https://mock-cdn.com/selfies/$leftSelfie',
        'rightSelfie': 'https://mock-cdn.com/selfies/$rightSelfie',
      });

      print('📤 Uploading verification...');

      final response = await http.post(Uri.parse('$baseUrl/bookings/verification'), headers: headers, body: body);

      if (response.statusCode == 200) {
        print('✅ Verification uploaded successfully');
      } else {
        final errorData = jsonDecode(response.body);
        throw Exception(errorData['error'] ?? 'Failed to upload verification');
      }
    } catch (e) {
      print('❌ Upload verification error: $e');
      rethrow;
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
    String? provider,
    String? additionalNotes,
  }) async {
    try {
      final token = await _getAuthToken();
      if (token == null) {
        throw Exception('Authentication required');
      }

      final headers = {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'};

      final body = jsonEncode({
        'vehicleId': vehicleId,
        'startDate': startDate.toIso8601String(),
        'endDate': endDate.toIso8601String(),
        'pickupLocation': pickupLocation,
        'dropoffLocation': dropoffLocation,
        'driverRequired': driverRequired,
        'insuranceCoverage': insuranceCoverage,
        'paymentMethodId': paymentMethodId,
        if (provider != null) 'provider': provider,
        if (additionalNotes != null) 'additionalNotes': additionalNotes,
      });

      print('📝 Creating booking for vehicle: $vehicleId');
      print('📦 Request body: $body');

      final response = await http.post(Uri.parse('$baseUrl/bookings'), headers: headers, body: body);

      if (response.statusCode == 201) {
        final data = jsonDecode(response.body);
        print('✅ Booking created successfully: ${data['booking']['id']}');
        return CreateBookingResponse.fromJson(data);
      } else {
        final responseBody = response.body;
        print('❌ Create booking failed: ${response.statusCode}');
        print('❌ Response body: $responseBody');
        
        try {
          final errorData = jsonDecode(responseBody);
          final errorMessage = errorData['error'] ?? errorData['message'] ?? 'Failed to create booking';
          
          // Check for validation errors
          if (errorData['errors'] != null) {
            final validationErrors = (errorData['errors'] as List)
                .map((e) => e['msg'] ?? e['message'] ?? e.toString())
                .join(', ');
            throw Exception('Validation error: $validationErrors');
          }
          
          throw Exception(errorMessage);
        } catch (e) {
          if (e is Exception) rethrow;
          throw Exception('Failed to create booking: ${response.statusCode}');
        }
      }
    } catch (e) {
      print('❌ Create booking error: $e');
      rethrow;
    }
  }

  /// Get my bookings
  Future<MyBookingsResponse> getMyBookings({String? status, int page = 1, int limit = 10}) async {
    try {
      final token = await _getAuthToken();
      if (token == null) {
        throw Exception('Authentication required');
      }

      final queryParams = <String, String>{'page': page.toString(), 'limit': limit.toString()};

      if (status != null && status != 'all') {
        queryParams['status'] = status;
      }

      final headers = {'Authorization': 'Bearer $token'};

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

  /// Get booking details
  Future<BookingDetailsResponse> getBookingDetails(String bookingId) async {
    try {
      final token = await _getAuthToken();
      if (token == null) {
        throw Exception('Authentication required');
      }

      final headers = {'Authorization': 'Bearer $token'};

      final response = await http.get(Uri.parse('$baseUrl/bookings/$bookingId'), headers: headers);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return BookingDetailsResponse.fromJson(data['booking']);
      } else {
        throw Exception('Failed to get booking details: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Get booking details error: $e');
      rethrow;
    }
  }

  /// Sign contract
  Future<void> signContract({
    required String bookingId,
    required String signature, // Base64 signature
    required bool agreedToTerms,
  }) async {
    try {
      final token = await _getAuthToken();
      if (token == null) {
        throw Exception('Authentication required');
      }

      final headers = {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'};

      final body = jsonEncode({'signature': signature, 'agreedToTerms': agreedToTerms});

      final response = await http.post(
        Uri.parse('$baseUrl/bookings/$bookingId/sign-contract'),
        headers: headers,
        body: body,
      );

      if (response.statusCode == 200) {
        print('✅ Contract signed successfully');
      } else {
        final errorData = jsonDecode(response.body);
        throw Exception(errorData['error'] ?? 'Failed to sign contract');
      }
    } catch (e) {
      print('❌ Sign contract error: $e');
      rethrow;
    }
  }

  /// Confirm car pickup (with photos) - MOCK
  Future<void> confirmPickup({
    required String bookingId,
    required List<String> pickupPhotos, // Mock paths
    required int odometerReading,
    String? notes,
  }) async {
    try {
      final token = await _getAuthToken();
      if (token == null) {
        throw Exception('Authentication required');
      }

      // Mock: Convert local paths to mock URLs
      final mockPhotoUrls = pickupPhotos
          .map((path) => 'https://mock-cdn.com/pickup/${DateTime.now().millisecondsSinceEpoch}_${path.split('/').last}')
          .toList();

      final headers = {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'};

      final body = jsonEncode({
        'pickupPhotos': mockPhotoUrls,
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
        throw Exception(errorData['error'] ?? 'Failed to confirm pickup');
      }
    } catch (e) {
      print('❌ Confirm pickup error: $e');
      rethrow;
    }
  }

  /// Confirm car return (with photos) - MOCK
  Future<void> confirmReturn({
    required String bookingId,
    required List<String> returnPhotos, // Mock paths
    required int odometerReading,
    String? notes,
  }) async {
    try {
      final token = await _getAuthToken();
      if (token == null) {
        throw Exception('Authentication required');
      }

      // Mock: Convert local paths to mock URLs
      final mockPhotoUrls = returnPhotos
          .map((path) => 'https://mock-cdn.com/return/${DateTime.now().millisecondsSinceEpoch}_${path.split('/').last}')
          .toList();

      final headers = {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'};

      final body = jsonEncode({
        'returnPhotos': mockPhotoUrls,
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
        throw Exception(errorData['error'] ?? 'Failed to confirm return');
      }
    } catch (e) {
      print('❌ Confirm return error: $e');
      rethrow;
    }
  }

  /// Cancel booking
  Future<void> cancelBooking({required String bookingId, required String reason}) async {
    try {
      final token = await _getAuthToken();
      if (token == null) {
        throw Exception('Authentication required');
      }

      final headers = {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'};

      final body = jsonEncode({'reason': reason});

      final response = await http.post(Uri.parse('$baseUrl/bookings/$bookingId/cancel'), headers: headers, body: body);

      if (response.statusCode == 200) {
        print('✅ Booking cancelled successfully');
      } else {
        final errorData = jsonDecode(response.body);
        throw Exception(errorData['error'] ?? 'Failed to cancel booking');
      }
    } catch (e) {
      print('❌ Cancel booking error: $e');
      rethrow;
    }
  }

  // ==================== OWNER APIS ====================

  /// Get owner's booking requests
  Future<OwnerBookingsResponse> getOwnerBookings({
    String? status,
    String? vehicleId,
    int page = 1,
    int limit = 10,
  }) async {
    try {
      final token = await _getAuthToken();
      if (token == null) {
        throw Exception('Authentication required');
      }

      final queryParams = <String, String>{'page': page.toString(), 'limit': limit.toString()};

      if (status != null && status != 'all') {
        queryParams['status'] = status;
      }

      if (vehicleId != null) {
        queryParams['vehicleId'] = vehicleId;
      }

      final headers = {'Authorization': 'Bearer $token'};

      final response = await http.get(
        Uri.parse('$baseUrl/bookings/owner/bookings').replace(queryParameters: queryParams),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return OwnerBookingsResponse.fromJson(data);
      } else {
        final errorData = jsonDecode(response.body);
        throw Exception(errorData['error'] ?? 'Failed to get owner bookings');
      }
    } catch (e) {
      print('❌ Get owner bookings error: $e');
      rethrow;
    }
  }

  /// Accept booking request
  Future<void> acceptBooking(String bookingId) async {
    try {
      final token = await _getAuthToken();
      if (token == null) {
        throw Exception('Authentication required');
      }

      final headers = {'Authorization': 'Bearer $token'};

      print('✅ Accepting booking: $bookingId');

      final response = await http.post(Uri.parse('$baseUrl/bookings/owner/$bookingId/accept'), headers: headers);

      if (response.statusCode == 200) {
        print('✅ Booking accepted successfully');
      } else {
        final errorData = jsonDecode(response.body);
        throw Exception(errorData['error'] ?? 'Failed to accept booking');
      }
    } catch (e) {
      print('❌ Accept booking error: $e');
      rethrow;
    }
  }

  /// Reject booking request
  Future<void> rejectBooking({required String bookingId, required String reason, required int refundAmount}) async {
    try {
      final token = await _getAuthToken();
      if (token == null) {
        throw Exception('Authentication required');
      }

      final headers = {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'};

      final body = jsonEncode({'reason': reason, 'refundAmount': refundAmount});

      print('❌ Rejecting booking: $bookingId');

      final response = await http.post(
        Uri.parse('$baseUrl/bookings/owner/$bookingId/reject'),
        headers: headers,
        body: body,
      );

      if (response.statusCode == 200) {
        print('✅ Booking rejected successfully');
      } else {
        final errorData = jsonDecode(response.body);
        throw Exception(errorData['error'] ?? 'Failed to reject booking');
      }
    } catch (e) {
      print('❌ Reject booking error: $e');
      rethrow;
    }
  }

  /// Owner confirms vehicle return - MOCK photos
  Future<void> ownerConfirmReturn({
    required String bookingId,
    required List<String> conditionPhotos, // Mock paths
    required String conditionNotes,
    required bool damagesReported,
    required int odometerReading,
    required String action, // 'complete' or 'dispute'
  }) async {
    try {
      final token = await _getAuthToken();
      if (token == null) {
        throw Exception('Authentication required');
      }

      // Mock: Convert local paths to mock URLs
      final mockPhotoUrls = conditionPhotos
          .map(
            (path) =>
                'https://mock-cdn.com/owner-return/${DateTime.now().millisecondsSinceEpoch}_${path.split('/').last}',
          )
          .toList();

      final headers = {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'};

      final body = jsonEncode({
        'conditionPhotos': mockPhotoUrls,
        'conditionNotes': conditionNotes,
        'damagesReported': damagesReported,
        'odometerReading': odometerReading,
        'action': action,
      });

      print('📸 Owner confirming return for booking: $bookingId with action: $action');

      final response = await http.post(
        Uri.parse('$baseUrl/bookings/owner/$bookingId/confirm-return'),
        headers: headers,
        body: body,
      );

      if (response.statusCode == 200) {
        print('✅ Return confirmed by owner successfully');
      } else {
        final errorData = jsonDecode(response.body);
        throw Exception(errorData['error'] ?? 'Failed to confirm return');
      }
    } catch (e) {
      print('❌ Owner confirm return error: $e');
      rethrow;
    }
  }
}

// ==================== RESPONSE MODELS ====================

class VerificationStatus {
  final bool isVerified;
  final bool hasLicense;
  final bool hasSelfies;
  final bool needsVerification;

  VerificationStatus({
    required this.isVerified,
    required this.hasLicense,
    required this.hasSelfies,
    required this.needsVerification,
  });

  factory VerificationStatus.fromJson(Map<String, dynamic> json) {
    return VerificationStatus(
      isVerified: json['isVerified'] ?? false,
      hasLicense: json['hasLicense'] ?? false,
      hasSelfies: json['hasSelfies'] ?? false,
      needsVerification: json['needsVerification'] ?? true,
    );
  }
}

class CreateBookingResponse {
  final BookingDetails booking;
  final String message;

  CreateBookingResponse({required this.booking, required this.message});

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
  final String? vehicleName;
  final String customerId;
  final String? vehicleOwnerId;
  final String status;
  final DateTime startDate;
  final DateTime endDate;
  final String? duration;
  final Map<String, dynamic>? pricing;

  BookingDetails({
    required this.id,
    required this.vehicleId,
    this.vehicleName,
    required this.customerId,
    this.vehicleOwnerId,
    required this.status,
    required this.startDate,
    required this.endDate,
    this.duration,
    this.pricing,
  });

  factory BookingDetails.fromJson(Map<String, dynamic> json) {
    return BookingDetails(
      id: json['id'] ?? '',
      vehicleId: json['vehicleId'] ?? '',
      vehicleName: json['vehicleName'],
      customerId: json['customerId'] ?? '',
      vehicleOwnerId: json['vehicleOwnerId'],
      status: json['status'] ?? 'pending',
      startDate: DateTime.parse(json['startDate']),
      endDate: DateTime.parse(json['endDate']),
      duration: json['duration'],
      pricing: json['pricing'] != null ? Map<String, dynamic>.from(json['pricing']) : null,
    );
  }
}

class MyBookingsResponse {
  final List<CustomerBooking> bookings;
  final Pagination pagination;

  MyBookingsResponse({required this.bookings, required this.pagination});

  factory MyBookingsResponse.fromJson(Map<String, dynamic> json) {
    return MyBookingsResponse(
      bookings: (json['bookings'] as List?)?.map((b) => CustomerBooking.fromJson(b)).toList() ?? [],
      pagination: Pagination.fromJson(json['pagination'] ?? {}),
    );
  }
}

class CustomerBooking {
  final String id;
  final String status;
  final Map<String, dynamic> vehicle;
  final DateTime startDate;
  final DateTime endDate;
  final String duration;
  final Map<String, dynamic> pricing;
  final bool canCancel;
  final bool canReview;
  final DateTime createdAt;

  CustomerBooking({
    required this.id,
    required this.status,
    required this.vehicle,
    required this.startDate,
    required this.endDate,
    required this.duration,
    required this.pricing,
    required this.canCancel,
    required this.canReview,
    required this.createdAt,
  });

  factory CustomerBooking.fromJson(Map<String, dynamic> json) {
    return CustomerBooking(
      id: json['id'] ?? '',
      status: json['status'] ?? 'pending',
      vehicle: Map<String, dynamic>.from(json['vehicle'] ?? {}),
      startDate: DateTime.parse(json['startDate']),
      endDate: DateTime.parse(json['endDate']),
      duration: json['duration'] ?? '',
      pricing: Map<String, dynamic>.from(json['pricing'] ?? {}),
      canCancel: json['canCancel'] ?? false,
      canReview: json['canReview'] ?? false,
      createdAt: DateTime.parse(json['createdAt']),
    );
  }
}

class OwnerBookingsResponse {
  final List<OwnerBooking> bookings;
  final Pagination pagination;

  OwnerBookingsResponse({required this.bookings, required this.pagination});

  factory OwnerBookingsResponse.fromJson(Map<String, dynamic> json) {
    return OwnerBookingsResponse(
      bookings: (json['bookings'] as List?)?.map((b) => OwnerBooking.fromJson(b)).toList() ?? [],
      pagination: Pagination.fromJson(json['pagination'] ?? {}),
    );
  }
}

class OwnerBooking {
  final String id;
  final String status;
  final Map<String, dynamic> vehicle;
  final String customerId;
  final DateTime startDate;
  final DateTime endDate;
  final String duration;
  final int totalAmount;
  final DateTime createdAt;
  final bool needsAction;

  OwnerBooking({
    required this.id,
    required this.status,
    required this.vehicle,
    required this.customerId,
    required this.startDate,
    required this.endDate,
    required this.duration,
    required this.totalAmount,
    required this.createdAt,
    required this.needsAction,
  });

  factory OwnerBooking.fromJson(Map<String, dynamic> json) {
    return OwnerBooking(
      id: json['id'] ?? '',
      status: json['status'] ?? 'pending',
      vehicle: Map<String, dynamic>.from(json['vehicle'] ?? {}),
      customerId: json['customerId'] ?? '',
      startDate: DateTime.parse(json['startDate']),
      endDate: DateTime.parse(json['endDate']),
      duration: json['duration'] ?? '',
      totalAmount: json['totalAmount'] ?? 0,
      createdAt: DateTime.parse(json['createdAt']),
      needsAction: json['needsAction'] ?? false,
    );
  }
}

class Pagination {
  final int total;
  final int page;
  final int limit;

  Pagination({required this.total, required this.page, required this.limit});

  factory Pagination.fromJson(Map<String, dynamic> json) {
    return Pagination(total: json['total'] ?? 0, page: json['page'] ?? 1, limit: json['limit'] ?? 10);
  }
}

// ==================== DETAILED BOOKING RESPONSE ====================
class BookingActions {
  final bool canSignContract;
  final bool canSubmitPickupPhotos;
  final bool canSubmitReturnPhotos;
  final bool canReview;
  final bool canCancel;

  BookingActions({
    required this.canSignContract,
    required this.canSubmitPickupPhotos,
    required this.canSubmitReturnPhotos,
    required this.canReview,
    required this.canCancel,
  });

  factory BookingActions.fromJson(Map<String, dynamic> json) {
    return BookingActions(
      canSignContract: json['canSignContract'] == true,
      canSubmitPickupPhotos: json['canSubmitPickupPhotos'] == true,
      canSubmitReturnPhotos: json['canSubmitReturnPhotos'] == true,
      canReview: json['canReview'] == true,
      canCancel: json['canCancel'] == true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'canSignContract': canSignContract,
      'canSubmitPickupPhotos': canSubmitPickupPhotos,
      'canSubmitReturnPhotos': canSubmitReturnPhotos,
      'canReview': canReview,
      'canCancel': canCancel,
    };
  }
}

// ✅ Helper function to safely parse integers
int? _parseInt(dynamic value) {
  if (value == null) return null;
  if (value is int) return value;
  if (value is double) return value.toInt();
  if (value is String) return int.tryParse(value);
  return null;
}

// ✅ UPDATED: BookingDetailsResponse with actions
class BookingDetailsResponse {
  final String id;
  final String status;
  final VehicleInfo vehicle;
  final String customerId;
  final Map<String, dynamic> timeline;
  final Map<String, dynamic> pickup;
  final Map<String, dynamic> dropoff;
  final BillingInfo billing;
  final InsuranceInfo insurance;
  final List<String>? pickupPhotos;
  final List<String>? returnPhotos;
  final String? additionalNotes;
  final ContractInfo? contract;
  final BookingActions actions;

  BookingDetailsResponse({
    required this.id,
    required this.status,
    required this.vehicle,
    required this.customerId,
    required this.timeline,
    required this.pickup,
    required this.dropoff,
    required this.billing,
    required this.insurance,
    this.pickupPhotos,
    this.returnPhotos,
    this.additionalNotes,
    this.contract,
    required this.actions,
  });

  factory BookingDetailsResponse.fromJson(Map<String, dynamic> json) {
    print('📦 Parsing booking details JSON: ${json.keys}');

    try {
      // Parse timeline with null safety
      final timelineData = json['timeline'];
      Map<String, dynamic> timeline;

      if (timelineData is Map<String, dynamic>) {
        timeline = {
          'startDate': timelineData['startDate'] ?? DateTime.now().toIso8601String(),
          'endDate': timelineData['endDate'] ?? DateTime.now().add(Duration(days: 1)).toIso8601String(),
          'duration': timelineData['duration'] ?? '1 days',
          'isBookingDay': timelineData['isBookingDay'] ?? false,
          'isAfterBookingDay': timelineData['isAfterBookingDay'] ?? false,
          'isReturnDay': timelineData['isReturnDay'] ?? false,
          'isAfterReturnDay': timelineData['isAfterReturnDay'] ?? false,
          'isTestingMode': timelineData['isTestingMode'] ?? false,
        };
      } else {
        timeline = {
          'startDate': DateTime.now().toIso8601String(),
          'endDate': DateTime.now().add(Duration(days: 1)).toIso8601String(),
          'duration': '1 days',
          'isBookingDay': false,
          'isAfterBookingDay': false,
          'isReturnDay': false,
          'isAfterReturnDay': false,
          'isTestingMode': false,
        };
      }

      return BookingDetailsResponse(
        id: json['id']?.toString() ?? '',
        status: json['status']?.toString() ?? 'pending',
        vehicle: VehicleInfo.fromJson(json['vehicle'] ?? {}),
        customerId: json['customerId']?.toString() ?? '',
        timeline: timeline,
        pickup: Map<String, dynamic>.from(json['pickup'] ?? {}),
        dropoff: Map<String, dynamic>.from(json['dropoff'] ?? {}),
        billing: BillingInfo.fromJson(json['billing'] ?? {}),
        insurance: InsuranceInfo.fromJson(json['insurance'] ?? {}),
        pickupPhotos: json['pickupPhotos'] != null ? List<String>.from(json['pickupPhotos']) : null,
        returnPhotos: json['returnPhotos'] != null ? List<String>.from(json['returnPhotos']) : null,
        additionalNotes: json['additionalNotes']?.toString(),
        contract: json['contract'] != null ? ContractInfo.fromJson(json['contract']) : null,
        actions: BookingActions.fromJson(json['actions'] ?? {}),
      );
    } catch (e) {
      print('❌ Error parsing BookingDetailsResponse: $e');
      print('JSON data: $json');
      rethrow;
    }
  }
}

class VehicleInfo {
  final String id;
  final String name;
  final String? ownerId;

  VehicleInfo({required this.id, required this.name, this.ownerId});

  factory VehicleInfo.fromJson(Map<String, dynamic> json) {
    return VehicleInfo(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Unknown Vehicle',
      ownerId: json['ownerId']?.toString(),
    );
  }
}

class BillingInfo {
  final int rentalPrice;
  final int insuranceFee;
  final int dailyRate;
  final int numberOfDays;
  final int total;
  final int deposit;
  final bool depositPaid;
  final int remainingPayment;
  final bool finalPaymentPaid;

  BillingInfo({
    required this.rentalPrice,
    required this.insuranceFee,
    required this.dailyRate,
    required this.numberOfDays,
    required this.total,
    required this.deposit,
    required this.depositPaid,
    required this.remainingPayment,
    required this.finalPaymentPaid,
  });

  factory BillingInfo.fromJson(Map<String, dynamic> json) {
    return BillingInfo(
      rentalPrice: _parseInt(json['rentalPrice']) ?? 0,
      insuranceFee: _parseInt(json['insuranceFee']) ?? 0,
      dailyRate: _parseInt(json['dailyRate']) ?? 0,
      numberOfDays: _parseInt(json['numberOfDays']) ?? 1,
      total: _parseInt(json['total']) ?? 0,
      deposit: _parseInt(json['deposit']) ?? 0,
      depositPaid: json['depositPaid'] == true,
      remainingPayment: _parseInt(json['remainingPayment']) ?? 0,
      finalPaymentPaid: json['finalPaymentPaid'] == true,
    );
  }
}

class InsuranceInfo {
  final int coverage;

  InsuranceInfo({required this.coverage});

  factory InsuranceInfo.fromJson(Map<String, dynamic> json) {
    return InsuranceInfo(coverage: _parseInt(json['coverage']) ?? 0);
  }
}

class ContractInfo {
  final DateTime signedAt;
  final String url;

  ContractInfo({required this.signedAt, required this.url});

  factory ContractInfo.fromJson(Map<String, dynamic> json) {
    try {
      return ContractInfo(
        signedAt: DateTime.parse(json['signedAt']?.toString() ?? DateTime.now().toIso8601String()),
        url: json['url']?.toString() ?? '',
      );
    } catch (e) {
      print('⚠️ Error parsing ContractInfo: $e');
      return ContractInfo(signedAt: DateTime.now(), url: '');
    }
  }
}

class TimelineInfo {
  final DateTime startDate;
  final DateTime endDate;
  final String duration;
  final bool isBookingDay;

  TimelineInfo({required this.startDate, required this.endDate, required this.duration, required this.isBookingDay});

  factory TimelineInfo.fromJson(Map<String, dynamic> json) {
    return TimelineInfo(
      startDate: DateTime.parse(json['startDate']),
      endDate: DateTime.parse(json['endDate']),
      duration: json['duration'] ?? '',
      isBookingDay: json['isBookingDay'] ?? false,
    );
  }

  void operator [](String other) {}
}
