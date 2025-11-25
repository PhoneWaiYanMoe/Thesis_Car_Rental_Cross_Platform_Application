import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:wiz/constants/app_styles.dart';

class DriveToggle extends StatelessWidget {
  final int selectedTab;
  final ValueChanged<int>? onTabChanged;

  const DriveToggle({super.key, this.selectedTab = 0, this.onTabChanged});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
      decoration: BoxDecoration(color: AppStyles.surface(context), borderRadius: BorderRadius.circular(12)),
      child: Row(
        children: [
          _tabButton('Self Drive', 0, Icons.directions_car, context),
          _tabButton('With Driver', 1, Icons.person, context),
        ],
      ),
    );
  }

  Widget _tabButton(String text, int index, IconData icon, BuildContext context) {
    final isSelected = selectedTab == index;
    return Expanded(
      child: GestureDetector(
        onTap: () => onTabChanged?.call(index),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: isSelected ? AppStyles.primary : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 18, color: isSelected ? Colors.white : AppStyles.textSecondary(context)),
              const SizedBox(width: 6),
              Text(
                text,
                style: GoogleFonts.poppins(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: isSelected ? Colors.white : AppStyles.textSecondary(context),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
