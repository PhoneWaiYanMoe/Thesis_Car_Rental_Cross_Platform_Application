import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/screens/Auth/views/widgets/button_widget.dart';
import 'package:wiz/screens/Auth/views/widgets/social_media_widget.dart';
import 'package:wiz/screens/Auth/views/widgets/textField_widget.dart';
import 'package:wiz/utils/app_routes.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  // Validation
  String? _emailValidator(String? value) {
    if (value == null || value.isEmpty) return 'Email is required';
    final emailRegex = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');
    if (!emailRegex.hasMatch(value)) return 'Enter a valid email';
    return null;
  }

  String? _passwordValidator(String? value) {
    if (value == null || value.isEmpty) return 'Password is required';
    if (value.length < 6) return 'Password too short';
    return null;
  }

  @override
  void dispose() {
    _formKey.currentState?.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppStyles.background,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                const SizedBox(height: 30),

                Image.asset('assets/logo/Logo_Wiz.png', height: 150),

                const SizedBox(height: 20),

                Text('Welcome Back', style: AppStyles.h1),

                const SizedBox(height: 12),

                Text(
                  'Log in to your account using email\nor social networks',
                  textAlign: TextAlign.center,
                  style: AppStyles.body.copyWith( color: Colors.black54),
                ),

                const SizedBox(height: 48),

                // Email
                TextFieldAuth(
                  hintText: 'Email',
                  icon: Icons.email_outlined,
                  controller: _emailController,
                  validator: _emailValidator,
                ),

                const SizedBox(height: 16),

                // Password
                TextFieldAuth(
                  hintText: 'Password',
                  icon: Icons.lock_outline,
                  isPassword: true,
                  controller: _passwordController,
                  validator: _passwordValidator,
                ),

                const SizedBox(height: 12),

                // Forgot Password
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: () {
                      AppRoutes.navigateTo(context, AppRoutes.forgotPassword);
                    },
                    child: Text(
                      'Forgot password?',
                      style: GoogleFonts.poppins(color: const Color(0xFF6C5CE7), fontWeight: FontWeight.w500),
                    ),
                  ),
                ),

                const SizedBox(height: 24),

                // Log In Button
                Button(
                  text: 'Log In',
                  onPressed: () {
                    if (_formKey.currentState!.validate()) {
                      final email = _emailController.text;
                      final password = _passwordController.text;
                      print('Login: $email');
                      // TODO: Call login API
                    }
                  },
                ),

                const SizedBox(height: 24),

                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text("First time here? ", style: GoogleFonts.poppins(color: Colors.black54)),
                    GestureDetector(
                      onTap: () {
                        AppRoutes.navigateTo(context, AppRoutes.signup);
                      },
                      child: Text(
                        'Sign up',
                        style: GoogleFonts.poppins(color: const Color(0xFF6C5CE7), fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 40),

                Text('Or sign in with', style: GoogleFonts.poppins(color: Colors.black54)),

                const SizedBox(height: 20),

                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    SocialMediaWidget(
                      imagePath: 'assets/logo/google.png',
                      onPressed: () {
                        print('Google login');
                      },
                    ),
                    const SizedBox(width: 16),
                    SocialMediaWidget(
                      imagePath: 'assets/logo/facebook.png',
                      onPressed: () {
                        print('Facebook login');
                      },
                    ),
                  ],
                ),

                const Spacer(),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
