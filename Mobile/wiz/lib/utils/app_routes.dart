import 'package:flutter/material.dart';
import 'package:wiz/screens/Auth/views/forgot_password_screen.dart';
import 'package:wiz/screens/Auth/views/login_screen.dart';
import 'package:wiz/screens/Auth/views/otp_screen.dart';
import 'package:wiz/screens/Auth/views/password_change_screen.dart';
import 'package:wiz/screens/Auth/views/password_change_success_screen.dart';
import 'package:wiz/screens/Auth/views/signup_screen.dart';
import 'package:wiz/screens/Auth/views/splash_screen.dart';
import 'package:wiz/screens/Booking/views/booking_screen.dart';
import 'package:wiz/screens/Cars/views/car_details_screen.dart';
import 'package:wiz/screens/Cars/views/car_list_screen.dart';
import 'package:wiz/screens/Home/views/dateTime_screen.dart';
import 'package:wiz/screens/Home/views/home_screen.dart';
import 'package:wiz/screens/Home/views/location_screen.dart';

class AppRoutes {
  static const String splash = '/';
  static const String login = '/login';
  static const String signup = '/signup';
  static const String forgotPassword = '/forgot-password';
  static const String otp = '/otp';
  static const String passwordChange = '/password-change';
  static const String passwordChangeSuccess = '/password-change-success';
  static const String home = '/home';
  static const String location = '/location';
  static const String dateTime = '/datetime';
  static const String cars = '/cars';
  static const String carDetails = '/car-details';
  static const String booking = '/booking';

  static Route<dynamic>? onGenerateRoute(RouteSettings settings) {
    switch (settings.name) {
      case splash:
        return MaterialPageRoute(builder: (_) => SplashScreen());
      case login:
        return MaterialPageRoute(builder: (_) => const LoginScreen());
      case signup:
        return MaterialPageRoute(builder: (_) => const SignupScreen());
      case forgotPassword:
        return MaterialPageRoute(builder: (_) => const ForgotPasswordScreen());
      case otp:
        return MaterialPageRoute(builder: (_) => const OtpVerificationScreen());
      case passwordChange:
        return MaterialPageRoute(builder: (_) => const PasswordChangeScreen());
      case passwordChangeSuccess:
        return MaterialPageRoute(builder: (_) => const PasswordChangeSuccessScreen());
      case home:
        return MaterialPageRoute(builder: (_) => const HomeScreen());
      case dateTime:
        return MaterialPageRoute(builder: (_) => const DateTimeScreen());
      case location:
        final args = settings.arguments as String?;
        return MaterialPageRoute(builder: (_) => LocationScreen(title: args ?? 'Select Location'));

      case cars:
        final args = settings.arguments as Map<String, dynamic>?;
        return MaterialPageRoute(builder: (_) => CarListScreen(tripData: args ?? {}));

      case carDetails:
        final args = settings.arguments as Map<String, dynamic>?;
        if (args != null && args.containsKey('carIndex')) {
          return MaterialPageRoute(builder: (_) => CarDetailsScreen(arguments: args));
        }
        return null;

      case booking:
        final args = settings.arguments as Map<String, dynamic>?;
        if (args != null) {
          return MaterialPageRoute(builder: (_) => BookingScreen(arguments: args));
        }
        return null;

      default:
        return null;
    }
  }

  static Future<dynamic> navigateTo(BuildContext context, String routeName, {Object? arguments}) {
    return Navigator.pushNamed(context, routeName, arguments: arguments);
  }

  static void navigateAndReplace(BuildContext context, String routeName, {Object? arguments}) {
    Navigator.pushReplacementNamed(context, routeName, arguments: arguments);
  }

  static void navigateAndRemoveUntil(BuildContext context, String routeName, {Object? arguments}) {
    Navigator.pushNamedAndRemoveUntil(context, routeName, (route) => false, arguments: arguments);
  }
}
