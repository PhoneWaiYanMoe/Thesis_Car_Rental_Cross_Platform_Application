// lib/services/auth_service.dart
import 'package:shared_preferences/shared_preferences.dart';

class AuthService {
  static const String _tokenKey = 'auth_token';
  static const String _userIdKey = 'user_id';
  static const String _userNameKey = 'user_name';
  static const String _userEmailKey = 'user_email';
  static const String _userAvatarKey = 'user_avatar';
  static const String _licenseKey = 'license_number';

  // Sample token for testing
  static const String sampleToken = 'sample_jwt_token_12345';

  // Mock user credentials for testing
  static const Map<String, String> mockUsers = {
    'test@example.com': 'password123',
    'jass@wiz.com': 'Password1',
    'demo@test.com': 'Demo@123',
  };

  // Validate mock credentials
  Future<bool> validateCredentials(String email, String password) async {
    // Simulate network delay
    await Future.delayed(const Duration(seconds: 1));

    return mockUsers.containsKey(email) && mockUsers[email] == password;
  }

  // Save token and user info
  Future<void> saveAuthData({
    required String token,
    required String userId,
    required String userName,
    required String userEmail,
    String? userAvatar,
    String? licenseNumber,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
    await prefs.setString(_userIdKey, userId);
    await prefs.setString(_userNameKey, userName);
    await prefs.setString(_userEmailKey, userEmail);
    if (userAvatar != null) await prefs.setString(_userAvatarKey, userAvatar);
    if (licenseNumber != null) await prefs.setString(_licenseKey, licenseNumber);
  }

  // Get token
  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  // Get user info
  Future<Map<String, String?>> getUserInfo() async {
    final prefs = await SharedPreferences.getInstance();
    return {
      'userId': prefs.getString(_userIdKey),
      'userName': prefs.getString(_userNameKey),
      'userEmail': prefs.getString(_userEmailKey),
      'userAvatar': prefs.getString(_userAvatarKey),
      'licenseNumber': prefs.getString(_licenseKey),
    };
  }

  // Check if user is logged in
  Future<bool> isLoggedIn() async {
    final token = await getToken();
    return token != null && token.isNotEmpty;
  }

  // Clear auth data (logout)
  Future<void> clearAuthData() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_userIdKey);
    await prefs.remove(_userNameKey);
    await prefs.remove(_userEmailKey);
    await prefs.remove(_userAvatarKey);
    await prefs.remove(_licenseKey);
  }

  // Sample login for testing
  Future<Map<String, dynamic>> loginWithCredentials(String email, String password) async {
    // Validate credentials
    final isValid = await validateCredentials(email, password);

    if (!isValid) {
      throw Exception('Invalid email or password');
    }

    // Mock user data based on email
    final userData = {
      'token': sampleToken,
      'userId': 'user_001',
      'userName': email == 'jass@wiz.com' ? 'Jass Myatt' : 'Test User',
      'userEmail': email,
      'userAvatar': 'assets/images/article_2.png',
      'licenseNumber': '****54',
    };

    await saveAuthData(
      token: userData['token'] as String,
      userId: userData['userId'] as String,
      userName: userData['userName'] as String,
      userEmail: userData['userEmail'] as String,
      userAvatar: userData['userAvatar'] as String,
      licenseNumber: userData['licenseNumber'] as String,
    );

    return userData;
  }

  Future<void> loginWithSampleData() async {
    await loginWithCredentials('jass@wiz.com', 'Password1');
  }
}
