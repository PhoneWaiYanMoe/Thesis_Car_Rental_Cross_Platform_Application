// lib/utils/app_routes.dart
// ✅ FIXED: Updated PhotoSubmissionScreen to pass bookingId instead of booking object

import 'package:flutter/material.dart';
import 'package:wiz/screens/Auth/views/forgot_password_screen.dart';
import 'package:wiz/screens/Auth/views/login_screen.dart';
import 'package:wiz/screens/Auth/views/otp_screen.dart';
import 'package:wiz/screens/Auth/views/password_change_screen.dart';
import 'package:wiz/screens/Auth/views/password_change_success_screen.dart';
import 'package:wiz/screens/Auth/views/signup_screen.dart';
import 'package:wiz/screens/Auth/views/splash_screen.dart';
import 'package:wiz/screens/Booking/views/booking_screen.dart';
import 'package:wiz/screens/Booking/views/photo_submission_screen.dart';
import 'package:wiz/screens/Booking/views/rate_review_screen.dart';
import 'package:wiz/screens/Booking/views/rental_details_screen.dart';
import 'package:wiz/screens/Booking/views/rental_history_screen.dart';
import 'package:wiz/screens/Booking/models/booking_data.dart';
import 'package:wiz/screens/Cars/views/car_details_screen.dart';
import 'package:wiz/screens/Cars/views/car_list_screen.dart';
import 'package:wiz/screens/Cars/views/fav_cars_screen.dart';
import 'package:wiz/screens/Chat/models/chat_data.dart';
import 'package:wiz/screens/Chat/views/chat_detail_screen.dart';
import 'package:wiz/screens/Chat/views/chat_list_screen.dart';
import 'package:wiz/screens/Home/views/dateTime_screen.dart';
import 'package:wiz/screens/Home/views/home_screen.dart';
import 'package:wiz/screens/Location/views/location_search_screen.dart';
import 'package:wiz/screens/Location/views/map_screen.dart';
import 'package:wiz/screens/Owner/views/owner_booking_screen.dart';
import 'package:wiz/screens/Payment/views/stripe_payment_screen.dart';
import 'package:wiz/screens/Profile/profile_screen.dart';
import 'package:wiz/screens/Settings/views/license_upload_screen.dart';
import 'package:wiz/screens/Owner/views/owner_vehicles_screen.dart';
import 'package:wiz/screens/Owner/views/create_vehicle_screen.dart';
import 'package:wiz/screens/Owner/views/owner_vehicle_details_screen.dart';
import 'package:wiz/screens/Owner/views/edit_vehicle_screen.dart';
import 'package:wiz/screens/Analytics/views/analytics_home_screen.dart';

class AppRoutes {
  static const String splash = '/';
  static const String login = '/login';
  static const String signup = '/signup';
  static const String forgotPassword = '/forgot-password';
  static const String otp = '/otp';
  static const String passwordChange = '/password-change';
  static const String passwordChangeSuccess = '/password-change-success';
  static const String home = '/home';
  static const String map = '/map';
  static const String locationSearch = '/location-search';
  static const String dateTime = '/datetime';
  static const String cars = '/cars';
  static const String carDetails = '/car-details';
  static const String booking = '/booking';
  static const String licenseUpload = '/license-upload';
  static const String profile = '/profile';
  static const String rentalHistory = '/rental-history';
  static const String photoSubmission = '/photo-submission';
  static const String rentalDetails = '/rental-details';
  static const String rateReview = '/rate-review';
  static const String chatList = '/chat-list';
  static const String chatDetail = '/chat-detail';
  static const String stripePayment = '/stripe-payment';
  static const String favoriteCars = '/favorite-cars';

  // Owner routes
  static const String ownerVehicles = '/owner/vehicles';
  static const String ownerVehicleCreate = '/owner/vehicles/create';
  static const String ownerVehicleDetails = '/owner/vehicles/details';
  static const String ownerVehicleEdit = '/owner/vehicles/edit';
  static const String ownerBookings = '/owner/bookings';

  static const String analytics = '/analytics';

