import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/services/local_storage_service.dart';
import 'package:wiz/utils/app_routes.dart';
import '../services/auth_api_service.dart';

class SplashScreen extends StatefulWidget {
  @override
  _SplashScreenState createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  late Animation<double> _scaleAnimation;
  final _localStorageService = LocalStorageService();

  @override
  void initState() {
    super.initState();

    _controller = AnimationController(vsync: this, duration: const Duration(seconds: 2));

    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeIn));

    _scaleAnimation = Tween<double>(
      begin: 0.8,
      end: 1.1,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOut));

    _controller.forward();

    _checkAuthAndNavigate();
  }

  Future<void> _checkAuthAndNavigate() async {
    // Wait for animation to complete
    await Future.delayed(const Duration(seconds: 3));

    if (!mounted) return;

    try {
      // Check if user is already logged in
      final isLoggedIn = await _localStorageService.isLoggedIn();

      if (!mounted) return;

      if (isLoggedIn) {
        // User is logged in, go to home
        AppRoutes.navigateAndReplace(context, AppRoutes.home);
      } else {
        // User is not logged in, go to login
        AppRoutes.navigateAndReplace(context, AppRoutes.login);
      }
    } catch (e) {
      // On error, go to login
      if (mounted) {
        AppRoutes.navigateAndReplace(context, AppRoutes.login);
      }
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppStyles.darkBackground,
      body: Center(
        child: FadeTransition(
          opacity: _fadeAnimation,
          child: ScaleTransition(scale: _scaleAnimation, child: Image.asset('assets/logo/Logo_Wiz.png', width: 200)),
        ),
      ),
    );
  }
}
