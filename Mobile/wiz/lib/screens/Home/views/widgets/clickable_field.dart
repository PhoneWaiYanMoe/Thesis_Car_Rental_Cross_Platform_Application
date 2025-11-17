import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';

class ClickableField extends StatelessWidget {
  final IconData icon;
  final String hint;
  final VoidCallback onTap;
  const ClickableField({super.key, required this.icon, required this.hint, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        decoration: BoxDecoration(color: AppStyles.surface(context), borderRadius: BorderRadius.circular(12)),
        child: Row(
          children: [
            Icon(icon, color: AppStyles.textSecondary(context), size: 20),
            const SizedBox(width: 12),
            Expanded(child: Text(hint, style: AppStyles.body(context))),
            const Icon(Icons.keyboard_arrow_right, color: Colors.grey),
          ],
        ),
      ),
    );
  }
}
