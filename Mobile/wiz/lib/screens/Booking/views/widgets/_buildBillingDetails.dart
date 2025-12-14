import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';

class BillingDetailsCard extends StatelessWidget {
  final int rentalPrice;
  final int insuranceFee;
  final int total;
  final int deposit;
  final int remaining;
  final int days;

  const BillingDetailsCard({
    super.key,
    required this.rentalPrice,
    required this.insuranceFee,
    required this.total,
    required this.deposit,
    required this.remaining,
    required this.days,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      color: AppStyles.surface(context),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Billing Details', style: AppStyles.h3(context)),
            const SizedBox(height: 16),

            _buildBillingRow(context, 'Rental Price ($days days)', '${_formatPrice(rentalPrice)} ₫'),

            const SizedBox(height: 8),

            _buildBillingRow(context, 'Insurance Fee', '${_formatPrice(insuranceFee)} ₫'),

            const Divider(height: 24),

            _buildBillingRow(context, 'Total', '${_formatPrice(total)} ₫', isTotal: true),

            const SizedBox(height: 16),

            _buildBillingRow(context, 'Deposit Payment (30%)', '${_formatPrice(deposit)} ₫'),

            const SizedBox(height: 8),

            _buildBillingRow(context, 'Payment after receiving Car', '${_formatPrice(remaining)} ₫'),
          ],
        ),
      ),
    );
  }

  Widget _buildBillingRow(BuildContext context, String label, String value, {bool isTotal = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: isTotal ? AppStyles.body(context).copyWith(fontWeight: FontWeight.bold) : AppStyles.caption(context),
        ),
        Text(
          value,
          style: isTotal
              ? AppStyles.h3(context).copyWith(color: AppStyles.primary)
              : AppStyles.body(context).copyWith(fontWeight: FontWeight.w600),
        ),
      ],
    );
  }

  String _formatPrice(int price) {
    return price.toString(); // replace with your formatter
  }
}
