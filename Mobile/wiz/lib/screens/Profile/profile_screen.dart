import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/screens/Auth/services/auth_api_service.dart';
import 'package:wiz/services/local_storage_service.dart';
import 'package:wiz/utils/app_routes.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _localStorageService = LocalStorageService();
  String _userName = '';
  String _userEmail = '';
  String _userAvatar = '';
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadUserInfo();
  }

  Future<void> _loadUserInfo() async {
    final userInfo = await _localStorageService.getUserInfo();
    setState(() {
      _userName = userInfo['userName'] ?? 'Guest';
      _userEmail = userInfo['userEmail'] ?? '';
      _userAvatar = userInfo['userAvatar'] ?? 'assets/images/article_2.png';
    });
  }

  Future<void> _handleLogout() async {
    setState(() => _isLoading = true);

    try {
      await _localStorageService.clearAuthData();

      if (!mounted) return;

      AppRoutes.navigateAndRemoveUntil(context, AppRoutes.login);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error logging out: ${e.toString()}'), backgroundColor: Colors.red));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppStyles.background(context),
      appBar: AppBar(
        title: Text('Profile', style: AppStyles.h2(context)),
        centerTitle: true,
        backgroundColor: AppStyles.background(context),
        elevation: 0,
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // User Avatar
              CircleAvatar(
                radius: 60,
                backgroundImage: AssetImage(_userAvatar),
                onBackgroundImageError: (_, __) {},
                child: _userAvatar.isEmpty ? const Icon(Icons.person, size: 60) : null,
              ),
              const SizedBox(height: 24),

              // User Name
              Text(_userName, style: AppStyles.h1(context)),
              const SizedBox(height: 8),

              // User Email
              Text(_userEmail, style: AppStyles.body(context)),
              const SizedBox(height: 48),

              // Logout Button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  style: AppStyles.primaryButtonStyle(
                    context,
                  ).copyWith(backgroundColor: MaterialStateProperty.all(Colors.red)),
                  onPressed: _isLoading ? null : _handleLogout,
                  icon: _isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                        )
                      : const Icon(Icons.logout),
                  label: Text(_isLoading ? 'Logging out...' : 'Logout', style: AppStyles.button),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