  static Route<dynamic>? onGenerateRoute(RouteSettings settings) {
    switch (settings.name) {
      case analytics:
        return MaterialPageRoute(builder: (_) => const AnalyticsHomeScreen());
      case splash:
        return MaterialPageRoute(builder: (_) => SplashScreen());
      case login:
        return MaterialPageRoute(builder: (_) => const LoginScreenBloc());
      case signup:
        return MaterialPageRoute(builder: (_) => const SignupScreenBloc());
      case forgotPassword:
        return MaterialPageRoute(
          builder: (_) => const ForgotPasswordScreenBloc(),
        );
      case otp:
        final args = settings.arguments as Map<String, dynamic>?;
        return MaterialPageRoute(
          builder: (_) => OtpVerificationScreenBloc(arguments: args),
        );
      case passwordChange:
        final args = settings.arguments as Map<String, dynamic>?;
        return MaterialPageRoute(
          builder: (_) => PasswordChangeScreenBloc(arguments: args),
        );
      case passwordChangeSuccess:
        return MaterialPageRoute(
          builder: (_) => const PasswordChangeSuccessScreen(),
        );
      case home:
        return MaterialPageRoute(builder: (_) => const HomeScreen());
      case dateTime:
        return MaterialPageRoute(builder: (_) => const DateTimeScreen());
      case map:
        final args = settings.arguments as String?;
        return MaterialPageRoute(
          builder: (_) => MapScreen(title: args ?? 'Select Location'),
        );

      case locationSearch:
        final args = settings.arguments as String?;
        return MaterialPageRoute(
          builder: (_) =>
              LocationSearchScreen(title: args ?? 'Search Location'),
        );

      case cars:
        final args = settings.arguments as Map<String, dynamic>?;
        return MaterialPageRoute(
          builder: (_) => CarListScreen(tripData: args ?? {}),
        );
      case favoriteCars:
        return MaterialPageRoute(builder: (_) => const FavoriteCarsScreen());

      case carDetails:
        final args = settings.arguments as Map<String, dynamic>?;
        if (args != null && args.containsKey('car')) {
          return MaterialPageRoute(
            builder: (_) => CarDetailsScreen(arguments: args),
          );
        }
        return null;

      case booking:
        final args = settings.arguments as Map<String, dynamic>?;
        if (args != null) {
          return MaterialPageRoute(
            builder: (_) => BookingScreen(arguments: args),
          );
        }
        return null;

      case stripePayment:
        final args = settings.arguments as Map<String, dynamic>?;
        if (args != null &&
            args.containsKey('bookingId') &&
            args.containsKey('paymentType') &&
            args.containsKey('amount')) {
          return MaterialPageRoute(
            builder: (_) => StripePaymentScreen(
              bookingId: args['bookingId'] as String,
              paymentType: args['paymentType'] as String,
              amount: args['amount'] as int,
            ),
          );
        }
        return null;

      case licenseUpload:
        final args = settings.arguments as Map<String, dynamic>?;
        return MaterialPageRoute(
          builder: (_) => LicenseUploadScreen(
            fromBooking: args?['fromBooking'] ?? false,
            bookingArguments: args?['bookingArguments'],
          ),
        );
      case profile:
        return MaterialPageRoute(builder: (_) => const ProfileScreen());
      case rentalHistory:
        return MaterialPageRoute(builder: (_) => const RentalHistoryScreen());

      // ✅ FIXED: Pass bookingId instead of booking object
      case photoSubmission:
        final args = settings.arguments as Map<String, dynamic>?;
        if (args != null &&
            args.containsKey('bookingId') &&
            args.containsKey('isStartJourney')) {
          final bookingId = args['bookingId'] as String;
          final isStartJourney = args['isStartJourney'] as bool;
          return MaterialPageRoute(
            builder: (_) => PhotoSubmissionScreen(
              bookingId: bookingId,
              isStartJourney: isStartJourney,
            ),
          );
        }
        return null;

      case rentalDetails:
        final args = settings.arguments as Map<String, dynamic>?;
        if (args != null && args.containsKey('bookingId')) {
          final bookingId = args['bookingId'] as String;
          return MaterialPageRoute(
            builder: (_) => RentalDetailsScreen(bookingId: bookingId),
          );
        }
        return null;

      case rateReview:
        final args = settings.arguments as Map<String, dynamic>?;
        if (args != null &&
            args.containsKey('bookingId') &&
            args.containsKey('vehicleId') &&
            args.containsKey('vehicleName')) {
          return MaterialPageRoute(
            builder: (_) => RateReviewScreen(
              bookingId: args['bookingId'] as String,
              vehicleId: args['vehicleId'] as String,
              vehicleName: args['vehicleName'] as String,
              ownerId: args['ownerId'] as String?,
            ),
          );
        }
        return null;

      case chatList:
        return MaterialPageRoute(builder: (_) => const ChatListScreen());

      case chatDetail:
        final args = settings.arguments as Map<String, dynamic>?;
        if (args != null && args.containsKey('chat')) {
          final chat = args['chat'] is ChatData
              ? args['chat'] as ChatData
              : throw ArgumentError('Invalid chat data');
          return MaterialPageRoute(
            builder: (_) => ChatDetailScreen(chat: chat),
          );
        }
        return null;

      // Owner routes
      case ownerVehicles:
        return MaterialPageRoute(builder: (_) => const OwnerVehiclesScreen());

      case ownerVehicleCreate:
        return MaterialPageRoute(builder: (_) => const CreateVehicleScreen());

      case ownerVehicleDetails:
        final vehicleId = settings.arguments as String?;
        if (vehicleId != null) {
          return MaterialPageRoute(
            builder: (_) => OwnerVehicleDetailsScreen(vehicleId: vehicleId),
          );
        }
        return null;

      case ownerVehicleEdit:
        final vehicleId = settings.arguments as String?;
        if (vehicleId != null) {
          return MaterialPageRoute(
            builder: (_) => EditVehicleScreen(vehicleId: vehicleId),
          );
        }
        return null;
      case ownerBookings:
        return MaterialPageRoute(builder: (_) => OwnerBookingsScreen());

      default:
        return null;
    }
  }

