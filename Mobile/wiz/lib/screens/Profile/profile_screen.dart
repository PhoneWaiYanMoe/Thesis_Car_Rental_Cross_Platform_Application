// lib/screens/Profile/profile_screen.dart
import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/services/local_storage_service.dart';
import 'package:wiz/utils/app_routes.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final LocalStorageService _storageService = LocalStorageService();

  String _userName = 'Guest';
  String _userEmail = '';
  String _userAvatar = '';
  String _userRole = 'customer'; // Default role

  @override
  void initState() {
    super.initState();
    _loadUserInfo();
  }

  Future<void> _loadUserInfo() async {
    final userInfo = await _storageService.getUserInfo();
    if (mounted) {
      setState(() {
        _userName = userInfo['userName'] ?? 'Guest';
        _userEmail = userInfo['userEmail'] ?? '';
        _userAvatar = userInfo['userAvatar'] ?? '';
        // Get role from storage - you'll need to add this to local_storage_service
        // For now, we'll check if they have owner-specific data
        _userRole = userInfo['role'] ?? 'customer';
      });
    }
  }

  Future<void> _handleLogout() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Logout'),
        content: const Text('Are you sure you want to logout?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Logout'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      await _storageService.clearAuthData();
      if (mounted) {
        AppRoutes.navigateAndRemoveUntil(context, AppRoutes.login);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppStyles.background(context),
      appBar: AppBar(title: Text('Profile', style: AppStyles.h2(context)), centerTitle: true),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Profile Header
          Center(
            child: Column(
              children: [
                CircleAvatar(
                  radius: 50,
                  backgroundImage: _userAvatar.isNotEmpty ? AssetImage(_userAvatar) : null,
                  child: _userAvatar.isEmpty ? const Icon(Icons.person, size: 50) : null,
                ),
                const SizedBox(height: 16),
                Text(_userName, style: AppStyles.h2(context)),
                Text(_userEmail, style: AppStyles.caption(context)),
                const SizedBox(height: 8),
                // Role badge
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: _userRole == 'owner' ? Colors.purple.withOpacity(0.1) : AppStyles.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: _userRole == 'owner' ? Colors.purple : AppStyles.primary),
                  ),
                  child: Text(
                    _userRole.toUpperCase(),
                    style: TextStyle(
                      color: _userRole == 'owner' ? Colors.purple : AppStyles.primary,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 32),

          // Owner Section (only show if user is owner)
          if (_userRole == 'owner') ...[
            Text('Owner Dashboard', style: AppStyles.h3(context)),
            const SizedBox(height: 12),
            _buildMenuItem(
              icon: Icons.directions_car,
              title: 'My Vehicles',
              subtitle: 'Manage your vehicle listings',
              onTap: () => AppRoutes.navigateTo(context, AppRoutes.ownerVehicles),
              color: Colors.purple,
            ),
            const SizedBox(height: 12),
            _buildMenuItem(
              icon: Icons.analytics,
              title: 'Analytics',
              subtitle: 'View your performance',
              onTap: () {
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Coming soon!')));
              },
              color: Colors.blue,
            ),
            const SizedBox(height: 24),
          ],

          // Account Section
          Text('Account', style: AppStyles.h3(context)),
          const SizedBox(height: 12),

          _buildMenuItem(
            icon: Icons.person,
            title: 'Edit Profile',
            subtitle: 'Update your information',
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Coming soon!')));
            },
          ),
          const SizedBox(height: 12),

          _buildMenuItem(
            icon: Icons.credit_card,
            title: 'Payment Methods',
            subtitle: 'Manage payment options',
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Coming soon!')));
            },
          ),
          const SizedBox(height: 12),

          _buildMenuItem(
            icon: Icons.verified_user,
            title: 'Driver License',
            subtitle: 'Verify your license',
            onTap: () => AppRoutes.navigateTo(context, AppRoutes.licenseUpload),
          ),
          const SizedBox(height: 24),

          // Settings Section
          Text('Settings', style: AppStyles.h3(context)),
          const SizedBox(height: 12),

          _buildMenuItem(
            icon: Icons.notifications,
            title: 'Notifications',
            subtitle: 'Manage notifications',
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Coming soon!')));
            },
          ),
          const SizedBox(height: 12),

          _buildMenuItem(
            icon: Icons.language,
            title: 'Language',
            subtitle: 'Change language',
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Coming soon!')));
            },
          ),
          const SizedBox(height: 12),

          _buildMenuItem(
            icon: Icons.help,
            title: 'Help & Support',
            subtitle: 'Get help',
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Coming soon!')));
            },
          ),
          const SizedBox(height: 24),

          // Logout Button
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton.icon(
              onPressed: _handleLogout,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              icon: const Icon(Icons.logout, color: Colors.white),
              label: const Text(
                'Logout',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
              ),
            ),
          ),
          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _buildMenuItem({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
    Color? color,
  }) {
    return Card(
      color: AppStyles.surface(context),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: (color ?? AppStyles.primary).withOpacity(0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: color ?? AppStyles.primary),
        ),
        title: Text(title, style: AppStyles.body(context).copyWith(fontWeight: FontWeight.w600)),
        subtitle: Text(subtitle, style: AppStyles.caption(context)),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }
}
