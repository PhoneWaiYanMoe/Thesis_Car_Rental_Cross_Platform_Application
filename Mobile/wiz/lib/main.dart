// lib/main.dart
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:wiz/screens/Auth/views/splash_screen.dart';
import 'package:wiz/utils/app_routes.dart';
import 'package:flutter_stripe/flutter_stripe.dart';
import 'package:wiz/constants/app_styles.dart';
import 'screens/Auth/controllers/auth_bloc.dart';
import 'screens/Auth/services/auth_api_service.dart';

// Global theme notifier — accessible anywhere in the app
final themeNotifier = ValueNotifier<ThemeMode>(ThemeMode.dark);

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  try {
    Stripe.publishableKey =
        'pk_test_51SlqPy7Yiz5vmRGUkbDBRayGcd7kYmalk5MhgysKpYRWADH9lMc1NzTSl6vBPYOrfSAKpXMJ3ITYVIYl7qPvu6EQ00D2FEJPlE';
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
      child: ValueListenableBuilder<ThemeMode>(
        valueListenable: themeNotifier,
        builder: (context, themeMode, _) {
          return MaterialApp(
            home: SplashScreen(),
            debugShowCheckedModeBanner: false,
            onGenerateRoute: AppRoutes.onGenerateRoute,
            theme: AppStyles.lightTheme,
            darkTheme: AppStyles.darkTheme,
            themeMode: themeMode,
            initialRoute: AppRoutes.splash,
          );
        },
      ),
    );
  }
}