  static Future<dynamic> navigateTo(
    BuildContext context,
    String routeName, {
    Object? arguments,
  }) {
    return Navigator.pushNamed(context, routeName, arguments: arguments);
  }

  static Future<dynamic> navigateToFavoriteCars(BuildContext context) {
    return Navigator.pushNamed(context, favoriteCars);
  }

  static void navigateAndReplace(
    BuildContext context,
    String routeName, {
    Object? arguments,
  }) {
    Navigator.pushReplacementNamed(context, routeName, arguments: arguments);
  }

  static void navigateAndRemoveUntil(
    BuildContext context,
    String routeName, {
    Object? arguments,
  }) {
    Navigator.pushNamedAndRemoveUntil(
      context,
      routeName,
      (route) => false,
      arguments: arguments,
    );
  }

  static Future<dynamic> navigateToRentalDetails(
    BuildContext context,
    String bookingId,
  ) {
    return Navigator.pushNamed(
      context,
      rentalDetails,
      arguments: {'bookingId': bookingId},
    );
  }

  // ✅ FIXED: Pass bookingId instead of BookingData object
  static Future<BookingData?> navigateToPhotoSubmission(
    BuildContext context,
    String bookingId,
    bool isStartJourney,
  ) {
    return Navigator.pushNamed<BookingData>(
      context,
      photoSubmission,
      arguments: {'bookingId': bookingId, 'isStartJourney': isStartJourney},
    );
  }

  static Future<dynamic> navigateToRateReview(
    BuildContext context, {
    required String bookingId,
    required String vehicleId,
    required String vehicleName,
    String? ownerId,
  }) {
    return Navigator.pushNamed(
      context,
      rateReview,
      arguments: {
        'bookingId': bookingId,
        'vehicleId': vehicleId,
        'vehicleName': vehicleName,
        'ownerId': ownerId,
      },
    );
  }

  static Future<dynamic> navigateToChatDetail(
    BuildContext context,
    ChatData chat,
  ) {
    return Navigator.pushNamed(context, chatDetail, arguments: {'chat': chat});
  }
}
