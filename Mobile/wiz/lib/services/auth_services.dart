// lib/services/auth_service.dart
import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'package:jwt_decoder/jwt_decoder.dart';

class AuthService {
  static const String baseUrl = 'http://10.0.2.2:3001'; // Android emulator
  final _storage = const FlutterSecureStorage();

  // Storage keys
  static const String _tokenKey = 'auth_token';
  static const String _refreshTokenKey = 'refresh_token';
  static const String _userIdKey = 'user_id';
  static const String _userNameKey = 'user_name';
  static const String _userEmailKey = 'user_email';
  static const String _userAvatarKey = 'user_avatar';
  static const String _userRoleKey = 'user_role'; // ✅ NEW
  static const String _activeRoleKey = 'active_role'; // ✅ NEW: For role switching

  // ==================== AUTHENTICATION ====================

  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'password': password}),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        // Save tokens
        await _storage.write(key: _tokenKey, value: data['token']);
        await _storage.write(key: _refreshTokenKey, value: data['refreshToken']);

        // ✅ FIX: Decode JWT to get role
        final decodedToken = JwtDecoder.decode(data['token']);
        final role = decodedToken['role'] ?? 'customer';

        // Save user info
        await _storage.write(key: _userIdKey, value: data['user']['id']);
        await _storage.write(key: _userNameKey, value: data['user']['fullName']);
        await _storage.write(key: _userEmailKey, value: data['user']['email']);
        await _storage.write(key: _userAvatarKey, value: data['user']['avatarUrl']);
        await _storage.write(key: _userRoleKey, value: role); // ✅ Save role
        await _storage.write(key: _activeRoleKey, value: role); // ✅ Set active role to actual role

        print('✅ Login successful: role=$role');

        return {'success': true, 'user': data['user'], 'role': role};
      } else {
        return {'success': false, 'error': data['error'] ?? 'Login failed'};
      }
    } catch (e) {
      print('❌ Login error: $e');
      return {'success': false, 'error': 'Network error: ${e.toString()}'};
    }
  }

  // ✅ NEW: Fetch fresh user profile from backend
  Future<Map<String, dynamic>?> getUserProfile() async {
    try {
      final token = await _storage.read(key: _tokenKey);
      if (token == null) return null;

      final response = await http.get(
        Uri.parse('$baseUrl/users/me'),
        headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'},
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final user = data['user'];

        // Update stored user info
        await _storage.write(key: _userIdKey, value: user['id']);
        await _storage.write(key: _userNameKey, value: user['fullName']);
        await _storage.write(key: _userEmailKey, value: user['email']);
        await _storage.write(key: _userAvatarKey, value: user['avatarUrl']);
        await _storage.write(key: _userRoleKey, value: user['role']); // ✅ Update role

        // If active role is not set, set it to actual role
        final activeRole = await _storage.read(key: _activeRoleKey);
        if (activeRole == null) {
          await _storage.write(key: _activeRoleKey, value: user['role']);
        }

        print('✅ Profile fetched: role=${user['role']}');

        return {'success': true, 'user': user, 'linkedAccounts': data['linkedAccounts'] ?? []};
      } else {
        print('❌ Failed to fetch profile: ${response.statusCode}');
        return null;
      }
    } catch (e) {
      print('❌ Get profile error: $e');
      return null;
    }
  }

  // ==================== ROLE MANAGEMENT ====================

  // ✅ NEW: Get user's actual role from backend
  Future<String> getUserRole() async {
    // First try to get from storage
    final storedRole = await _storage.read(key: _userRoleKey);
    if (storedRole != null) {
      return storedRole;
    }

    // If not in storage, fetch from backend
    final profile = await getUserProfile();
    if (profile != null && profile['user'] != null) {
      return profile['user']['role'] ?? 'customer';
    }

    return 'customer'; // Default fallback
  }

  // ✅ NEW: Get active role (what the user is currently viewing as)
  Future<String> getActiveRole() async {
    final activeRole = await _storage.read(key: _activeRoleKey);
    if (activeRole != null) {
      return activeRole;
    }

    // If not set, use actual role
    return await getUserRole();
  }

  // ✅ NEW: Set active role (for role switching)
  Future<void> setActiveRole(String role) async {
    await _storage.write(key: _activeRoleKey, value: role);
    print('✅ Active role switched to: $role');
  }

  // ✅ NEW: Check if user can switch roles (must be owner to have both)
  Future<bool> canSwitchRoles() async {
    final actualRole = await getUserRole();
    return actualRole == 'owner'; // Only owners can switch between owner/customer
  }

  // ==================== USER INFO ====================

  Future<Map<String, String?>> getUserInfo() async {
    final userId = await _storage.read(key: _userIdKey);
    final userName = await _storage.read(key: _userNameKey);
    final userEmail = await _storage.read(key: _userEmailKey);
    final userAvatar = await _storage.read(key: _userAvatarKey);
    final role = await getUserRole(); // ✅ Get actual role
    final activeRole = await getActiveRole(); // ✅ Get active role

    print('📦 User info: userId=$userId, role=$role, activeRole=$activeRole');

    return {
      'userId': userId,
      'userName': userName,
      'userEmail': userEmail,
      'userAvatar': userAvatar,
      'role': role, // ✅ Actual role
      'activeRole': activeRole, // ✅ Current viewing role
    };
  }

  // ==================== TOKEN MANAGEMENT ====================

  Future<String?> getToken() async {
    return await _storage.read(key: _tokenKey);
  }

  Future<bool> isLoggedIn() async {
    final token = await _storage.read(key: _tokenKey);
    if (token == null) return false;

    // Check if token is expired
    try {
      return !JwtDecoder.isExpired(token);
    } catch (e) {
      return false;
    }
  }

  Future<void> logout() async {
    await _storage.deleteAll();
    print('✅ Logged out successfully');
  }
}
