// lib/screens/Auth/views/forgot_password_screen_bloc.dart
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/screens/Auth/views/widgets/button_widget.dart';
import 'package:wiz/screens/Auth/views/widgets/textField_widget.dart';
import 'package:wiz/utils/app_routes.dart';
import '../controllers/auth_bloc.dart';
import '../controllers/auth_event.dart';
import '../controllers/auth_state.dart';

class ForgotPasswordScreenBloc extends StatefulWidget {
  const ForgotPasswordScreenBloc({super.key});

  @override
  State<ForgotPasswordScreenBloc> createState() => _ForgotPasswordScreenBlocState();
}

class _ForgotPasswordScreenBlocState extends State<ForgotPasswordScreenBloc> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();

  String? _emailValidator(String? value) {
    if (value == null || value.isEmpty) return 'Email is required';
    if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value)) return 'Invalid email';
    return null;
  }

  void _handleSendCode() {
    if (!_formKey.currentState!.validate()) return;

    context.read<AuthBloc>().add(ForgotPasswordRequested(email: _emailController.text.trim()));
  }

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: const BackButton(color: Color(0xFF6C5CE7)),
        backgroundColor: AppStyles.background(context),
        elevation: 0,
      ),
      body: BlocListener<AuthBloc, AuthState>(
        listener: (context, state) {
          if (state is ForgotPasswordSuccess) {
            // Navigate to OTP screen
            AppRoutes.navigateTo(context, AppRoutes.otp, arguments: {'email': state.email, 'type': 'reset'});
          } else if (state is AuthError) {
            ScaffoldMessenger.of(
              context,
            ).showSnackBar(SnackBar(content: Text(state.message), backgroundColor: Colors.red));
          }
        },
        child: Container(
          color: AppStyles.background(context),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32.0),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 20),
                  Text('Forgot password', style: AppStyles.h1(context)),
                  const SizedBox(height: 12),
                  Text(
                    'Please enter your email address. We will send you a verification code.',
                    style: AppStyles.body(context),
                  ),
                  const SizedBox(height: 48),
                  TextFieldAuth(
                    hintText: 'Email',
                    icon: Icons.email_outlined,
                    controller: _emailController,
                    validator: _emailValidator,
                  ),
                  const SizedBox(height: 32),
                  BlocBuilder<AuthBloc, AuthState>(
                    builder: (context, state) {
                      final isLoading = state is AuthLoading;
                      return Button(
                        text: isLoading ? 'Sending...' : 'Send Code',
                        enabled: !isLoading,
                        onPressed: _handleSendCode,
                      );
                    },
                  ),
                  const Spacer(),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
