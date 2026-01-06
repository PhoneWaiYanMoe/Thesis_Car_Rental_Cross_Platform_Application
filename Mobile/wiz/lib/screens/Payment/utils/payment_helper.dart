// Mobile/wiz/lib/screens/Payment/utils/payment_helper.dart
import 'package:flutter/material.dart';
import 'package:wiz/screens/Payment/views/stripe_payment_screen.dart';

class PaymentHelper {
  /// Navigate to Stripe payment screen
  static Future<Map<String, dynamic>?> processStripePayment({
    required BuildContext context,
    required String bookingId,
    required String paymentType,
    required int amount,
    String? returnUrl,
  }) async {
    final result = await Navigator.push<Map<String, dynamic>>(
      context,
      MaterialPageRoute(
        builder: (context) => StripePaymentScreen(
          bookingId: bookingId,
          paymentType: paymentType,
          amount: amount,
    //      returnUrl: returnUrl,
        ),
      ),
    );

    return result;
  }

  /// Show payment method selection dialog
  static Future<String?> selectPaymentMethod(BuildContext context) async {
    return await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Select Payment Method'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.credit_card, color: Colors.blue),
              title: const Text('Stripe'),
              subtitle: const Text('Credit/Debit Card'),
              onTap: () => Navigator.pop(context, 'stripe'),
            ),
            const Divider(),
            ListTile(
              leading: Icon(Icons.payment, color: Colors.grey[600]),
              title: const Text('PayPal'),
              subtitle: const Text('Coming soon'),
              enabled: false,
            ),
            ListTile(
              leading: Icon(Icons.account_balance, color: Colors.grey[600]),
              title: const Text('VNPay'),
              subtitle: const Text('Coming soon'),
              enabled: false,
            ),
          ],
        ),
      ),
    );
  }

  /// Format price with thousand separators
  static String formatPrice(int price) {
    return price.toString().replaceAllMapped(
          RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
          (m) => '${m[1]},',
        );
  }

  /// Get payment type display name
  static String getPaymentTypeDisplayName(String paymentType) {
    switch (paymentType) {
      case 'deposit':
        return 'Deposit Payment (30%)';
      case 'final_payment':
        return 'Final Payment (70%)';
      default:
        return 'Payment';
    }
  }

  /// Get payment status color
  static Color getPaymentStatusColor(bool isPaid) {
    return isPaid ? Colors.green : Colors.orange;
  }

  /// Get payment status icon
  static IconData getPaymentStatusIcon(bool isPaid) {
    return isPaid ? Icons.check_circle : Icons.pending;
  }

  /// Show payment processing dialog
  static void showProcessingDialog(BuildContext context) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => WillPopScope(
        onWillPop: () async => false,
        child: const AlertDialog(
          content: Row(
            children: [
              CircularProgressIndicator(),
              SizedBox(width: 20),
              Text('Processing payment...'),
            ],
          ),
        ),
      ),
    );
  }

  /// Calculate deposit amount (30%)
  static int calculateDeposit(int totalAmount) {
    return (totalAmount * 0.3).round();
  }

  /// Calculate remaining amount (70%)
  static int calculateRemaining(int totalAmount) {
    return totalAmount - calculateDeposit(totalAmount);
  }
}