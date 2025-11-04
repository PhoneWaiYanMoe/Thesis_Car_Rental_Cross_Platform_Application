import 'package:flutter/material.dart';
import 'package:wiz/screens/Auth/views/forgot_password_screen.dart';
import 'package:wiz/screens/Auth/views/login_screen.dart';
import 'package:wiz/screens/Auth/views/otp_screen.dart';
import 'package:wiz/screens/Auth/views/password_change_screen.dart';
import 'package:wiz/screens/Auth/views/password_change_success_screen.dart';
import 'package:wiz/screens/Auth/views/signup_screen.dart';
import 'package:wiz/screens/Auth/views/splash_screen.dart';

class AppRoutes {
  // Route names as constants
  static const String splash = '/';
  static const String welcome = '/welcome';

  static const String login = '/login';
  static const String signup = '/signup';
  static const String forgotPassword = '/forgot-password';
  static const String otp = '/otp';
  static const String passwordChange = '/password-change';
  static const String passwordChangeSuccess = '/password-change-success';

  // Generate routes - central routing logic
  static Route<dynamic> generateRoute(RouteSettings settings) {
    switch (settings.name) {
      case splash:
        return MaterialPageRoute(builder: (_) => SplashScreen(), settings: settings);

      case login:
        return MaterialPageRoute(builder: (_) => LoginScreen(), settings: settings);

      case signup:
        return MaterialPageRoute(builder: (_) => SignupScreen(), settings: settings);
      case forgotPassword:
        return MaterialPageRoute(builder: (_) => ForgotPasswordScreen(), settings: settings);
      case otp:
        return MaterialPageRoute(builder: (_) => OtpVerificationScreen(), settings: settings);

      case passwordChange:
        return MaterialPageRoute(builder: (_) => PasswordChangeScreen(), settings: settings);
      case passwordChangeSuccess:
        return MaterialPageRoute(builder: (_) => PasswordChangeSuccessScreen(), settings: settings);

      // 404 - Route not found
      default:
        return MaterialPageRoute(
          builder: (_) => Scaffold(
            appBar: AppBar(title: const Text('404')),
            body: const Center(child: Text('Page not found')),
          ),
          settings: settings,
        );
    }
  }

  // Navigate to a route
  static Future<T?> navigateTo<T>(BuildContext context, String routeName, {Object? arguments}) {
    return Navigator.pushNamed<T>(context, routeName, arguments: arguments);
  }

  // Navigate and replace current route
  static Future<T?> navigateAndReplace<T>(BuildContext context, String routeName, {Object? arguments}) {
    return Navigator.pushReplacementNamed<T, Object?>(context, routeName, arguments: arguments);
  }

  // Navigate and remove all previous routes
  static Future<T?> navigateAndRemoveUntil<T>(BuildContext context, String routeName, {Object? arguments}) {
    return Navigator.pushNamedAndRemoveUntil<T>(context, routeName, (route) => false, arguments: arguments);
  }

  // Go back
  static void goBack(BuildContext context, {Object? result}) {
    Navigator.pop(context, result);
  }

  // Navigate to splash (useful for logout or restart)
  static Future<void> navigateToSplashAndClear(BuildContext context) {
    return navigateAndRemoveUntil(context, splash);
  }
}
