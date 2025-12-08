// lib/screens/Auth/views/password_change_screen_bloc.dart
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/screens/Auth/views/widgets/button_widget.dart';
import 'package:wiz/screens/Auth/views/widgets/textField_widget.dart';
import 'package:wiz/utils/app_routes.dart';
import '../controllers/auth_bloc.dart';
import '../controllers/auth_event.dart';
import '../controllers/auth_state.dart';

class PasswordChangeScreenBloc extends StatefulWidget {
  final Map<String, dynamic>? arguments;

  const PasswordChangeScreenBloc({super.key, this.arguments});

  @override
  State<PasswordChangeScreenBloc> createState() => _PasswordChangeScreenBlocState();
}

class _PasswordChangeScreenBlocState extends State<PasswordChangeScreenBloc> {
  final _formKey = GlobalKey<FormState>();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  late String _email;

  @override
  void initState() {
    super.initState();
    _email = widget.arguments?['email'] ?? '';
  }

  String? _passwordValidator(String? value) {
    if (value == null || value.isEmpty) return 'Password is required';
    if (value.length < 8) return 'Must be 8+ characters';
    if (!RegExp(r'(?=.*[A-Z])').hasMatch(value)) return 'Needs 1 uppercase';
    if (!RegExp(r'(?=.*[0-9])').hasMatch(value)) return 'Needs 1 number';
    return null;
  }

  String? _confirmPasswordValidator(String? value) {
    if (value != _newPasswordController.text) return 'Passwords do not match';
    return _passwordValidator(value);
  }

  void _handleSavePassword() {
    if (!_formKey.currentState!.validate()) return;

    context.read<AuthBloc>().add(
      ResetPasswordRequested(
        email: _email,
        newPassword: _newPasswordController.text,
        confirmNewPassword: _confirmPasswordController.text,
      ),
    );
  }

  @override
  void dispose() {
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
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
          if (state is ResetPasswordSuccess) {
            // Navigate to success screen
            AppRoutes.navigateTo(context, AppRoutes.passwordChangeSuccess);
          } else if (state is AuthError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: Colors.red,
              ),
            );
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
                  Text(
                    'Create New Password',
                    style: AppStyles.h1(context),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Your new password must be different from previous ones.',
                    style: AppStyles.body(context),
                  ),
                  const SizedBox(height: 48),
                  TextFieldAuth(
                    hintText: 'New Password',
                    icon: Icons.lock_outline,
                    isPassword: true,
                    controller: _newPasswordController,
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
                  const SizedBox(height: 32),
                  BlocBuilder<AuthBloc, AuthState>(
                    builder: (context, state) {
                      final isLoading = state is AuthLoading;
                      return Button(
                        text: isLoading ? 'Saving...' : 'Save Password',
                        enabled: !isLoading,
                        onPressed: _handleSavePassword,
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