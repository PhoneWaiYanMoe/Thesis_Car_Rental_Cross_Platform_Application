import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/screens/Auth/views/widgets/button_widget.dart';
import 'package:wiz/screens/Auth/views/widgets/social_media_widget.dart';
import 'package:wiz/screens/Auth/views/widgets/textField_widget.dart';
import 'package:wiz/utils/app_routes.dart';
import '../services/auth_service.dart';
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _authService = AuthService();
  bool _isLoading = false;
  bool _isInitialized = false;

  @override
  void initState() {
    super.initState();
    _initialize();
  }

  Future<void> _initialize() async {
    WidgetsFlutterBinding.ensureInitialized();
    setState(() => _isInitialized = true);
  }

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

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      await _authService.loginWithCredentials(_emailController.text.trim(), _passwordController.text);

      if (mounted) {
        AppRoutes.navigateAndRemoveUntil(context, AppRoutes.home);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString().replaceAll('Exception: ', '')), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!_isInitialized) {
      return Scaffold(
        backgroundColor: AppStyles.background(context),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      backgroundColor: AppStyles.background(context),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32.0),
          child: SingleChildScrollView(
            scrollDirection:  Axis.vertical,
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  const SizedBox(height: 30),
                  AppStyles.logo(context, height: 150, width: 100),
                  const SizedBox(height: 20),
                  Text('Welcome Back', style: AppStyles.h1(context)),
                  const SizedBox(height: 12),
                  Text(
                    'Log in to your account using email\nor social networks',
                    textAlign: TextAlign.center,
                    style: AppStyles.body(context),
                  ),
                //  const SizedBox(height: 48),
            
                //   // Mock credentials hint (for development only)
                //   Container(
                //     padding: const EdgeInsets.all(12),
                //     decoration: BoxDecoration(
                //       color: AppStyles.primary.withOpacity(0.1),
                //       borderRadius: BorderRadius.circular(8),
                //       border: Border.all(color: AppStyles.primary.withOpacity(0.3)),
                //     ),
                //     child: Column(
                //       crossAxisAlignment: CrossAxisAlignment.start,
                //       children: [
                //         Row(
                //           children: [
                //             Icon(Icons.info_outline, size: 16, color: AppStyles.primary),
                //             const SizedBox(width: 8),
                //             Text(
                //               'Test Credentials',
                //               style: AppStyles.caption(
                //                 context,
                //               ).copyWith(fontWeight: FontWeight.bold, color: AppStyles.primary),
                //             ),
                //           ],
                //         ),
                //         const SizedBox(height: 8),
                //         Text(
                //           'Email: jass@wiz.com\nPassword: Password1',
                //           style: AppStyles.caption(context).copyWith(fontSize: 12),
                //         ),
                //         const SizedBox(height: 4),
                //         Text(
                //           'or use: test@example.com / password123',
                //           style: AppStyles.caption(context).copyWith(fontSize: 12),
                //         ),
                //       ],
                //     ),
                //   ),
            
                  const SizedBox(height: 24),
            
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
            
                  Align(
                    alignment: Alignment.centerRight,
                    child: TextButton(
                      onPressed: () {
                        AppRoutes.navigateTo(context, AppRoutes.forgotPassword);
                      },
                      child: Text('Forgot password?', style: AppStyles.body(context)),
                    ),
                  ),
                  const SizedBox(height: 24),
            
                  // Log In Button
                  Button(text: _isLoading ? 'Logging in...' : 'Log In', enabled: !_isLoading, onPressed: _handleLogin),
                  const SizedBox(height: 24),
            
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text("First time here? ", style: AppStyles.body(context)),
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
                  Text('Or sign in with', style: AppStyles.body(context)),
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
