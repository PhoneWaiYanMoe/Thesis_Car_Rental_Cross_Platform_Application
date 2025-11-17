import 'package:flutter/material.dart';

class SocialMediaWidget extends StatelessWidget {
  final String imagePath;
  final VoidCallback? onPressed;

  const SocialMediaWidget({super.key, required this.imagePath, this.onPressed});

  @override
  Widget build(BuildContext context) {
    return OutlinedButton(
      onPressed: onPressed ?? () {},
      style: OutlinedButton.styleFrom(
        padding: const EdgeInsets.all(16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        side: const BorderSide(color: Color(0xFFE5E7EB)),
      ),
      child: Image.asset(imagePath, width: 24, height: 24),
    );
  }
}
