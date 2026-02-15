import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/services/user_role_service.dart';

class CallToAction extends StatelessWidget {
  const CallToAction({super.key});

  Future<void> _handleRegisterNow(BuildContext context) async {
    final userRoleService = UserRoleService();

    // Get current user's role and ID
    final role = await userRoleService.getCurrentUserRole();
    final userId = await userRoleService.getCurrentUserId();

    print('📋 Current role: $role, userId: $userId');

    if (role == null || userId == null) {
      // Not logged in
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Please login to become a partner'),
            backgroundColor: Colors.orange,
          ),
        );
      }
      return;
    }

    if (role == 'owner') {
      // Already an owner
      if (context.mounted) {
        _showAlreadyOwnerDialog(context);
      }
      return;
    }

    if (role == 'customer') {
      // Show confirmation dialog
      if (context.mounted) {
        _showUpgradeConfirmationDialog(context, userId);
      }
      return;
    }
  }

  void _showAlreadyOwnerDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            Icon(Icons.check_circle, color: AppStyles.primary, size: 28),
            const SizedBox(width: 12),
            const Text('Already a Partner'),
          ],
        ),
        content: const Text(
          'You are already a partner with us, an owner!\n\n'
          'You can start listing your vehicles and earning income.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('OK', style: TextStyle(color: AppStyles.primary)),
          ),
        ],
      ),
    );
  }

  void _showUpgradeConfirmationDialog(BuildContext context, String userId) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Become a Vehicle Owner'),
        content: const Text(
          'Do you want to become a vehicle owner?\n\n'
          'As an owner, you can:\n'
          '• List your vehicles for rent\n'
          '• Earn monthly income\n'
          '• Manage bookings\n'
          '• Access analytics dashboard\n\n'
          'Are you sure you want to proceed?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _upgradeToOwner(context, userId);
            },
            style: AppStyles.primaryButtonStyle(context),
            child: const Text('Upgrade'),
          ),
        ],
      ),
    );
  }

  Future<void> _upgradeToOwner(BuildContext context, String userId) async {
    // Show loading dialog
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => Center(
        child: Card(
          margin: const EdgeInsets.all(32),
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const CircularProgressIndicator(),
                const SizedBox(height: 16),
                Text('Upgrading to owner...', style: AppStyles.body(context)),
              ],
            ),
          ),
        ),
      ),
    );

    // Call service to upgrade role
    final userRoleService = UserRoleService();
    final result = await userRoleService.upgradeToOwner(userId);

    // Close loading dialog
    if (context.mounted) {
      Navigator.pop(context);
    }

    if (!context.mounted) return;

    if (result['success']) {
      // Show success dialog
      _showSuccessDialog(
        context,
        result['message'] ?? 'Role updated successfully',
      );
    } else {
      // Show error dialog
      _showErrorDialog(context, result['error'] ?? 'Failed to upgrade role');
    }
  }

  void _showSuccessDialog(BuildContext context, String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            Icon(Icons.celebration, color: AppStyles.primary, size: 32),
            const SizedBox(width: 12),
            const Text('Welcome, Owner!'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              message,
              style: AppStyles.body(
                context,
              ).copyWith(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 16),
            const Text(
              'You are now a vehicle owner!\n\n'
              'You can now:\n'
              '• Add your vehicles\n'
              '• Start earning income\n'
              '• Manage bookings\n'
              '• View analytics',
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Later'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              // Navigate to add vehicle screen
              Navigator.pushNamed(context, '/owner/vehicles/create');
            },
            style: AppStyles.primaryButtonStyle(context),
            child: const Text('Add My First Vehicle'),
          ),
        ],
      ),
    );
  }

  void _showErrorDialog(BuildContext context, String errorMessage) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(Icons.error_outline, color: Colors.red, size: 28),
            SizedBox(width: 12),
            Text('Upgrade Failed'),
          ],
        ),
        content: Text(
          'Failed to upgrade to owner:\n\n$errorMessage\n\n'
          'Please try again later or contact support.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppStyles.surface(context),
        borderRadius: BorderRadius.circular(16),
        image: const DecorationImage(
          image: AssetImage('assets/images/article.png'),
          fit: BoxFit.cover,
          opacity: 0.3,
        ),
      ),
      child: Column(
        children: [
          Text(
            'Do you want to become one of the\npartners of Wiz?',
            textAlign: TextAlign.center,
            style: AppStyles.body(context),
          ),
          const SizedBox(height: 8),
          Text(
            'Many car owners join with Wiz to increase\ntheir monthly income. You can be a part of us.',
            textAlign: TextAlign.center,
            style: AppStyles.caption(context),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            style: AppStyles.primaryButtonStyle(context).copyWith(
              padding: MaterialStateProperty.all(
                const EdgeInsets.symmetric(horizontal: 32, vertical: 14),
              ),
            ),
            onPressed: () => _handleRegisterNow(context),
            child: Text('Register Now', style: AppStyles.button),
          ),
        ],
      ),
    );
  }
}
