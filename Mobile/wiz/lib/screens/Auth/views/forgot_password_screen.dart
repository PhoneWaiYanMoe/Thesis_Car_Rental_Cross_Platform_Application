import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/screens/Auth/views/widgets/button_widget.dart';
import 'package:wiz/screens/Auth/views/widgets/textField_widget.dart';
import 'package:wiz/utils/app_routes.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});
  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();

  String? _emailValidator(String? value) {
    if (value == null || value.isEmpty) return 'Email is required';
    if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value)) return 'Invalid email';
    return null;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: BackButton(color: Colors.black),
        backgroundColor: AppStyles.background,
        elevation: 0,
      ),
      body: Container(
        color: AppStyles.background,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 20),
                Text('Forgot password', style: AppStyles.h1),
                const SizedBox(height: 12),
                Text(
                  'Please enter your email address. We will send you a verification code.',
                  style: AppStyles.body,
                ),
                const SizedBox(height: 48),
                TextFieldAuth(
                  hintText: 'Email',
                  icon: Icons.email_outlined,
                  controller: _emailController,
                  validator: _emailValidator,
                ),
                const SizedBox(height: 32),
                Button(
                  text: 'Send Code',
                  onPressed: () {
                    if (_formKey.currentState!.validate()) {
                      AppRoutes.navigateTo(context, AppRoutes.otp);}
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
