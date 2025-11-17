import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';

class SummaryRow extends StatelessWidget {
  final IconData icon;
  final String text;
  const SummaryRow({super.key, required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Icon(icon, size: 18, color: AppStyles.textSecondary(context)),
          const SizedBox(width: 8),
          Text(text, style: AppStyles.body(context)),
        ],
      ),
    );
  }
}