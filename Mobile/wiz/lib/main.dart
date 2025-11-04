import 'package:flutter/material.dart';
import 'package:wiz/screens/Auth/views/password_change_success_screen.dart';
import 'package:wiz/screens/Auth/views/splash_screen.dart';
import 'package:wiz/utils/app_routes.dart';

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: SplashScreen(),
      debugShowCheckedModeBanner: false,
      onGenerateRoute: AppRoutes.generateRoute,
      initialRoute: AppRoutes.splash,
    );
  }
}
