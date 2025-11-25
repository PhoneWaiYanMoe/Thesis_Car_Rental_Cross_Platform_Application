// widgets/payment_method_card.dart
import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/constants/booking_constants.dart';

extension PaymentMethodExt on PaymentMethod {
  String get displayName {
    return switch (this) {
      PaymentMethod.none => 'Choose Payment Method',
      PaymentMethod.momo => 'Momo',
      PaymentMethod.zaloPay => 'ZaloPay',
      PaymentMethod.bankTransfer => 'Bank Transfer',
    };
  }

  String get iconAsset {
    return switch (this) {
      PaymentMethod.momo => 'assets/logo/momo.png',
      PaymentMethod.zaloPay => 'assets/logo/zalo.png',
      PaymentMethod.bankTransfer => 'assets/logo/bank.png',
      _ => 'assets/icons/payment.png',
    };
  }
}

class PaymentMethodCard extends StatefulWidget {
  final PaymentMethod initialMethod;
  final ValueChanged<PaymentMethod>? onChanged;

  const PaymentMethodCard({Key? key, this.initialMethod = PaymentMethod.none, this.onChanged}) : super(key: key);

  @override
  State<PaymentMethodCard> createState() => _PaymentMethodCardState();
}

class _PaymentMethodCardState extends State<PaymentMethodCard> {
  late PaymentMethod _selected;

  @override
  void initState() {
    super.initState();
    _selected = widget.initialMethod;
  }

  @override
  Widget build(BuildContext context) {
    final options = PaymentMethod.values;

    return Card(
      color: AppStyles.surface(context),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      elevation: 0,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            DropdownButtonFormField<PaymentMethod>(
              value: _selected,
              items: options.map((method) {
                return DropdownMenuItem(
                  value: method,
                  child: Row(
                    children: [
                      if (method != PaymentMethod.none)
                        Image.asset(
                          method.iconAsset,
                          width: 24,
                          height: 24,
                          errorBuilder: (_, __, ___) => const Icon(Icons.payment, size: 20),
                        ),
                      SizedBox(width: 12),
                      Text(method.displayName),
                    ],
                  ),
                );
              }).toList(),
              onChanged: (value) {
                if (value != null && value != PaymentMethod.none) {
                  setState(() => _selected = value);
                  widget.onChanged?.call(value);
                }
              },
              decoration: AppStyles.inputDecoration(
                hint: 'Select payment method',
                context: context,
                icon: Icons.payment,
              ),
              dropdownColor: AppStyles.surface(context),
              icon: const Icon(Icons.keyboard_arrow_down_rounded),
            ),

            const SizedBox(height: 20),

            // Payment Policy
            Text('Payment Policy', style: AppStyles.h3(context)),
            const SizedBox(height: 10),

            Text(
              '• To start your booking, please pay a 30% deposit of the total rental cost.\n'
              '• The remaining balance will be paid when you receive the car.\n'
              '• After your deposit is made, your booking will be pending owner confirmation.\n'
              '• If the owner accepts, your booking will be confirmed.\n'
              '• If the owner declines, your deposit will be fully refunded within 3 working days.',
              style: AppStyles.caption(context).copyWith(height: 1.7, color: AppStyles.textSecondary(context)),
            ),
          ],
        ),
      ),
    );
  }
}
