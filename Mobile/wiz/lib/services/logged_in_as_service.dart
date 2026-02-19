// lib/services/logged_in_as_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:wiz/services/local_storage_service.dart';

class LoggedInAsService {
  // static const String baseUrl = 'http://localhost:3001'; // user-service
  // static const String baseUrl = 'http://10.0.2.2:3001'; // For Android emulator
   static const String baseUrl = 'http://206.189.147.242'; 

  final _localStorageService = LocalStorageService();

  /// Get auth token
  Future<String?> _getAuthToken() async {
    try {
      final token = await _localStorageService.getToken();
      return token;
    } catch (e) {
      print('❌ Error getting auth token: $e');
      return null;
    }
  }

  /// Get current user's ID from local storage
  Future<String?> _getCurrentUserId() async {
    try {
      final userInfo = await _localStorageService.getUserInfo();
      return userInfo['userId'];
    } catch (e) {
      print('❌ Error getting user ID: $e');
      return null;
    }
  }

  /// Get logged_in_as status from API
  /// Returns: {'success': bool, 'logged_in_as': String?, 'error': String?}
  Future<Map<String, dynamic>> getLoggedInAs() async {
    try {
      final token = await _getAuthToken();
      final userId = await _getCurrentUserId();

      if (token == null || userId == null) {
        print('❌ No auth token or user ID found, defaulting to customer');
        return {
          'success': false,
          'logged_in_as': 'customer',
          'error': 'Authentication required',
        };
      }

      print('📤 Fetching logged_in_as status for user $userId...');

      final response = await http.get(
        Uri.parse('$baseUrl/users/$userId/logged-in-as'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      print('📥 Get logged_in_as response: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final loggedInAs = data['logged_in_as'] ?? 'customer';

        print('✅ Logged in as: $loggedInAs');

        return {
          'success': true,
          'logged_in_as': loggedInAs,
        };
      } else if (response.statusCode == 401) {
        print('❌ Unauthorized, defaulting to customer');
        return {
          'success': false,
          'logged_in_as': 'customer',
          'error': 'Unauthorized',
        };
      } else if (response.statusCode == 404) {
        print('❌ User not found, defaulting to customer');
        return {
          'success': false,
          'logged_in_as': 'customer',
          'error': 'User not found',
        };
      } else {
        final errorData = jsonDecode(response.body);
        print('❌ Error: ${errorData['error'] ?? 'Unknown error'}');
        return {
          'success': false,
          'logged_in_as': 'customer',
          'error': errorData['error'] ?? 'Failed to get logged_in_as status',
        };
      }
    } catch (e) {
      print('❌ Get logged_in_as error: $e');
      print('⚠️ Defaulting to customer mode');
      return {
        'success': false,
        'logged_in_as': 'customer',
        'error': 'Network error: ${e.toString()}',
      };
    }
  }

  /// Update logged_in_as status via API
  /// Returns: {'success': bool, 'logged_in_as': String?, 'message': String?, 'error': String?}
  Future<Map<String, dynamic>> updateLoggedInAs(String newStatus) async {
    // Validate input
    if (newStatus != 'customer' && newStatus != 'owner') {
      return {
        'success': false,
        'error': 'Invalid status. Must be "customer" or "owner"',
      };
    }

    try {
      final token = await _getAuthToken();
      final userId = await _getCurrentUserId();

      if (token == null || userId == null) {
        return {
          'success': false,
          'error': 'Authentication required. Please login again.',
        };
      }

      print('📤 Updating logged_in_as to $newStatus for user $userId...');

      final response = await http.put(
        Uri.parse('$baseUrl/users/$userId/logged-in-as'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({'logged_in_as': newStatus}),
      );

      print('📥 Update logged_in_as response: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final updatedStatus = data['logged_in_as'] ?? newStatus;

        print('✅ Successfully updated logged_in_as to: $updatedStatus');

        return {
          'success': true,
          'logged_in_as': updatedStatus,
          'message': data['message'] ?? 'Logged in as updated successfully',
        };
      } else if (response.statusCode == 401) {
        return {
          'success': false,
          'error': 'Unauthorized. Please login again.',
        };
      } else if (response.statusCode == 403) {
        return {
          'success': false,
          'error': 'You do not have permission to perform this action.',
        };
      } else if (response.statusCode == 404) {
        return {
          'success': false,
          'error': 'User not found.',
        };
      } else {
        final errorData = jsonDecode(response.body);
        return {
          'success': false,
          'error': errorData['error'] ?? 'Failed to update logged_in_as status',
        };
      }
    } catch (e) {
      print('❌ Update logged_in_as error: $e');
      return {
        'success': false,
        'error': 'Network error: ${e.toString()}',
      };
    }
  }

  /// Check if user can switch to owner mode
  /// (User must have 'owner' role to switch to owner mode)
  Future<bool> canSwitchToOwner() async {
    try {
      final userInfo = await _localStorageService.getUserInfo();
      final role = userInfo['role'];
      return role == 'owner';
    } catch (e) {
      print('❌ Error checking if user can switch to owner: $e');
      return false;
    }
  }

  /// Get user's actual role (not the logged_in_as status)
  Future<String?> getUserRole() async {
    try {
      final userInfo = await _localStorageService.getUserInfo();
      return userInfo['role'] ?? 'customer';
    } catch (e) {
      print('❌ Error getting user role: $e');
      return 'customer';
    }
  }
}