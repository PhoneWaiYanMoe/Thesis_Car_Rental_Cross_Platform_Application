import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';

class BookingBottomBar extends StatelessWidget {
  final int pricePerDay;
  final String buttonText;
  final VoidCallback? onPressed;
  final bool isLoading;

  const BookingBottomBar({
    Key? key,
    required this.pricePerDay,
    this.buttonText = 'Continue',
    this.onPressed,
    this.isLoading = false,
  }) : super(key: key);

  String _formatPrice(int price) {
    return price.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},');
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppStyles.surface(context),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 12, offset: Offset(0, -2))],
      ),
      child: SafeArea(
        child: Row(
          children: [
            // Price
            Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${_formatPrice(pricePerDay)} đ',
                  style: AppStyles.h2(context).copyWith(color: AppStyles.primary, fontWeight: FontWeight.bold),
                ),
                Text('per day', style: AppStyles.caption(context).copyWith(color: Colors.grey.shade600)),
              ],
            ),

            const Spacer(),

            // Action Button
            SizedBox(
              height: 52,
              width: 160,
              child: ElevatedButton(
                style: AppStyles.primaryButtonStyle(context).copyWith(
                  elevation: WidgetStateProperty.all(0),
                  shape: WidgetStateProperty.all(RoundedRectangleBorder(borderRadius: BorderRadius.circular(16))),
                ),
                onPressed: isLoading ? null : onPressed,
                child: isLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                      )
                    : Text(buttonText, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
