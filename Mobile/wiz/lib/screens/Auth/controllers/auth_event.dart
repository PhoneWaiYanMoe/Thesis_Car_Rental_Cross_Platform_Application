import 'package:equatable/equatable.dart';

abstract class AuthEvent extends Equatable {
  const AuthEvent();

  @override
  List<Object?> get props => [];
}

// Register events
class RegisterRequested extends AuthEvent {
  final String email;
  final String fullName;
  final String password;
  final String confirmPassword;

  const RegisterRequested({
    required this.email,
    required this.fullName,
    required this.password,
    required this.confirmPassword,
  });

  @override
  List<Object?> get props => [email, fullName, password, confirmPassword];
}

// OTP verification events
class VerifyEmailOTPRequested extends AuthEvent {
  final String email;
  final String code;

  const VerifyEmailOTPRequested({
    required this.email,
    required this.code,
  });

  @override
  List<Object?> get props => [email, code];
}

class VerifyResetOTPRequested extends AuthEvent {
  final String email;
  final String code;

  const VerifyResetOTPRequested({
    required this.email,
    required this.code,
  });

  @override
  List<Object?> get props => [email, code];
}

// Login events
class LoginRequested extends AuthEvent {
  final String email;
  final String password;

  const LoginRequested({
    required this.email,
    required this.password,
  });

  @override
  List<Object?> get props => [email, password];
}

// Forgot password events
class ForgotPasswordRequested extends AuthEvent {
  final String email;

  const ForgotPasswordRequested({required this.email});

  @override
  List<Object?> get props => [email];
}

// Reset password events
class ResetPasswordRequested extends AuthEvent {
  final String email;
  final String newPassword;
  final String confirmNewPassword;

  const ResetPasswordRequested({
    required this.email,
    required this.newPassword,
    required this.confirmNewPassword,
  });

  @override
  List<Object?> get props => [email, newPassword, confirmNewPassword];
}

// Logout events
class LogoutRequested extends AuthEvent {
  const LogoutRequested();
}

// Check auth status
class CheckAuthStatus extends AuthEvent {
  const CheckAuthStatus();
}

// Refresh token
class RefreshTokenRequested extends AuthEvent {
  const RefreshTokenRequested();
}