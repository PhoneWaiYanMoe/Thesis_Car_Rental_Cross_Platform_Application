import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:wiz/services/local_storage_service.dart';
import 'auth_event.dart';
import 'auth_state.dart';
import '../services/auth_api_service.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final AuthApiService _apiService;
  final LocalStorageService _storageService = LocalStorageService();

  AuthBloc({AuthApiService? apiService}) : _apiService = apiService ?? AuthApiService(), super(const AuthInitial()) {
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
  Future<void> _onRegisterRequested(RegisterRequested event, Emitter<AuthState> emit) async {
    emit(const AuthLoading());

    final result = await _apiService.register(
      email: event.email,
      fullName: event.fullName,
      password: event.password,
      confirmPassword: event.confirmPassword,
    );

    if (result['success']) {
      final data = result['data'];
      emit(
        RegisterSuccess(email: event.email, userId: data['userId'], message: data['message'] ?? 'OTP sent to email'),
      );
    } else {
      emit(AuthError(message: result['error']));
    }
  }

  // Verify Email OTP
  Future<void> _onVerifyEmailOTPRequested(VerifyEmailOTPRequested event, Emitter<AuthState> emit) async {
    emit(const AuthLoading());

    final result = await _apiService.verifyEmailOTP(email: event.email, code: event.code);

    if (result['success']) {
      final data = result['data'];

      // ✅ USE LocalStorageService
      await _storageService.saveAuthData(token: data['token'], refreshToken: data['refreshToken'], user: data['user']);

      emit(OTPVerificationSuccess(token: data['token'], refreshToken: data['refreshToken'], user: data['user']));
    } else {
      emit(AuthError(message: result['error']));
    }
  }

  // Login
  Future<void> _onLoginRequested(LoginRequested event, Emitter<AuthState> emit) async {
    emit(const AuthLoading());

    final result = await _apiService.login(email: event.email, password: event.password);

    if (result['success']) {
      final data = result['data'];

      // ✅ USE LocalStorageService
      await _storageService.saveAuthData(token: data['token'], refreshToken: data['refreshToken'], user: data['user']);

      emit(LoginSuccess(token: data['token'], refreshToken: data['refreshToken'], user: data['user']));
    } else {
      emit(AuthError(message: result['error']));
    }
  }

  // Forgot Password
  Future<void> _onForgotPasswordRequested(ForgotPasswordRequested event, Emitter<AuthState> emit) async {
    emit(const AuthLoading());

    final result = await _apiService.forgotPassword(email: event.email);

    if (result['success']) {
      final data = result['data'];
      emit(ForgotPasswordSuccess(email: event.email, message: data['message'] ?? 'Reset code sent'));
    } else {
      emit(AuthError(message: result['error']));
    }
  }

  // Verify Reset OTP
  Future<void> _onVerifyResetOTPRequested(VerifyResetOTPRequested event, Emitter<AuthState> emit) async {
    emit(const AuthLoading());

    final result = await _apiService.verifyResetOTP(email: event.email, code: event.code);

    if (result['success']) {
      final data = result['data'];
      emit(ResetOTPVerified(email: event.email, message: data['message'] ?? 'Verified - proceed to reset'));
    } else {
      emit(AuthError(message: result['error']));
    }
  }

  // Reset Password
  Future<void> _onResetPasswordRequested(ResetPasswordRequested event, Emitter<AuthState> emit) async {
    emit(const AuthLoading());

    final result = await _apiService.resetPassword(
      email: event.email,
      newPassword: event.newPassword,
      confirmNewPassword: event.confirmNewPassword,
    );

    if (result['success']) {
      final data = result['data'];
      emit(ResetPasswordSuccess(message: data['message'] ?? 'Password updated successfully'));
    } else {
      emit(AuthError(message: result['error']));
    }
  }

  // Logout
  Future<void> _onLogoutRequested(LogoutRequested event, Emitter<AuthState> emit) async {
    emit(const AuthLoading());

    try {
      final token = await _storageService.getToken();

      if (token != null) {
        await _apiService.logout(token: token);
      }

      // ✅ USE LocalStorageService
      await _storageService.clearAuthData();

      emit(const LogoutSuccess());
    } catch (e) {
      emit(AuthError(message: 'Logout failed: ${e.toString()}'));
    }
  }

  // Check Auth Status
  Future<void> _onCheckAuthStatus(CheckAuthStatus event, Emitter<AuthState> emit) async {
    try {
      final isLoggedIn = await _storageService.isLoggedIn();

      if (isLoggedIn) {
        final token = await _storageService.getToken();
        final refreshToken = await _storageService.getRefreshToken();
        final userInfo = await _storageService.getUserInfo();

        if (token != null && refreshToken != null) {
          emit(
            Authenticated(
              token: token,
              refreshToken: refreshToken,
              user: {
                'id': userInfo['userId'],
                'email': userInfo['userEmail'],
                'fullName': userInfo['userName'],
                'role': userInfo['role'] ?? 'customer',
              },
            ),
          );
          return;
        }
      }

      emit(const Unauthenticated());
    } catch (e) {
      emit(const Unauthenticated());
    }
  }

  // Refresh Token
  Future<void> _onRefreshTokenRequested(RefreshTokenRequested event, Emitter<AuthState> emit) async {
    try {
      final refreshToken = await _storageService.getRefreshToken();

      if (refreshToken == null) {
        emit(const Unauthenticated());
        return;
      }

      final result = await _apiService.refreshToken(refreshToken: refreshToken);

      if (result['success']) {
        final newToken = result['data']['newToken'];

        // Update token in storage
        final userInfo = await _storageService.getUserInfo();
        await _storageService.saveAuthData(
          token: newToken,
          refreshToken: refreshToken,
          user: {
            'id': userInfo['userId'],
            'email': userInfo['userEmail'],
            'fullName': userInfo['userName'],
            'role': userInfo['role'] ?? 'customer',
          },
        );

        emit(TokenRefreshed(newToken: newToken));
      } else {
        emit(const Unauthenticated());
      }
    } catch (e) {
      emit(const Unauthenticated());
    }
  }
}
