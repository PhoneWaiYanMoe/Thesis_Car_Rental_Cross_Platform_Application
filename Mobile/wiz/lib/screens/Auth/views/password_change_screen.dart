import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/screens/Auth/views/widgets/button_widget.dart';
import 'package:wiz/screens/Auth/views/widgets/textField_widget.dart';
import 'package:wiz/utils/app_routes.dart';

class PasswordChangeScreen extends StatefulWidget {
  const PasswordChangeScreen({super.key});

  @override
  State<PasswordChangeScreen> createState() => _PasswordChangeScreenState();
}

class _PasswordChangeScreenState extends State<PasswordChangeScreen> {
  final _formKey = GlobalKey<FormState>();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

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
        leading: const BackButton(color: Colors.black),
        backgroundColor: Colors.white,
        elevation: 0,
      ),
      body: Container(
        color: Colors.white,
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
                  style: AppStyles.h1,
                ),
        
                const SizedBox(height: 12),
        
                Text(
                  'Your new password must be different from previous ones.',
                  style: AppStyles.h1,
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
        
                Button(
                  text: 'Save Password',
                  onPressed: () {
                    if (_formKey.currentState!.validate()) {
                      AppRoutes.navigateTo(context, AppRoutes.passwordChangeSuccess);
                    }
                  },
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
