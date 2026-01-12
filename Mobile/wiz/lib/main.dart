// lib/main.dart
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:wiz/screens/Auth/views/splash_screen.dart';
import 'package:wiz/utils/app_routes.dart';
import 'package:flutter_stripe/flutter_stripe.dart';
import 'package:wiz/constants/app_styles.dart';
import 'screens/Auth/controllers/auth_bloc.dart';
import 'screens/Auth/services/auth_api_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Stripe with publishable key
  // Make sure this key matches the secret key used on the backend
  // Initialize Stripe with proper error handling
  try {
    Stripe.publishableKey =
        'pk_test_51SlqPy7Yiz5vmRGUkbDBRayGcd7kYmalk5MhgysKpYRWADH9lMc1NzTSl6vBPYOrfSAKpXMJ3ITYVIYl7qPvu6EQ00D2FEJPlE';

    // Set merchant details
    await Stripe.instance.applySettings();

    print('✅ Stripe initialized successfully');
  } catch (e) {
    print('❌ Stripe initialization error: $e');
  }

  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [BlocProvider(create: (context) => AuthBloc(apiService: AuthApiService()))],
      child: MaterialApp(
        home: SplashScreen(),
        debugShowCheckedModeBanner: false,
        onGenerateRoute: AppRoutes.onGenerateRoute,
        theme: AppStyles.lightTheme,
        darkTheme: AppStyles.darkTheme,
        themeMode: ThemeMode.dark,
        initialRoute: AppRoutes.splash,
      ),
    );
  }
}
