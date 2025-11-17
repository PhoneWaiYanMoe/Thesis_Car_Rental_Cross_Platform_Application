import 'package:flutter/material.dart';
import 'package:wiz/screens/Auth/views/forgot_password_screen.dart';
import 'package:wiz/screens/Auth/views/login_screen.dart';
import 'package:wiz/screens/Auth/views/otp_screen.dart';
import 'package:wiz/screens/Auth/views/password_change_screen.dart';
import 'package:wiz/screens/Auth/views/password_change_success_screen.dart';
import 'package:wiz/screens/Auth/views/signup_screen.dart';
import 'package:wiz/screens/Auth/views/splash_screen.dart';
import 'package:wiz/screens/Cars/views/car_details_screen.dart';
import 'package:wiz/screens/Cars/views/car_list_screen.dart';
import 'package:wiz/screens/Home/views/home_screen.dart';
import 'package:wiz/screens/Home/views/location_screen.dart';

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
  static const String home = '/home';
  static const String cars = '/cars';
  static const String carDetails = '/car-details';
  static const String location = '/location';

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

      case home:
        return MaterialPageRoute(builder: (_) => HomeScreen(), settings: settings);

      case location:
        final title = settings.arguments as String;
        return MaterialPageRoute(builder: (_) => LocationScreen(title: title,), settings: settings);
        
      case cars:
        final tripData = settings.arguments as Map<String, dynamic>?;
        if (tripData == null) {
          return MaterialPageRoute(
            builder: (_) => const Scaffold(body: Center(child: Text('Error: No trip data'))),
          );
        }
        return MaterialPageRoute(
          builder: (_) => CarListScreen(tripData: tripData),
          settings: settings,
        );

      case carDetails:
        final args = settings.arguments as Map<String, dynamic>;
        final car = args['car'] as Map<String, dynamic>;
        final tripData = args['tripData'] as Map<String, dynamic>;
        return _pageRoute(() => CarDetailsScreen(car: car, tripData: tripData), settings);

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

  static MaterialPageRoute _pageRoute(Widget Function() builder, RouteSettings settings) {
    return MaterialPageRoute(builder: (_) => builder(), settings: settings);
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
