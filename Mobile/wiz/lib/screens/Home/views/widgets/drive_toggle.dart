import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/utils/app_routes.dart';

class DriveToggle extends StatefulWidget {
  const DriveToggle({super.key});

  @override
  State<DriveToggle> createState() => _DriveToggleState();
}

class _DriveToggleState extends State<DriveToggle> {
  int _selectedTab = 0;
  String? _location;
  String? _pickup;
  String? _destination;
  Map<String, String>? _dateTime;
  bool get _canSearch {
    if (_selectedTab == 0) {
      return _location != null && _dateTime != null;
    } else {
      return _pickup != null && _destination != null && _dateTime != null;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
      decoration: BoxDecoration(color: AppStyles.surface(context), borderRadius: BorderRadius.circular(12)),
      child: Row(
        children: [_tabButton('Self Drive', 0, Icons.directions_car), _tabButton('With Driver', 1, Icons.person)],
      ),
    );
  }

  Widget _tabButton(String text, int index, IconData icon) {
    final isSelected = _selectedTab == index;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() {
          _selectedTab = index;
          // Reset fields on switch
          _location = _pickup = _destination = null;
          _dateTime = null;
        }),
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
