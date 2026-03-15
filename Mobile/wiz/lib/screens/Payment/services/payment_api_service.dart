import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:wiz/services/local_storage_service.dart';

class PaymentApiService {
  // static const String baseUrl = 'http://10.0.2.2:3006'; // payment-service
  // static const String baseUrl = 'http://localhost:3006'; // payment-service
  static const String baseUrl = 'http://206.189.147.242';
  final _localStorageService = LocalStorageService();

  Future<String?> _getAuthToken() async {
    try {
      final token = await _localStorageService.getToken();
      return token;
    } catch (e) {
      print('Error getting auth token: $e');
      return null;
    }
  }

  /// Create deposit payment intent (30% of total)
  Future<PaymentIntentResponse> createDepositIntent({
    required String bookingId,
    String provider = 'stripe',
    String? paymentMethodId, // ✅ This should be null for new payments
  }) async {
    try {
      final token = await _getAuthToken();
      if (token == null) {
        throw Exception('Authentication required');
      }

      final headers = {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'};

      // ✅ FIX: Only include paymentMethodId if it's actually provided (not the provider name)
      final body = jsonEncode({
        'bookingId': bookingId,
        'provider': provider,
        // ✅ Don't include paymentMethodId if it's null
        if (paymentMethodId != null && paymentMethodId.isNotEmpty) 'paymentMethodId': paymentMethodId,
      });

      print('📤 Creating deposit payment intent for booking: $bookingId');
      print('   Provider: $provider');
      if (paymentMethodId != null && paymentMethodId.isNotEmpty) {
        print('   Payment Method ID: $paymentMethodId');
      }

      final response = await http.post(Uri.parse('$baseUrl/payment/deposit/intent'), headers: headers, body: body);

      if (response.statusCode == 201) {
        final data = jsonDecode(response.body);
        print('✅ Deposit intent created: ${data['intentId']}');
        return PaymentIntentResponse.fromJson(data);
      } else {
        final errorData = jsonDecode(response.body);
        throw Exception(errorData['error'] ?? 'Failed to create payment intent');
      }
    } catch (e) {
      print('❌ Create deposit intent error: $e');
      rethrow;
    }
  }

  /// Create final payment intent (70% of total)
  Future<PaymentIntentResponse> createFinalPaymentIntent({
    required String bookingId,
    String provider = 'stripe',
    String? paymentMethodId, // ✅ This should be null for new payments
  }) async {
    try {
      final token = await _getAuthToken();
      if (token == null) {
        throw Exception('Authentication required');
      }

      final headers = {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'};

      // ✅ FIX: Only include paymentMethodId if it's actually provided (not the provider name)
      final body = jsonEncode({
        'bookingId': bookingId,
        'provider': provider,
        // ✅ Don't include paymentMethodId if it's null
        if (paymentMethodId != null && paymentMethodId.isNotEmpty) 'paymentMethodId': paymentMethodId,
      });

      print('📤 Creating final payment intent for booking: $bookingId');
      print('   Provider: $provider');
      if (paymentMethodId != null && paymentMethodId.isNotEmpty) {
        print('   Payment Method ID: $paymentMethodId');
      }

      final response = await http.post(Uri.parse('$baseUrl/payment/final/intent'), headers: headers, body: body);

      if (response.statusCode == 201) {
        final data = jsonDecode(response.body);
        print('✅ Final payment intent created: ${data['intentId']}');
        return PaymentIntentResponse.fromJson(data);
      } else {
        final errorData = jsonDecode(response.body);
        throw Exception(errorData['error'] ?? 'Failed to create payment intent');
      }
    } catch (e) {
      print('❌ Create final payment intent error: $e');
      rethrow;
    }
  }

  /// Get transaction history
  Future<TransactionHistoryResponse> getTransactions({
    String type = 'all',
    String status = 'all',
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final token = await _getAuthToken();
      if (token == null) {
        throw Exception('Authentication required');
      }

      final queryParams = {'type': type, 'status': status, 'page': page.toString(), 'limit': limit.toString()};

      final headers = {'Authorization': 'Bearer $token'};

      final response = await http.get(
        Uri.parse('$baseUrl/payment/transactions').replace(queryParameters: queryParams),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return TransactionHistoryResponse.fromJson(data);
      } else {
        throw Exception('Failed to get transactions');
      }
    } catch (e) {
      print('❌ Get transactions error: $e');
      rethrow;
    }
  }

  /// Get booking transactions
  Future<BookingTransactionsResponse> getBookingTransactions(String bookingId) async {
    try {
      final token = await _getAuthToken();
      if (token == null) {
        throw Exception('Authentication required');
      }

      final headers = {'Authorization': 'Bearer $token'};

      final response = await http.get(Uri.parse('$baseUrl/payment/transactions/booking/$bookingId'), headers: headers);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return BookingTransactionsResponse.fromJson(data);
      } else {
        throw Exception('Failed to get booking transactions');
      }
    } catch (e) {
      print('❌ Get booking transactions error: $e');
      rethrow;
    }
  }

  /// ✅ NEW: Verify payment status with backend (fallback if webhook fails)
  Future<Map<String, dynamic>> verifyDepositPayment(String intentId) async {
    try {
      final token = await _getAuthToken();
      if (token == null) {
        throw Exception('Authentication required');
      }

      final headers = {'Authorization': 'Bearer $token'};

      print('🔍 Verifying deposit payment: $intentId');

      final response = await http.get(Uri.parse('$baseUrl/payment/deposit/$intentId/verify'), headers: headers);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        print('✅ Payment verification response: ${data['status']}');
        return data;
      } else {
        final errorData = jsonDecode(response.body);
        throw Exception(errorData['error'] ?? 'Failed to verify payment');
      }
    } catch (e) {
      print('❌ Verify payment error: $e');
      rethrow;
    }
  }
}

