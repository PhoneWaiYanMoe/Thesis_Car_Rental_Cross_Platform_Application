import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/screens/Auth/views/widgets/button_widget.dart';
import 'package:wiz/screens/Auth/views/widgets/textField_widget.dart';
import 'package:wiz/utils/app_routes.dart';

class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});

  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _nameController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _agreedToTerms = false;

  String? _emailValidator(String? value) {
    if (value == null || value.isEmpty) return 'Email is required';
    final emailRegex = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');
    if (!emailRegex.hasMatch(value)) return 'Enter a valid email';
    return null;
  }

  String? _nameValidator(String? value) {
    if (value == null || value.isEmpty) return 'Full name is required';
    if (value.trim().split(' ').length < 2) return 'Enter full name';
    return null;
  }

  String? _passwordValidator(String? value) {
    if (value == null || value.isEmpty) return 'Password is required';
    if (value.length < 8) return 'Password must be 8+ characters';
    if (!RegExp(r'(?=.*[A-Z])').hasMatch(value)) return 'Needs 1 uppercase';
    if (!RegExp(r'(?=.*[0-9])').hasMatch(value)) return 'Needs 1 number';
    return null;
  }

  String? _confirmPasswordValidator(String? value) {
    if (value != _passwordController.text) return 'Passwords do not match';
    return _passwordValidator(value);
  }

  @override
  void dispose() {
    _emailController.dispose();
    _nameController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SingleChildScrollView(
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32.0),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  const SizedBox(height: 30),
                  AppStyles.logo(context, height: 150, width: 100),

                  const SizedBox(height: 20),
                  Text('Welcome!', style: AppStyles.h1(context)),
                  const SizedBox(height: 12),
                  Text(
                    'Sign up your account using email,\nfull name and password',
                    textAlign: TextAlign.center,
                    style: AppStyles.body(context),
                  ),
                  const SizedBox(height: 48),

                  TextFieldAuth(
                    hintText: 'Email',
                    icon: Icons.email_outlined,
                    controller: _emailController,
                    validator: _emailValidator,
                  ),
                  const SizedBox(height: 16),

                  TextFieldAuth(
                    hintText: 'Full Name',
                    icon: Icons.person_outline,
                    controller: _nameController,
                    validator: _nameValidator,
                  ),
                  const SizedBox(height: 16),

                  TextFieldAuth(
                    hintText: 'Password',
                    icon: Icons.lock_outline,
                    isPassword: true,
                    controller: _passwordController,
                    validator: _passwordValidator,
                  ),
                  const SizedBox(height: 16),

                  TextFieldAuth(
                    hintText: 'Confirm Password',
                    icon: Icons.lock_outline,
                    isPassword: true,
                    controller: _confirmPasswordController,
                    validator: _confirmPasswordValidator,
                  ),
                  const SizedBox(height: 20),

                  Row(
                    children: [
                      Checkbox(
                        value: _agreedToTerms,
                        onChanged: (v) => setState(() => _agreedToTerms = v ?? false),
                        activeColor: const Color(0xFF6C5CE7),
                      ),
                      Expanded(
                        child: Text(
                          'I have read and agreed to terms and conditions.',
                          style: AppStyles.caption(context),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  Button(
                    text: 'Sign Up',
                    enabled: _agreedToTerms,
                    onPressed: () {
                      if (_formKey.currentState!.validate() && _agreedToTerms) {
                        AppRoutes.navigateTo(context, AppRoutes.otp);
                      }
                    },
                  ),
                  const SizedBox(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text("Already have account? ", style: AppStyles.body(context)),
                      GestureDetector(
                        onTap: () {
                          AppRoutes.navigateTo(context, AppRoutes.login);
                        },
                        child: Text(
                          'Sign in',
                          style: GoogleFonts.poppins(color: const Color(0xFF6C5CE7), fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
