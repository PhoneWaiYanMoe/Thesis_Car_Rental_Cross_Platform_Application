import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/services/logged_in_as_service.dart';
import 'package:wiz/utils/app_routes.dart';

class ButtonNavBar extends StatefulWidget {
  const ButtonNavBar({super.key});

  @override
  State<ButtonNavBar> createState() => _ButtonNavBarState();
}

class _ButtonNavBarState extends State<ButtonNavBar> {
  final LoggedInAsService _loggedInAsService = LoggedInAsService();
  String _loggedInAs = 'customer'; // Default to customer
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadLoggedInAsStatus();
  }

  Future<void> _loadLoggedInAsStatus() async {
    final result = await _loggedInAsService.getLoggedInAs();

    if (mounted) {
      setState(() {
        _loggedInAs = result['logged_in_as'] ?? 'customer';
        _isLoading = false;
      });
    }
  }

  void _handleHomeNavigation() {
    if (_loggedInAs == 'owner') {
      // Navigate to analytics screen for owners
      AppRoutes.navigateTo(context, AppRoutes.analytics);
    } else {
      // Navigate to home screen for customers
      AppRoutes.navigateTo(context, AppRoutes.home);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppStyles.surface(context),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10),
        ],
      ),
      child: BottomNavigationBar(
        currentIndex: 0,
        type: BottomNavigationBarType.fixed,
        backgroundColor: AppStyles.surface(context),
        selectedItemColor: AppStyles.primary,
        unselectedItemColor: AppStyles.textSecondary(context),
        onTap: (index) {
          if (index == 0) {
            // Home button - dynamic based on logged_in_as
            _handleHomeNavigation();
          } else if (index == 1) {
            AppRoutes.navigateTo(context, AppRoutes.rentalHistory);
          } else if (index == 2) {
            AppRoutes.navigateTo(context, AppRoutes.chatList);
          } else if (index == 3) {
            AppRoutes.navigateTo(context, AppRoutes.profile);
          }
        },
        items: [
          BottomNavigationBarItem(
            icon: _isLoading
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : Icon(_loggedInAs == 'owner' ? Icons.analytics : Icons.home),
            label: _loggedInAs == 'owner' ? 'Analytics' : 'Home',
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.directions_car),
            label: 'Trips',
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.chat_bubble_outline),
            label: 'Chat',
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}
