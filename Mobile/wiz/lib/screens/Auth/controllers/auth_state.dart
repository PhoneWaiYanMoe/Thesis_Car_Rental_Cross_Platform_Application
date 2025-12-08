// lib/bloc/auth/auth_state.dart
import 'package:equatable/equatable.dart';

abstract class AuthState extends Equatable {
  const AuthState();

  @override
  List<Object?> get props => [];
}

// Initial state
class AuthInitial extends AuthState {
  const AuthInitial();
}

// Loading state
class AuthLoading extends AuthState {
  const AuthLoading();
}

// Register states
class RegisterSuccess extends AuthState {
  final String email;
  final String userId;
  final String message;

  const RegisterSuccess({
    required this.email,
    required this.userId,
    required this.message,
  });

  @override
  List<Object?> get props => [email, userId, message];
}

// OTP verification states
class OTPVerificationSuccess extends AuthState {
  final String token;
  final String refreshToken;
  final Map<String, dynamic> user;

  const OTPVerificationSuccess({
    required this.token,
    required this.refreshToken,
    required this.user,
  });

  @override
  List<Object?> get props => [token, refreshToken, user];
}

class ResetOTPVerified extends AuthState {
  final String email;
  final String message;

  const ResetOTPVerified({
    required this.email,
    required this.message,
  });

  @override
  List<Object?> get props => [email, message];
}

// Login states
class LoginSuccess extends AuthState {
  final String token;
  final String refreshToken;
  final Map<String, dynamic> user;

  const LoginSuccess({
    required this.token,
    required this.refreshToken,
    required this.user,
  });

  @override
  List<Object?> get props => [token, refreshToken, user];
}

// Authenticated state
class Authenticated extends AuthState {
  final String token;
  final String refreshToken;
  final Map<String, dynamic> user;

  const Authenticated({
    required this.token,
    required this.refreshToken,
    required this.user,
  });

  @override
  List<Object?> get props => [token, refreshToken, user];
}

// Forgot password states
class ForgotPasswordSuccess extends AuthState {
  final String email;
  final String message;

  const ForgotPasswordSuccess({
    required this.email,
    required this.message,
  });

  @override
  List<Object?> get props => [email, message];
}

// Reset password states
class ResetPasswordSuccess extends AuthState {
  final String message;

  const ResetPasswordSuccess({required this.message});

  @override
  List<Object?> get props => [message];
}

// Logout states
class LogoutSuccess extends AuthState {
  const LogoutSuccess();
}

class Unauthenticated extends AuthState {
  const Unauthenticated();
}

// Error state
class AuthError extends AuthState {
  final String message;

  const AuthError({required this.message});

  @override
  List<Object?> get props => [message];
}

// Token refresh
class TokenRefreshed extends AuthState {
  final String newToken;

  const TokenRefreshed({required this.newToken});

  @override
  List<Object?> get props => [newToken];
}