// lib/bloc/auth/auth_bloc.dart
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'auth_event.dart';
import 'auth_state.dart';
import '../services/auth_api_service.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final AuthApiService _apiService;

  AuthBloc({AuthApiService? apiService})
      : _apiService = apiService ?? AuthApiService(),
        super(const AuthInitial()) {
    on<RegisterRequested>(_onRegisterRequested);
    on<VerifyEmailOTPRequested>(_onVerifyEmailOTPRequested);
    on<LoginRequested>(_onLoginRequested);
    on<ForgotPasswordRequested>(_onForgotPasswordRequested);
    on<VerifyResetOTPRequested>(_onVerifyResetOTPRequested);
    on<ResetPasswordRequested>(_onResetPasswordRequested);
    on<LogoutRequested>(_onLogoutRequested);
    on<CheckAuthStatus>(_onCheckAuthStatus);
    on<RefreshTokenRequested>(_onRefreshTokenRequested);
  }

  // Register
  Future<void> _onRegisterRequested(
    RegisterRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());

    final result = await _apiService.register(
      email: event.email,
      fullName: event.fullName,
      password: event.password,
      confirmPassword: event.confirmPassword,
    );

    if (result['success']) {
      final data = result['data'];
      emit(RegisterSuccess(
        email: event.email,
        userId: data['userId'],
        message: data['message'] ?? 'OTP sent to email',
      ));
    } else {
      emit(AuthError(message: result['error']));
    }
  }

  // Verify Email OTP
  Future<void> _onVerifyEmailOTPRequested(
    VerifyEmailOTPRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());

    final result = await _apiService.verifyEmailOTP(
      email: event.email,
      code: event.code,
    );

    if (result['success']) {
      final data = result['data'];
      
      // Save auth data
      await _saveAuthData(
        token: data['token'],
        refreshToken: data['refreshToken'],
        user: data['user'],
      );

      emit(OTPVerificationSuccess(
        token: data['token'],
        refreshToken: data['refreshToken'],
        user: data['user'],
      ));
    } else {
      emit(AuthError(message: result['error']));
    }
  }

  // Login
  Future<void> _onLoginRequested(
    LoginRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());

    final result = await _apiService.login(
      email: event.email,
      password: event.password,
    );

    if (result['success']) {
      final data = result['data'];
      
      // Save auth data
      await _saveAuthData(
        token: data['token'],
        refreshToken: data['refreshToken'],
        user: data['user'],
      );

      emit(LoginSuccess(
        token: data['token'],
        refreshToken: data['refreshToken'],
        user: data['user'],
      ));
    } else {
      emit(AuthError(message: result['error']));
    }
  }

  // Forgot Password
  Future<void> _onForgotPasswordRequested(
    ForgotPasswordRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());

    final result = await _apiService.forgotPassword(email: event.email);

    if (result['success']) {
      final data = result['data'];
      emit(ForgotPasswordSuccess(
        email: event.email,
        message: data['message'] ?? 'Reset code sent',
      ));
    } else {
      emit(AuthError(message: result['error']));
    }
  }

  // Verify Reset OTP
  Future<void> _onVerifyResetOTPRequested(
    VerifyResetOTPRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());

    final result = await _apiService.verifyResetOTP(
      email: event.email,
      code: event.code,
    );

    if (result['success']) {
      final data = result['data'];
      emit(ResetOTPVerified(
        email: event.email,
        message: data['message'] ?? 'Verified - proceed to reset',
      ));
    } else {
      emit(AuthError(message: result['error']));
    }
  }

  // Reset Password
  Future<void> _onResetPasswordRequested(
    ResetPasswordRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());

    final result = await _apiService.resetPassword(
      email: event.email,
      newPassword: event.newPassword,
      confirmNewPassword: event.confirmNewPassword,
    );

    if (result['success']) {
      final data = result['data'];
      emit(ResetPasswordSuccess(
        message: data['message'] ?? 'Password updated successfully',
      ));
    } else {
      emit(AuthError(message: result['error']));
    }
  }

  // Logout
  Future<void> _onLogoutRequested(
    LogoutRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());

    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token');

      if (token != null) {
        await _apiService.logout(token: token);
      }

      // Clear local data
      await _clearAuthData();

      emit(const LogoutSuccess());
    } catch (e) {
      emit(AuthError(message: 'Logout failed: ${e.toString()}'));
    }
  }

  // Check Auth Status
  Future<void> _onCheckAuthStatus(
    CheckAuthStatus event,
    Emitter<AuthState> emit,
  ) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token');
      final refreshToken = prefs.getString('refresh_token');

      if (token != null && refreshToken != null) {
        // Get user data
        final userJson = prefs.getString('user_data');
        if (userJson != null) {
          final user = Map<String, dynamic>.from(
            await Future.value(userJson).then((str) => 
              str.split(',').fold<Map<String, dynamic>>({}, (map, item) {
                final parts = item.split(':');
                if (parts.length == 2) {
                  map[parts[0].trim()] = parts[1].trim();
                }
                return map;
              })
            )
          );

          emit(Authenticated(
            token: token,
            refreshToken: refreshToken,
            user: user,
          ));
          return;
        }
      }

      emit(const Unauthenticated());
    } catch (e) {
      emit(const Unauthenticated());
    }
  }

  // Refresh Token
  Future<void> _onRefreshTokenRequested(
    RefreshTokenRequested event,
    Emitter<AuthState> emit,
  ) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final refreshToken = prefs.getString('refresh_token');

      if (refreshToken == null) {
        emit(const Unauthenticated());
        return;
      }

      final result = await _apiService.refreshToken(refreshToken: refreshToken);

      if (result['success']) {
        final newToken = result['data']['newToken'];
        await prefs.setString('auth_token', newToken);

        emit(TokenRefreshed(newToken: newToken));
      } else {
        emit(const Unauthenticated());
      }
    } catch (e) {
      emit(const Unauthenticated());
    }
  }

  // Helper: Save auth data
  Future<void> _saveAuthData({
    required String token,
    required String refreshToken,
    required Map<String, dynamic> user,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', token);
    await prefs.setString('refresh_token', refreshToken);
    await prefs.setString('user_id', user['id'] ?? '');
    await prefs.setString('user_name', user['fullName'] ?? '');
    await prefs.setString('user_email', user['email'] ?? '');
    
    // Store user data as simple string format
    final userData = 'id:${user['id']},email:${user['email']},fullName:${user['fullName']}';
    await prefs.setString('user_data', userData);
  }

  // Helper: Clear auth data
  Future<void> _clearAuthData() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('refresh_token');
    await prefs.remove('user_id');
    await prefs.remove('user_name');
    await prefs.remove('user_email');
    await prefs.remove('user_data');
  }
}