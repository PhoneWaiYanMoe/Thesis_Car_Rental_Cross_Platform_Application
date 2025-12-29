// lib/services/local_storage_service.dart
import 'package:shared_preferences/shared_preferences.dart';

class LocalStorageService {
  // Auth Keys
  static const String _tokenKey = 'auth_token';
  static const String _refreshTokenKey = 'refresh_token';
  static const String _userIdKey = 'user_id';
  static const String _userNameKey = 'user_name';
  static const String _userEmailKey = 'user_email';
  static const String _userAvatarKey = 'user_avatar';
  static const String _licenseKey = 'license_number';
  static const String _userRoleKey = 'user_role';

  // License Keys
  static const String _licenseVerifiedKey = 'license_verified';
  static const String _licenseFullNameKey = 'license_full_name';
  static const String _licenseNumberKey = 'license_number_full';
  static const String _licenseExpireDateKey = 'license_expire_date';
  static const String _licenseFrontImageKey = 'license_front_image';
  static const String _licenseBackImageKey = 'license_back_image';

  // ==================== AUTH METHODS ====================

  /// Check if user is logged in
  Future<bool> isLoggedIn() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(_tokenKey);
    return token != null && token.isNotEmpty;
  }

  /// Get auth token
  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  /// Get refresh token
  Future<String?> getRefreshToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_refreshTokenKey);
  }

  /// Save auth data
  Future<void> saveAuthData({
    required String token,
    required String refreshToken,
    required Map<String, dynamic> user,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
    await prefs.setString(_refreshTokenKey, refreshToken);
    await prefs.setString(_userIdKey, user['id'] ?? '');
    await prefs.setString(_userNameKey, user['fullName'] ?? '');
    await prefs.setString(_userEmailKey, user['email'] ?? '');
    await prefs.setString(_userRoleKey, user['role'] ?? 'customer'); // Save role
    if (user['avatarUrl'] != null) {
      await prefs.setString(_userAvatarKey, user['avatarUrl']);
    }
  }

  /// Get user info
  Future<Map<String, String?>> getUserInfo() async {
    final prefs = await SharedPreferences.getInstance();
    return {
      'userId': prefs.getString(_userIdKey),
      'userName': prefs.getString(_userNameKey),
      'userEmail': prefs.getString(_userEmailKey),
      'userAvatar': prefs.getString(_userAvatarKey),
      'licenseNumber': prefs.getString(_licenseKey),
      'role': prefs.getString(_userRoleKey),
    };
  }

  /// Clear auth data (logout)
  Future<void> clearAuthData() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_refreshTokenKey);
    await prefs.remove(_userIdKey);
    await prefs.remove(_userNameKey);
    await prefs.remove(_userEmailKey);
    await prefs.remove(_userAvatarKey);
    await prefs.remove(_licenseKey);
    await prefs.remove(_userRoleKey);
  }

  // ==================== LICENSE METHODS ====================

  /// Check if license is verified
  Future<bool> isLicenseVerified() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_licenseVerifiedKey) ?? false;
  }

  /// Save license data
  Future<void> saveLicenseData({
    required String fullName,
    required String licenseNumber,
    required String expireDate,
    required String frontImagePath,
    required String backImagePath,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_licenseVerifiedKey, true);
    await prefs.setString(_licenseFullNameKey, fullName);
    await prefs.setString(_licenseNumberKey, licenseNumber);
    await prefs.setString(_licenseExpireDateKey, expireDate);
    await prefs.setString(_licenseFrontImageKey, frontImagePath);
    await prefs.setString(_licenseBackImageKey, backImagePath);

    // Also update the short license number for display
    final shortLicense = licenseNumber.length >= 2
        ? '****${licenseNumber.substring(licenseNumber.length - 2)}'
        : '****00';
    await prefs.setString(_licenseKey, shortLicense);
  }

  /// Get license data
  Future<Map<String, String>?> getLicenseData() async {
    final prefs = await SharedPreferences.getInstance();
    final isVerified = prefs.getBool(_licenseVerifiedKey) ?? false;

    if (!isVerified) return null;

    return {
      'fullName': prefs.getString(_licenseFullNameKey) ?? '',
      'licenseNumber': prefs.getString(_licenseNumberKey) ?? '',
      'expireDate': prefs.getString(_licenseExpireDateKey) ?? '',
      'frontImagePath': prefs.getString(_licenseFrontImageKey) ?? '',
      'backImagePath': prefs.getString(_licenseBackImageKey) ?? '',
    };
  }

  /// Clear license data
  Future<void> clearLicenseData() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_licenseVerifiedKey);
    await prefs.remove(_licenseFullNameKey);
    await prefs.remove(_licenseNumberKey);
    await prefs.remove(_licenseExpireDateKey);
    await prefs.remove(_licenseFrontImageKey);
    await prefs.remove(_licenseBackImageKey);
    await prefs.remove(_licenseKey);
  }
}
