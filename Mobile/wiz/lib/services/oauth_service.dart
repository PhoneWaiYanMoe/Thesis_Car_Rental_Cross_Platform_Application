import 'dart:convert';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:flutter_facebook_auth/flutter_facebook_auth.dart';
import 'package:http/http.dart' as http;

class OAuthService {
  // Change to your backend URL
  // static const String baseUrl = 'http://10.0.2.2:3001'; // Android emulator
  static const String baseUrl = 'http://206.189.147.242';

  // final GoogleSignIn _googleSignIn = GoogleSignIn(scopes: ['email']);

  final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: ['email', 'profile'],
    serverClientId:
        '75426528796-o0oco2frsc5gnaomdte5rdsm33ma1lod.apps.googleusercontent.com',
  );

  Future<Map<String, dynamic>> signInWithGoogle() async {
    try {
      print('🔵 Starting Google Sign-In...');

      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
      if (googleUser == null) {
        return {'success': false, 'error': 'Cancelled'};
      }

      final GoogleSignInAuthentication googleAuth =
          await googleUser.authentication;

      print('✅ Sending to backend...');

      final response = await http.post(
        Uri.parse('$baseUrl/auth/social-login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'provider': 'google',
          'idToken': googleAuth.idToken,
          'accessToken': googleAuth.accessToken,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        print('✅ Login successful!');
        return {
          'success': true,
          'token': data['token'],
          'refreshToken': data['refreshToken'],
          'user': data['user'],
        };
      } else {
        return {'success': false, 'error': 'Login failed'};
      }
    } catch (e) {
      print('❌ Error: $e');
      return {'success': false, 'error': e.toString()};
    }
  }

  Future<Map<String, dynamic>> signInWithFacebook() async {
    try {
      print('🔵 Starting Facebook Login...');

      final LoginResult result = await FacebookAuth.instance.login();

      if (result.status == LoginStatus.success) {
        final AccessToken? accessToken = result.accessToken;

        print('✅ Sending to backend...');

        final response = await http.post(
          Uri.parse('$baseUrl/auth/social-login'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'provider': 'facebook',
            'accessToken': accessToken!.token,
          }),
        );

        if (response.statusCode == 200) {
          final data = jsonDecode(response.body);
          print('✅ Login successful!');
          return {
            'success': true,
            'token': data['token'],
            'refreshToken': data['refreshToken'],
            'user': data['user'],
          };
        }
      }

      return {'success': false, 'error': 'Login failed'};
    } catch (e) {
      print('❌ Error: $e');
      return {'success': false, 'error': e.toString()};
    }
  }

  Future<void> signOut() async {
    await _googleSignIn.signOut();
    await FacebookAuth.instance.logOut();
  }
}
