// lib/screens/Auth/views/otp_screen_bloc.dart
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/screens/Auth/views/widgets/button_widget.dart';
import 'package:wiz/utils/app_routes.dart';
import '../controllers/auth_bloc.dart';
import '../controllers/auth_event.dart';
import '../controllers/auth_state.dart';

class OtpVerificationScreenBloc extends StatefulWidget {
  final Map<String, dynamic>? arguments;

  const OtpVerificationScreenBloc({super.key, this.arguments});

  @override
  State<OtpVerificationScreenBloc> createState() => _OtpVerificationScreenBlocState();
}

class _OtpVerificationScreenBlocState extends State<OtpVerificationScreenBloc> {
  final List<TextEditingController> _controllers = List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _focusNodes = List.generate(6, (_) => FocusNode());

  late String _email;
  late String _type; // 'register' or 'reset'

  bool get _isComplete => _controllers.every((c) => c.text.isNotEmpty);

  @override
  void initState() {
    super.initState();
    _email = widget.arguments?['email'] ?? '';
    _type = widget.arguments?['type'] ?? 'register';
  }

  void _onChanged(String value, int index) {
    if (value.length == 1 && index < 5) {
      _focusNodes[index + 1].requestFocus();
    } else if (value.isEmpty && index > 0) {
      _focusNodes[index - 1].requestFocus();
    }
    setState(() {});
  }

  void _handleVerify() {
    if (!_isComplete) return;

    final code = _controllers.map((c) => c.text).join();

    if (_type == 'register') {
      context.read<AuthBloc>().add(
        VerifyEmailOTPRequested(
          email: _email,
          code: code,
        ),
      );
    } else {
      context.read<AuthBloc>().add(
        VerifyResetOTPRequested(
          email: _email,
          code: code,
        ),
      );
    }
  }

  @override
  void dispose() {
    for (var c in _controllers) c.dispose();
    for (var f in _focusNodes) f.dispose();
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
          if (state is OTPVerificationSuccess) {
            // Email verification successful - navigate to home
            AppRoutes.navigateAndRemoveUntil(context, AppRoutes.home);
          } else if (state is ResetOTPVerified) {
            // Password reset OTP verified - navigate to password change
            AppRoutes.navigateTo(
              context,
              AppRoutes.passwordChange,
              arguments: {'email': _email},
            );
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
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 20),
                Text('Enter Verification Code', style: AppStyles.h1(context)),
                const SizedBox(height: 12),
                Text(
                  'Please enter the code we sent to $_email',
                  style: AppStyles.body(context),
                ),
                const SizedBox(height: 48),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: List.generate(
                    6,
                    (i) => SizedBox(
                      width: 55,
                      height: 60,
                      child: TextField(
                        controller: _controllers[i],
                        focusNode: _focusNodes[i],
                        keyboardType: TextInputType.number,
                        textAlign: TextAlign.center,
                        maxLength: 1,
                        style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w600),
                        decoration: InputDecoration(
                          counterText: '',
                          filled: true,
                          fillColor: const Color(0xFFF7F8FA),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide.none,
                          ),
                        ),
                        onChanged: (v) => _onChanged(v, i),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 40),
                BlocBuilder<AuthBloc, AuthState>(
                  builder: (context, state) {
                    final isLoading = state is AuthLoading;
                    return Button(
                      text: isLoading ? 'Verifying...' : 'Verify',
                      enabled: _isComplete && !isLoading,
                      onPressed: _handleVerify,
                    );
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