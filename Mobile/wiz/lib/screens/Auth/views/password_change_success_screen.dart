import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/screens/Auth/views/widgets/button_widget.dart';
import 'package:wiz/utils/app_routes.dart';
import 'login_screen.dart';

class PasswordChangeSuccessScreen extends StatelessWidget {
  const PasswordChangeSuccessScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32.0),
          child: Column(
            children: [
              const Spacer(),

              Image.asset('assets/images/success.png', width: 220, height: 220),

              const SizedBox(height: 40),

              Text(
                'Congratulations!',
                style: AppStyles.h1,
                textAlign: TextAlign.center,
              ),

              const SizedBox(height: 16),

              Text(
                'your password has changed',
                style: GoogleFonts.poppins(fontSize: 18, color: Colors.black87),
                textAlign: TextAlign.center,
              ),

              const SizedBox(height: 12),

              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                child: Text(
                  'Please make sure that you can remember your password this time! And don’t worry,\nWe’ve got your back!',
                  style: GoogleFonts.poppins(fontSize: 15, color: Colors.black54, height: 1.5),
                  textAlign: TextAlign.center,
                ),
              ),

              const SizedBox(height: 48),

              Button(
                text: 'Back to Log in',
                onPressed: () {
                  AppRoutes.navigateTo(context, AppRoutes.login);
                },
              ),

              const Spacer(),
            ],
          ),
        ),
      ),
    );
  }
}
