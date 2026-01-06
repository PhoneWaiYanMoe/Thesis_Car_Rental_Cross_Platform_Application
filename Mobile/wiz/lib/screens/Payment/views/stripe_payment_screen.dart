// Mobile/wiz/lib/screens/Payment/views/stripe_payment_screen.dart
import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/screens/Payment/services/payment_api_service.dart';
import 'package:webview_flutter/webview_flutter.dart';

class StripePaymentScreen extends StatefulWidget {
  final String bookingId;
  final String paymentType; // 'deposit' or 'final_payment'
  final int amount;
  final String? returnUrl;

  const StripePaymentScreen({
    super.key,
    required this.bookingId,
    required this.paymentType,
    required this.amount,
    this.returnUrl,
  });

  @override
  State<StripePaymentScreen> createState() => _StripePaymentScreenState();
}

class _StripePaymentScreenState extends State<StripePaymentScreen> {
  final PaymentApiService _paymentApi = PaymentApiService();

  bool _isLoading = true;
  String? _error;
  String? _paymentUrl;
  late WebViewController _webViewController;

  @override
  void initState() {
    super.initState();
    _initializePayment();
  }

  Future<void> _initializePayment() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      PaymentIntentResponse paymentIntent;

      if (widget.paymentType == 'deposit') {
        paymentIntent = await _paymentApi.createDepositIntent(bookingId: widget.bookingId, provider: 'stripe');
      } else {
        paymentIntent = await _paymentApi.createFinalPaymentIntent(bookingId: widget.bookingId, provider: 'stripe');
      }

      print('✅ Payment intent created: ${paymentIntent.intentId}');
      print('   Client Secret: ${paymentIntent.clientSecret}');
      print('   Amount: ${paymentIntent.amount} ${paymentIntent.currency}');

      // For Stripe, we need to show Stripe's payment page
      // In a real app, you would use stripe_flutter package
      // For now, we'll simulate with a mock payment page

      final mockPaymentUrl =
          'http://10.0.2.2:3006/mock-payment?orderId=${paymentIntent.intentId}&amount=${paymentIntent.amount}&provider=stripe&returnUrl=${Uri.encodeComponent(widget.returnUrl ?? 'http://localhost:3006/payment/success')}';

      setState(() {
        _paymentUrl = mockPaymentUrl;
        _isLoading = false;
      });

      // Initialize WebView
      _webViewController = WebViewController()
        ..setJavaScriptMode(JavaScriptMode.unrestricted)
        ..setNavigationDelegate(
          NavigationDelegate(
            onPageStarted: (String url) {
              print('🔄 Page started loading: $url');
            },
            onPageFinished: (String url) {
              print('✅ Page finished loading: $url');
            },
            onNavigationRequest: (NavigationRequest request) {
              print('🔗 Navigation request: ${request.url}');

              // Check if payment was successful or failed
              if (request.url.contains('/payment/success') || request.url.contains('vnp_ResponseCode=00')) {
                _handlePaymentSuccess();
                return NavigationDecision.prevent;
              } else if (request.url.contains('/payment/failed') || request.url.contains('vnp_ResponseCode=24')) {
                _handlePaymentFailed();
                return NavigationDecision.prevent;
              }

              return NavigationDecision.navigate;
            },
          ),
        )
        ..loadRequest(Uri.parse(mockPaymentUrl));
    } catch (e) {
      print('❌ Initialize payment error: $e');
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  void _handlePaymentSuccess() {
    // Show success message first
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
    Navigator.pop(context, {'success': true, 'bookingId': widget.bookingId, 'paymentType': widget.paymentType});
  }

  void _handlePaymentFailed() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Payment failed or cancelled'),
        backgroundColor: Colors.red,
        duration: Duration(seconds: 2),
      ),
    );

    Navigator.pop(context, {'success': false, 'bookingId': widget.bookingId, 'paymentType': widget.paymentType});
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppStyles.background(context),
      appBar: AppBar(
        leading: IconButton(icon: const Icon(Icons.close), onPressed: () => _showCancelDialog()),
        title: Text(widget.paymentType == 'deposit' ? 'Pay Deposit' : 'Pay Final Amount', style: AppStyles.h2(context)),
        centerTitle: true,
        backgroundColor: AppStyles.background(context),
        elevation: 0,
      ),
      body: _isLoading
          ? _buildLoadingState()
          : _error != null
          ? _buildErrorState()
          : _buildPaymentWebView(),
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
              onPressed: _initializePayment,
              child: const Text('Try Again'),
            ),
            const SizedBox(height: 12),
            TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          ],
        ),
      ),
    );
  }

  Widget _buildPaymentWebView() {
    return Column(
      children: [
        // Payment info header
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppStyles.surface(context),
            border: Border(bottom: BorderSide(color: AppStyles.textSecondary(context).withOpacity(0.2))),
          ),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Amount to Pay:', style: AppStyles.body(context)),
                  Text(
                    '${_formatPrice(widget.amount)} VND',
                    style: AppStyles.h3(context).copyWith(color: AppStyles.primary),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Payment Type:', style: AppStyles.caption(context)),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.blue.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.blue),
                    ),
                    child: Text(
                      widget.paymentType == 'deposit' ? 'Deposit (30%)' : 'Final Payment (70%)',
                      style: const TextStyle(color: Colors.blue, fontSize: 12, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),

        // WebView
        Expanded(
          child: _paymentUrl != null
              ? WebViewWidget(controller: _webViewController)
              : const Center(child: Text('Loading payment page...')),
        ),

        // Security notice
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.green.withOpacity(0.1),
            border: Border(top: BorderSide(color: Colors.green.withOpacity(0.3))),
          ),
          child: Row(
            children: [
              const Icon(Icons.lock, color: Colors.green, size: 16),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Secure payment powered by Stripe',
                  style: AppStyles.caption(context).copyWith(color: Colors.green),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  void _showCancelDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppStyles.surface(context),
        title: Text('Cancel Payment?', style: AppStyles.h2(context)),
        content: Text('Are you sure you want to cancel this payment?', style: AppStyles.body(context)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('No')),
          TextButton(
            onPressed: () {
              Navigator.pop(context); // Close dialog
              Navigator.pop(context, {'success': false, 'cancelled': true}); // Close payment screen
            },
            child: const Text('Yes, Cancel', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  String _formatPrice(int price) {
    return price.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},');
  }
}
