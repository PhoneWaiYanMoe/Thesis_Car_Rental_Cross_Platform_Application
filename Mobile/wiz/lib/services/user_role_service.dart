import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:wiz/services/local_storage_service.dart';

class UserRoleService {
  // static const String baseUrl = 'http://localhost:3001'; // user-service
  static const String baseUrl = 'http://206.189.147.242';
  // static const String baseUrl = 'http://10.0.2.2:3001'; // For Android emulator

  final _localStorageService = LocalStorageService();

  /// Get auth token
  Future<String?> _getAuthToken() async {
    try {
      final token = await _localStorageService.getToken();
      return token;
    } catch (e) {
      print('Error getting auth token: $e');
      return null;
    }
  }

  /// Get current user's role from local storage
  Future<String?> getCurrentUserRole() async {
    try {
      final userInfo = await _localStorageService.getUserInfo();
      return userInfo['role'];
    } catch (e) {
      print('Error getting user role: $e');
      return null;
    }
  }

  /// Get current user's ID from local storage
  Future<String?> getCurrentUserId() async {
    try {
      final userInfo = await _localStorageService.getUserInfo();
      return userInfo['userId'];
    } catch (e) {
      print('Error getting user ID: $e');
      return null;
    }
  }

  /// Upgrade user role to owner
  /// Returns: {'success': bool, 'message': String?, 'user': Map?, 'error': String?}
  Future<Map<String, dynamic>> upgradeToOwner(String userId) async {
    try {
      final token = await _getAuthToken();

      if (token == null) {
        return {'success': false, 'error': 'Authentication required. Please login again.'};
      }

      print('Upgrading user $userId to owner...');

      final response = await http.put(
        Uri.parse('$baseUrl/users/$userId/role'),
        headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'},
        body: jsonEncode({'newRole': 'owner'}),
      );

      print('Role upgrade response: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);

        print('Successfully upgraded to owner');

        // Update local storage with new role
        await _updateLocalRole(data['user']);

        return {'success': true, 'message': data['message'] ?? 'Role updated successfully', 'user': data['user']};
      } else if (response.statusCode == 401) {
        return {'success': false, 'error': 'Unauthorized. Please login again.'};
      } else if (response.statusCode == 403) {
        return {'success': false, 'error': 'You do not have permission to perform this action.'};
      } else if (response.statusCode == 404) {
        return {'success': false, 'error': 'User not found.'};
      } else {
        final errorData = jsonDecode(response.body);
        return {'success': false, 'error': errorData['error'] ?? 'Failed to upgrade role'};
      }
    } catch (e) {
      print('Upgrade to owner error: $e');
      return {'success': false, 'error': 'Network error: ${e.toString()}'};
    }
  }

  /// Update local storage with new role after upgrade
  Future<void> _updateLocalRole(Map<String, dynamic> updatedUser) async {
    try {
      // Get current user info
      final currentUserInfo = await _localStorageService.getUserInfo();
      final token = await _getAuthToken();

      if (token == null) {
        print('Cannot update local role: No token found');
        return;
      }

      // Update with new role
      await _localStorageService.saveAuthData(
        token: token,
        refreshToken: token, // Using same token as refresh token
        user: {
          'id': updatedUser['user_id'] ?? currentUserInfo['userId'],
          'fullName': currentUserInfo['userName'] ?? 'User',
          'email': updatedUser['email'] ?? currentUserInfo['userEmail'],
          'role': updatedUser['role'] ?? 'owner',
          'avatarUrl': currentUserInfo['userAvatar'],
        },
      );

      print('Local storage updated with new role: ${updatedUser['role']}');
    } catch (e) {
      print('Error updating local role: $e');
    }
  }

  /// Get user profile (includes role information)
  Future<Map<String, dynamic>> getUserProfile(String userId) async {
    try {
      final token = await _getAuthToken();

      if (token == null) {
        return {'success': false, 'error': 'Authentication required'};
      }

      final response = await http.get(
        Uri.parse('$baseUrl/users/$userId'),
        headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'},
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {'success': true, 'user': data['user']};
      } else {
        final errorData = jsonDecode(response.body);
        return {'success': false, 'error': errorData['error'] ?? 'Failed to get user profile'};
      }
    } catch (e) {
      print('❌ Get user profile error: $e');
      return {'success': false, 'error': 'Network error: ${e.toString()}'};
    }
  }
}
