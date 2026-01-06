// Mobile/wiz/lib/screens/Payment/views/stripe_payment_screen.dart
// ✅ FIXED: Real Stripe integration using flutter_stripe package

import 'package:flutter/material.dart';
import 'package:flutter_stripe/flutter_stripe.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/screens/Payment/services/payment_api_service.dart';

class StripePaymentScreen extends StatefulWidget {
  final String bookingId;
  final String paymentType; // 'deposit' or 'final_payment'
  final int amount;

  const StripePaymentScreen({super.key, required this.bookingId, required this.paymentType, required this.amount});

  @override
  State<StripePaymentScreen> createState() => _StripePaymentScreenState();
}

class _StripePaymentScreenState extends State<StripePaymentScreen> {
  final PaymentApiService _paymentApi = PaymentApiService();

  bool _isLoading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _processPayment();
  }

  Future<void> _processPayment() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      // Verify Stripe publishable key is set
      if (Stripe.publishableKey == null || Stripe.publishableKey!.isEmpty) {
        throw Exception('Stripe publishable key is not configured. Please check your app initialization.');
      }
      print('🔑 Stripe publishable key is set: ${Stripe.publishableKey!.substring(0, 20)}...');

      // Step 1: Create payment intent
      PaymentIntentResponse paymentIntent;

      if (widget.paymentType == 'deposit') {
        paymentIntent = await _paymentApi.createDepositIntent(bookingId: widget.bookingId, provider: 'stripe');
      } else {
        paymentIntent = await _paymentApi.createFinalPaymentIntent(bookingId: widget.bookingId, provider: 'stripe');
      }

      print('✅ Payment intent created: ${paymentIntent.intentId}');
      print('   Client Secret: ${paymentIntent.clientSecret}');
      print('   Amount: ${paymentIntent.amount} ${paymentIntent.currency}');

      if (paymentIntent.clientSecret == null || paymentIntent.clientSecret!.isEmpty) {
        throw Exception('No client secret received from server');
      }

      // Trim and validate client secret format
      final clientSecret = paymentIntent.clientSecret!.trim();
      if (!clientSecret.startsWith('pi_') || !clientSecret.contains('_secret_')) {
        throw Exception('Invalid client secret format: $clientSecret');
      }

      print('🔐 Validated client secret format');

      // Step 2: Initialize payment sheet with Stripe
      try {
        print('📱 Initializing Stripe payment sheet...');
        await Stripe.instance.initPaymentSheet(
          paymentSheetParameters: SetupPaymentSheetParameters(
            // Merchant info
            merchantDisplayName: 'Wiz Car Rental',

            // Payment intent
            paymentIntentClientSecret: clientSecret,

            // Customer info (optional, for saved payment methods)
            // customerId: 'cus_xxxxx',
            // customerEphemeralKeySecret: 'ek_xxxxx',

            // Styling
            style: ThemeMode.system,
            appearance: PaymentSheetAppearance(
              colors: PaymentSheetAppearanceColors(primary: AppStyles.primary, background: Colors.white),
              shapes: PaymentSheetShape(borderRadius: 12),
            ),

            // Allow saving payment methods
            allowsDelayedPaymentMethods: true,
          ),
        );
        print('✅ Payment sheet initialized successfully');
      } on StripeException catch (stripeError) {
        print('❌ Stripe initialization error: ${stripeError.error.message}');
        print('   Error code: ${stripeError.error.code}');
        print('   Error type: ${stripeError.error.type}');
        print('   Localized message: ${stripeError.error.localizedMessage}');
        throw Exception('Stripe initialization failed: ${stripeError.error.message ?? stripeError.error.localizedMessage ?? "Unknown error"}');
      }

      setState(() {
        _isLoading = false;
      });

      // Step 3: Present payment sheet
      await _presentPaymentSheet();
    } on StripeException catch (e) {
      print('❌ Stripe payment initialization error: ${e.error.message}');
      print('   Error code: ${e.error.code}');
      print('   Error type: ${e.error.type}');
      print('   Localized message: ${e.error.localizedMessage}');
      
      String errorMessage = 'Payment initialization failed';
      if (e.error.message != null) {
        errorMessage = e.error.message!;
      } else if (e.error.localizedMessage != null) {
        errorMessage = e.error.localizedMessage!;
      }
      
      setState(() {
        _error = errorMessage;
        _isLoading = false;
      });

      // Show error and close
      if (mounted) {
        _showErrorDialog(errorMessage);
      }
    } catch (e) {
      print('❌ Payment initialization error: $e');
      print('   Error type: ${e.runtimeType}');
      
      String errorMessage = e.toString();
      if (e.toString().contains('StripeConfigException')) {
        errorMessage = 'Stripe configuration error. Please check your Stripe keys are correctly set.';
      }
      
      setState(() {
        _error = errorMessage;
        _isLoading = false;
      });

      // Show error and close
      if (mounted) {
        _showErrorDialog(errorMessage);
      }
    }
  }

  Future<void> _presentPaymentSheet() async {
    try {
      // Show Stripe's payment sheet
      await Stripe.instance.presentPaymentSheet();

      // ✅ Payment successful!
      print('✅ Payment completed successfully');

      if (mounted) {
        _handlePaymentSuccess();
      }
    } on StripeException catch (e) {
      print('❌ Stripe error: ${e.error.localizedMessage}');

      if (e.error.code == FailureCode.Canceled) {
        // User cancelled
        print('ℹ️ User cancelled payment');
        if (mounted) {
          _handlePaymentCancelled();
        }
      } else {
        // Payment failed
        print('❌ Payment failed: ${e.error.message}');
        if (mounted) {
          _showErrorDialog(e.error.localizedMessage ?? 'Payment failed');
        }
      }
    } catch (e) {
      print('❌ Unexpected error: $e');
      if (mounted) {
        _showErrorDialog('An unexpected error occurred');
      }
    }
  }

  void _handlePaymentSuccess() {
    // Show success message
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          widget.paymentType == 'deposit'
              ? 'Deposit paid successfully! Waiting for owner approval.'
              : 'Payment completed! You can now pick up the car.',
        ),
        backgroundColor: Colors.green,
        duration: const Duration(seconds: 3),
      ),
    );

    // Return success result
    Future.delayed(const Duration(seconds: 1), () {
      if (mounted) {
        Navigator.pop(context, {'success': true, 'bookingId': widget.bookingId, 'paymentType': widget.paymentType});
      }
    });
  }

  void _handlePaymentCancelled() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Payment cancelled'),
        backgroundColor: Colors.orange,
        duration: Duration(seconds: 2),
      ),
    );

    Navigator.pop(context, {'success': false, 'cancelled': true, 'bookingId': widget.bookingId});
  }

  void _showErrorDialog(String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppStyles.surface(context),
        title: const Text('Payment Failed'),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context); // Close dialog
              Navigator.pop(context, {'success': false, 'error': message}); // Close payment screen
            },
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppStyles.background(context),
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => Navigator.pop(context, {'success': false, 'cancelled': true}),
        ),
        title: Text(widget.paymentType == 'deposit' ? 'Pay Deposit' : 'Pay Final Amount', style: AppStyles.h2(context)),
        centerTitle: true,
        backgroundColor: AppStyles.background(context),
        elevation: 0,
      ),
      body: _isLoading
          ? _buildLoadingState()
          : _error != null
          ? _buildErrorState()
          : const SizedBox.shrink(),
    );
  }

  Widget _buildLoadingState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const CircularProgressIndicator(),
          const SizedBox(height: 24),
          Text('Preparing secure payment...', style: AppStyles.body(context)),
          const SizedBox(height: 8),
          Text('${_formatPrice(widget.amount)} VND', style: AppStyles.h2(context).copyWith(color: AppStyles.primary)),
          const SizedBox(height: 32),
          Container(
            padding: const EdgeInsets.all(16),
            margin: const EdgeInsets.symmetric(horizontal: 32),
            decoration: BoxDecoration(
              color: Colors.blue.shade50,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.blue.shade200),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.lock, color: Colors.blue, size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Secure payment powered by Stripe',
                    style: AppStyles.caption(context).copyWith(color: Colors.blue.shade900),
                    textAlign: TextAlign.center,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Colors.red),
            const SizedBox(height: 16),
            Text('Payment Error', style: AppStyles.h2(context)),
            const SizedBox(height: 8),
            Text(_error ?? 'Unknown error', style: AppStyles.body(context), textAlign: TextAlign.center),
            const SizedBox(height: 24),
            ElevatedButton(
              style: AppStyles.primaryButtonStyle(context),
              onPressed: _processPayment,
              child: const Text('Try Again'),
            ),
            const SizedBox(height: 12),
            TextButton(onPressed: () => Navigator.pop(context, {'success': false}), child: const Text('Cancel')),
          ],
        ),
      ),
    );
  }

  String _formatPrice(int price) {
    return price.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},');
  }
}
