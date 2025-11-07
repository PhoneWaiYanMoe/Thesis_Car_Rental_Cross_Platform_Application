import 'package:flutter/material.dart';
import 'package:wiz/screens/Auth/views/splash_screen.dart';
import 'package:wiz/screens/Home/views/home_screen.dart';
import 'package:wiz/utils/app_routes.dart';
import 'package:wiz/constants/app_styles.dart';

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: HomeScreen(),
      debugShowCheckedModeBanner: false,
      onGenerateRoute: AppRoutes.generateRoute,
      theme: AppStyles.lightTheme,
      darkTheme: AppStyles.darkTheme,
      themeMode: ThemeMode.dark,
      initialRoute: AppRoutes.splash,
    );
  }
}
