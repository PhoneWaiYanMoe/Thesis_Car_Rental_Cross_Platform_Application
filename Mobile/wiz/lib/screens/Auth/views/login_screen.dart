import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/screens/Auth/views/widgets/button_widget.dart';
import 'package:wiz/screens/Auth/views/widgets/social_media_widget.dart';
import 'package:wiz/screens/Auth/views/widgets/textField_widget.dart';
import 'package:wiz/utils/app_routes.dart';
import '../controllers/auth_bloc.dart';
import '../controllers/auth_event.dart';
import '../controllers/auth_state.dart';

class LoginScreenBloc extends StatefulWidget {
  const LoginScreenBloc({super.key});

  @override
  State<LoginScreenBloc> createState() => _LoginScreenBlocState();
}

class _LoginScreenBlocState extends State<LoginScreenBloc> {
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

  void _handleLogin() {
    if (!_formKey.currentState!.validate()) return;

    context.read<AuthBloc>().add(
      LoginRequested(email: _emailController.text.trim(), password: _passwordController.text),
    );
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppStyles.background(context),
      body: BlocListener<AuthBloc, AuthState>(
        listener: (context, state) {
          if (state is LoginSuccess || state is Authenticated) {
            // Navigate to home on success
            AppRoutes.navigateAndRemoveUntil(context, AppRoutes.home);
          } else if (state is AuthError) {
            // Show error message
            ScaffoldMessenger.of(
              context,
            ).showSnackBar(SnackBar(content: Text(state.message), backgroundColor: Colors.red));
          }
        },
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32.0),
            child: SingleChildScrollView(
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

                    // Log In Button with BLoC state
                    BlocBuilder<AuthBloc, AuthState>(
                      builder: (context, state) {
                        final isLoading = state is AuthLoading;
                        return Button(
                          text: isLoading ? 'Logging in...' : 'Log In',
                          enabled: !isLoading,
                          onPressed: _handleLogin,
                        );
                      },
                    ),
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
                            ScaffoldMessenger.of(
                              context,
                            ).showSnackBar(const SnackBar(content: Text('Google login not implemented yet')));
                          },
                        ),
                        const SizedBox(width: 16),
                        SocialMediaWidget(
                          imagePath: 'assets/logo/facebook.png',
                          onPressed: () {
                            ScaffoldMessenger.of(
                              context,
                            ).showSnackBar(const SnackBar(content: Text('Facebook login not implemented yet')));
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
      ),
    );
  }
}
