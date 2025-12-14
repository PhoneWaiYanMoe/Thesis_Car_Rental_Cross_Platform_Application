import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/utils/app_routes.dart';

class ButtonNavBar extends StatelessWidget {
  const ButtonNavBar({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppStyles.surface(context),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)],
      ),
      child: BottomNavigationBar(
        currentIndex: 0,
        type: BottomNavigationBarType.fixed,
        backgroundColor: AppStyles.surface(context),
        selectedItemColor: AppStyles.primary,
        unselectedItemColor: AppStyles.textSecondary(context),
        onTap: (index) {
          if (index == 0) {
            AppRoutes.navigateTo(context, AppRoutes.home);
          } else if (index == 1) {
            AppRoutes.navigateTo(context, AppRoutes.rentalHistory);
          }
           else if (index == 3) {
            AppRoutes.navigateTo(context, AppRoutes.profile);
          }
        },
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.directions_car), label: 'Trips'),
          BottomNavigationBarItem(icon: Icon(Icons.chat_bubble_outline), label: 'Chat'),
          BottomNavigationBarItem(icon: Icon(Icons.person_outline), label: 'Profile'),
        ],
      ),
    );
  }
}
