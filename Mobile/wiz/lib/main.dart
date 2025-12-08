// lib/main.dart
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:wiz/screens/Auth/views/splash_screen.dart';
import 'package:wiz/utils/app_routes.dart';
import 'package:wiz/constants/app_styles.dart';
import 'screens/Auth/controllers/auth_bloc.dart';
import 'screens/Auth/services/auth_api_service.dart';

void main() {
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
