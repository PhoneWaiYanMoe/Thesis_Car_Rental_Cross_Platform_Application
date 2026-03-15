// lib/screens/Profile/profile_screen.dart
import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/services/local_storage_service.dart';
import 'package:wiz/services/logged_in_as_service.dart';
import 'package:wiz/services/user_role_service.dart';
import 'package:wiz/utils/app_routes.dart';
import 'package:wiz/utils/bottom_nav_bar.dart';
import 'package:wiz/screens/Chat/services/chat_service.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> with WidgetsBindingObserver {
  final LocalStorageService _localStorage = LocalStorageService();
  final LoggedInAsService _loggedInAsService = LoggedInAsService();
  final UserRoleService _roleService = UserRoleService();

  bool _isLoading = true;
  bool _isUpdatingToggle = false;
  String _userName = 'User';
  String _userEmail = '';
  String _userId = '';
  String _userRole = 'customer';
  String _activeRole = 'customer';
  String? _licenseNumber;

  @override
  void initState() {
    super.initState();
    _loadUserInfo();
    // Also refresh when app comes to foreground
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      print('📄 App resumed - refreshing user profile...');
      _refreshUserProfile();
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  Future<void> _loadUserInfo() async {
    setState(() => _isLoading = true);

    try {
      print('📄 Loading user info from SharedPreferences...');

      final userInfo = await _localStorage.getUserInfo();

      print('📦 Raw userInfo from storage: $userInfo');

      final userId = userInfo['userId'] ?? '';
      final userName = userInfo['userName'] ?? 'User';
      final userEmail = userInfo['userEmail'] ?? '';
      final role = userInfo['role'] ?? 'customer';
      final licenseNumber = userInfo['licenseNumber'];

      final loggedInAsResult = await _loggedInAsService.getLoggedInAs();
      final loggedInAs = loggedInAsResult['logged_in_as'] ?? 'customer';

      setState(() {
        _userId = userId;
        _userName = userName;
        _userEmail = userEmail;
        _userRole = role;
        _activeRole = loggedInAs;
        _licenseNumber = licenseNumber;
        _isLoading = false;
      });

      print('✅ Profile loaded:');
      print('   - userId: $_userId');
      print('   - userName: $_userName');
      print('   - userEmail: $_userEmail');
      print('   - userRole: $_userRole');
      print('   - activeRole (from API): $_activeRole');

      if (_userId.isEmpty) print('⚠️ WARNING: userId is empty!');
      if (_userEmail.isEmpty) print('⚠️ WARNING: userEmail is empty!');
    } catch (e) {
      print('❌ Error loading user info: $e');
      setState(() {
        _userRole = 'customer';
        _activeRole = 'customer';
        _isLoading = false;
      });
    }
  }

  /// ✅ Refresh user profile from backend to get latest role/status
  Future<void> _refreshUserProfile() async {
    if (_userId.isEmpty) return;

    try {
      print('🔄 Refreshing user profile...');
      final profileResult = await _roleService.getUserProfile(_userId);

      if (profileResult['success'] && profileResult['user'] != null) {
        final updatedUser = profileResult['user'];
        final updatedRole = updatedUser['role'] ?? 'customer';

        print('✅ Profile refreshed: role=$updatedRole, owner_status=${updatedUser['owner_status']}');

        // Update local storage and UI if role changed
        if (updatedRole != _userRole) {
          final token = await _localStorage.getToken();
          await _localStorage.saveAuthData(
            token: token ?? '',
            refreshToken: token ?? '',
            user: {
              'id': updatedUser['user_id'] ?? _userId,
              'fullName': _userName,
              'email': updatedUser['email'] ?? _userEmail,
              'role': updatedRole,
            },
          );

          if (mounted) {
            setState(() => _userRole = updatedRole);
          }
        }
      }
    } catch (e) {
      print('⚠️ Error refreshing profile: $e');
      // Silently fail - don't show error to user
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
          SizedBox(
            width: 100,
            height: 60,
            child: ElevatedButton(
              onPressed: () => Navigator.pop(context, true),
              style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
              child: const Text('Logout'),
            ),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    // Disconnect chat socket and clear cached profiles from previous user
    await ChatService().logout();

    await _localStorage.clearAuthData();
    if (mounted) {
      AppRoutes.navigateAndRemoveUntil(context, AppRoutes.login);
    }
  }

  Future<void> _toggleRole() async {
    if (_isUpdatingToggle) return;

    final newRole = _activeRole == 'owner' ? 'customer' : 'owner';

    if (_userRole != 'owner' && newRole == 'owner') {
      _showUpgradeDialog();
      return;
    }

    setState(() => _isUpdatingToggle = true);

    try {
      print('📤 Updating logged_in_as to $newRole...');

      final result = await _loggedInAsService.updateLoggedInAs(newRole);

      if (mounted) {
        if (result['success']) {
          setState(() {
            _activeRole = result['logged_in_as'] ?? newRole;
            _isUpdatingToggle = false;
          });

          print('✅ Successfully switched to $_activeRole mode');

          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(_activeRole == 'owner' ? 'Switched to Owner mode' : 'Switched to Customer mode'),
              backgroundColor: AppStyles.primary,
              duration: const Duration(seconds: 2),
            ),
          );
        } else {
          setState(() => _isUpdatingToggle = false);

          print('❌ Failed to update: ${result['error']}');

          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result['error'] ?? 'Failed to switch mode'),
              backgroundColor: Colors.red,
              duration: const Duration(seconds: 3),
            ),
          );
        }
      }
    } catch (e) {
      print('❌ Toggle error: $e');

      if (mounted) {
        setState(() => _isUpdatingToggle = false);

        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error: ${e.toString()}'), backgroundColor: Colors.red));
      }
    }
  }

  void _showUpgradeDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            Icon(Icons.info_outline, color: AppStyles.primary),
            const SizedBox(width: 12),
            const Text('Become a Vehicle Owner'),
          ],
        ),
        content: const Text(
          'To access Owner mode, you need to upgrade your account to Vehicle Owner.\n\n'
          'A verification request will be automatically created for our support team to review.',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              await _performUpgradeToOwner();
            },
            style: AppStyles.primaryButtonStyle(context),
            child: const Text('Upgrade to Owner'),
          ),
        ],
      ),
    );
  }

  Future<void> _performUpgradeToOwner() async {
    setState(() => _isUpdatingToggle = true);

    try {
      final userId = _userId;
      if (userId == null || userId.isEmpty) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Error: User ID not found'), backgroundColor: Colors.red));
        setState(() => _isUpdatingToggle = false);
        return;
      }

      print('📤 Upgrading user to Owner...');

      final result = await _roleService.upgradeToOwner(userId);

      if (mounted) {
        if (result['success']) {
          print('✅ Successfully upgraded to Owner');

          // ✅ Fetch fresh user data from backend to get updated owner_status
          print('📥 Fetching fresh user profile...');
          final profileResult = await _roleService.getUserProfile(userId);

          if (profileResult['success'] && profileResult['user'] != null) {
            final updatedUser = profileResult['user'];
            print('✅ Fresh profile loaded: role=${updatedUser['role']}, owner_status=${updatedUser['owner_status']}');

            // Update local storage with complete user data
            final token = await _localStorage.getToken();
            await _localStorage.saveAuthData(
              token: token ?? '',
              refreshToken: token ?? '',
              user: {
                'id': updatedUser['user_id'] ?? userId,
                'fullName': _userName,
                'email': updatedUser['email'] ?? _userEmail,
                'role': updatedUser['role'] ?? 'owner',
              },
            );
          }

          setState(() {
            _userRole = 'owner';
            _isUpdatingToggle = false;
          });

          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: const Text('✅ Upgraded to Owner! Verification pending review.'),
              backgroundColor: Colors.green,
              duration: const Duration(seconds: 3),
            ),
          );
        } else {
          setState(() => _isUpdatingToggle = false);

          print('❌ Upgrade failed: ${result['error']}');

          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result['error'] ?? 'Failed to upgrade'),
              backgroundColor: Colors.red,
              duration: const Duration(seconds: 3),
            ),
          );
        }
      }
    } catch (e) {
      print('❌ Upgrade error: $e');

      if (mounted) {
        setState(() => _isUpdatingToggle = false);

        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error: ${e.toString()}'), backgroundColor: Colors.red));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        backgroundColor: AppStyles.background(context),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_userId.isEmpty && _userEmail.isEmpty) {
      return Scaffold(
        backgroundColor: AppStyles.background(context),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 64, color: Colors.red),
              const SizedBox(height: 16),
              const Text('Failed to load user data', style: TextStyle(fontSize: 18)),
              const SizedBox(height: 8),
              const Text('Please try logging in again', style: TextStyle(color: Colors.grey)),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () async {
                  await ChatService().logout();
                  await _localStorage.clearAuthData();
                  if (mounted) {
                    AppRoutes.navigateAndRemoveUntil(context, AppRoutes.login);
                  }
                },
                style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                child: const Text('Logout'),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppStyles.background(context),
      body: SafeArea(
        child: Column(
          children: [
            // Header with role badge
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [AppStyles.primary, AppStyles.primaryDark],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 50,
                    backgroundColor: Colors.white,
                    child: Icon(
                      _activeRole == 'owner' ? Icons.business : Icons.person,
                      size: 50,
                      color: AppStyles.primary,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    _userName,
                    style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                  const SizedBox(height: 4),
                  Text(_userEmail, style: const TextStyle(fontSize: 14, color: Colors.white70)),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: Colors.white.withOpacity(0.5)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(_activeRole == 'owner' ? Icons.business : Icons.person, size: 16, color: Colors.white),
                        const SizedBox(width: 6),
                        Text(
                          _activeRole.toUpperCase(),
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Role Switcher (only for owners)
            if (_userRole == 'owner') ...[
              Container(
                margin: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppStyles.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppStyles.primary),
                ),
                child: ListTile(
                  leading: _isUpdatingToggle
                      ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2))
                      : Icon(Icons.swap_horiz, color: AppStyles.primary),
                  title: Text(
                    _isUpdatingToggle
                        ? 'Updating...'
                        : 'Switch to ${_activeRole == 'owner' ? 'Customer' : 'Owner'} Mode',
                    style: TextStyle(color: AppStyles.primary, fontWeight: FontWeight.w600),
                  ),
                  subtitle: Text(
                    _activeRole == 'owner' ? 'Manage your vehicles and bookings' : 'Browse and rent vehicles',
                    style: AppStyles.caption(context),
                  ),
                  trailing: Switch(
                    value: _activeRole == 'owner',
                    activeColor: AppStyles.primary,
                    onChanged: _isUpdatingToggle ? null : (_) => _toggleRole(),
                  ),
                  onTap: _isUpdatingToggle ? null : _toggleRole,
                ),
              ),
            ],

            // Menu Items
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                children: [
                  const SizedBox(height: 8),

                  if (_userRole == 'owner' && _activeRole == 'owner') ...[
                    Text('Owner Dashboard', style: AppStyles.h3(context)),
                    const SizedBox(height: 12),

                    _buildMenuItem(
                      icon: Icons.directions_car,
                      title: 'My Vehicles',
                      subtitle: 'Manage your vehicle listings',
                      onTap: () => AppRoutes.navigateTo(context, AppRoutes.ownerVehicles),
                    ),

                    _buildMenuItem(
                      icon: Icons.add_circle_outline,
                      title: 'Add New Vehicle',
                      subtitle: 'List a new vehicle for rent',
                      onTap: () => AppRoutes.navigateTo(context, AppRoutes.ownerVehicleCreate),
                    ),

                    _buildMenuItem(
                      icon: Icons.history,
                      title: 'Booking Requests',
                      subtitle: 'View and manage booking requests',
                      onTap: () => AppRoutes.navigateTo(context, AppRoutes.ownerBookings),
                    ),

                    const SizedBox(height: 24),
                    const Divider(),
                    const SizedBox(height: 12),
                  ],

                  Text('Account', style: AppStyles.h3(context)),
                  const SizedBox(height: 12),

                  _buildMenuItem(
                    icon: Icons.person,
                    title: 'Edit Profile',
                    subtitle: 'Update your information',
                    onTap: () {
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Coming soon')));
                    },
                  ),

                  _buildMenuItem(
                    icon: Icons.credit_card,
                    title: 'Driver License',
                    subtitle: _licenseNumber != null ? 'License: $_licenseNumber' : 'Not uploaded yet',
                    onTap: () =>
                        AppRoutes.navigateTo(context, AppRoutes.licenseUpload, arguments: {'fromBooking': false}),
                  ),

                  _buildMenuItem(
                    icon: Icons.history,
                    title: 'Rental History',
                    subtitle: 'View your past rentals',
                    onTap: () => AppRoutes.navigateTo(context, AppRoutes.rentalHistory),
                  ),

                  _buildMenuItem(
                    icon: Icons.favorite,
                    title: 'Favorite Vehicles',
                    subtitle: 'View your saved vehicles',
                    onTap: () => AppRoutes.navigateTo(context, AppRoutes.favoriteCars),
                  ),

                  const SizedBox(height: 24),
                  const Divider(),
                  const SizedBox(height: 12),

                  Text('Settings', style: AppStyles.h3(context)),
                  const SizedBox(height: 12),

                  _buildMenuItem(
                    icon: Icons.notifications,
                    title: 'Notifications',
                    subtitle: 'Manage notification preferences',
                    onTap: () {
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Coming soon')));
                    },
                  ),

                  _buildMenuItem(
                    icon: Icons.help,
                    title: 'Help & Support',
                    subtitle: 'Get help with the app',
                    onTap: () {
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Coming soon')));
                    },
                  ),

                  const SizedBox(height: 24),

                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                    child: ElevatedButton.icon(
                      onPressed: _handleLogout,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.red,
                        padding: const EdgeInsets.symmetric(vertical: 16),
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
            ),
          ],
        ),
      ),
      bottomNavigationBar: const ButtonNavBar(),
    );
  }

  Widget _buildMenuItem({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return Card(
      color: AppStyles.surface(context),
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(color: AppStyles.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
          child: Icon(icon, color: AppStyles.primary),
        ),
        title: Text(title, style: AppStyles.body(context).copyWith(fontWeight: FontWeight.w600)),
        subtitle: Text(subtitle, style: AppStyles.caption(context)),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }
}