// ==================== RESPONSE MODELS ====================

class PaymentIntentResponse {
  final String intentId;
  final String? clientSecret;
  final String? paymentUrl;
  final String status;
  final String provider;
  final int amount;
  final String currency;
  final String message;

  PaymentIntentResponse({
    required this.intentId,
    this.clientSecret,
    this.paymentUrl,
    required this.status,
    required this.provider,
    required this.amount,
    required this.currency,
    required this.message,
  });

  factory PaymentIntentResponse.fromJson(Map<String, dynamic> json) {
    return PaymentIntentResponse(
      intentId: json['intentId'] ?? '',
      clientSecret: json['clientSecret'],
      paymentUrl: json['paymentUrl'],
      status: json['status'] ?? 'pending',
      provider: json['provider'] ?? 'stripe',
      amount: json['amount'] ?? 0,
      currency: json['currency'] ?? 'VND',
      message: json['message'] ?? '',
    );
  }
}

class TransactionHistoryResponse {
  final List<Transaction> transactions;
  final Pagination pagination;

  TransactionHistoryResponse({required this.transactions, required this.pagination});

  factory TransactionHistoryResponse.fromJson(Map<String, dynamic> json) {
    return TransactionHistoryResponse(
      transactions: (json['transactions'] as List?)?.map((t) => Transaction.fromJson(t)).toList() ?? [],
      pagination: Pagination.fromJson(json['pagination'] ?? {}),
    );
  }
}

class BookingTransactionsResponse {
  final String bookingId;
  final List<Transaction> transactions;
  final TransactionSummary summary;

  BookingTransactionsResponse({required this.bookingId, required this.transactions, required this.summary});

  factory BookingTransactionsResponse.fromJson(Map<String, dynamic> json) {
    return BookingTransactionsResponse(
      bookingId: json['bookingId'] ?? '',
      transactions: (json['transactions'] as List?)?.map((t) => Transaction.fromJson(t)).toList() ?? [],
      summary: TransactionSummary.fromJson(json['summary'] ?? {}),
    );
  }
}

class Transaction {
  final String transactionId;
  final String bookingId;
  final String type;
  final int amount;
  final String currency;
  final String status;
  final String provider;
  final DateTime createdAt;

  Transaction({
    required this.transactionId,
    required this.bookingId,
    required this.type,
    required this.amount,
    required this.currency,
    required this.status,
    required this.provider,
    required this.createdAt,
  });

  factory Transaction.fromJson(Map<String, dynamic> json) {
    return Transaction(
      transactionId: json['transaction_id'] ?? '',
      bookingId: json['booking_id'] ?? '',
      type: json['type'] ?? '',
      amount: json['amount'] ?? 0,
      currency: json['currency'] ?? 'VND',
      status: json['status'] ?? '',
      provider: json['provider'] ?? '',
      createdAt: DateTime.parse(json['created_at']),
    );
  }
}

class TransactionSummary {
  final int totalPaid;
  final int totalRefunded;
  final String depositStatus;
  final String finalPaymentStatus;

  TransactionSummary({
    required this.totalPaid,
    required this.totalRefunded,
    required this.depositStatus,
    required this.finalPaymentStatus,
  });

  factory TransactionSummary.fromJson(Map<String, dynamic> json) {
    return TransactionSummary(
      totalPaid: json['totalPaid'] ?? 0,
      totalRefunded: json['totalRefunded'] ?? 0,
      depositStatus: json['depositStatus'] ?? 'unpaid',
      finalPaymentStatus: json['finalPaymentStatus'] ?? 'unpaid',
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
}
