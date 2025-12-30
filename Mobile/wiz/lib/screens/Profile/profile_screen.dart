// lib/screens/profile_screen.dart
import 'package:flutter/material.dart';
import '../../services/auth_services.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({Key? key}) : super(key: key);

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final AuthService _authService = AuthService();

  Map<String, String?> _userInfo = {};
  bool _isLoading = true;
  bool _canSwitchRoles = false;

  @override
  void initState() {
    super.initState();
    _loadUserProfile();
  }

  Future<void> _loadUserProfile() async {
    setState(() => _isLoading = true);

    try {
      // Fetch fresh profile from backend
      final profile = await _authService.getUserProfile();

      // Get updated user info
      _userInfo = await _authService.getUserInfo();

      // Check if user can switch roles
      _canSwitchRoles = await _authService.canSwitchRoles();

      print('✅ Profile loaded: role=${_userInfo['role']}, activeRole=${_userInfo['activeRole']}');
      print('📦 Full user info: $_userInfo');
      print('🔄 Can switch roles: $_canSwitchRoles');
    } catch (e) {
      print('❌ Error loading profile: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _switchRole() async {
    final currentActiveRole = _userInfo['activeRole'] ?? 'customer';
    final newRole = currentActiveRole == 'owner' ? 'customer' : 'owner';

    await _authService.setActiveRole(newRole);

    // Show snackbar
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Switched to ${newRole.toUpperCase()} mode'), duration: const Duration(seconds: 2)),
      );
    }

    // Reload profile
    _loadUserProfile();

    // You might want to trigger a full app reload or navigation reset here
    // For example: Navigator.of(context).pushReplacementNamed('/home');
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    final actualRole = _userInfo['role'] ?? 'customer';
    final activeRole = _userInfo['activeRole'] ?? 'customer';
    final isOwnerViewingAsCustomer = actualRole == 'owner' && activeRole == 'customer';
    final isOwnerViewingAsOwner = actualRole == 'owner' && activeRole == 'owner';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
        actions: [
          // ✅ Role indicator badge
          if (_canSwitchRoles)
            Padding(
              padding: const EdgeInsets.only(right: 16),
              child: Center(
                child: Chip(
                  avatar: Icon(activeRole == 'owner' ? Icons.car_rental : Icons.person, size: 16),
                  label: Text(
                    activeRole.toUpperCase(),
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                  ),
                  backgroundColor: activeRole == 'owner' ? Colors.blue.shade100 : Colors.green.shade100,
                ),
              ),
            ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // User Info Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 40,
                      backgroundImage: _userInfo['userAvatar'] != null ? NetworkImage(_userInfo['userAvatar']!) : null,
                      child: _userInfo['userAvatar'] == null ? const Icon(Icons.person, size: 40) : null,
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _userInfo['userName'] ?? 'User',
                            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 4),
                          Text(_userInfo['userEmail'] ?? '', style: TextStyle(color: Colors.grey[600], fontSize: 14)),
                          const SizedBox(height: 8),
                          // Role badges
                          Row(
                            children: [
                              Chip(
                                label: Text(
                                  'Account: ${actualRole.toUpperCase()}',
                                  style: const TextStyle(fontSize: 11),
                                ),
                                backgroundColor: Colors.orange.shade100,
                                padding: EdgeInsets.zero,
                              ),
                              if (_canSwitchRoles) ...[
                                const SizedBox(width: 8),
                                Chip(
                                  label: Text(
                                    'Viewing as: ${activeRole.toUpperCase()}',
                                    style: const TextStyle(fontSize: 11),
                                  ),
                                  backgroundColor: activeRole == 'owner' ? Colors.blue.shade100 : Colors.green.shade100,
                                  padding: EdgeInsets.zero,
                                ),
                              ],
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 24),

            // ✅ Role Switching Card (only for owners)
            if (_canSwitchRoles) ...[
              Card(
                color: Colors.blue.shade50,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(Icons.swap_horiz, color: Colors.blue.shade700),
                          const SizedBox(width: 8),
                          Text(
                            'Role Switching',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.blue.shade700),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'You have an OWNER account. Switch between owner and customer views:',
                        style: TextStyle(color: Colors.grey[700], fontSize: 14),
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(
                            child: ElevatedButton.icon(
                              onPressed: isOwnerViewingAsOwner ? null : _switchRole,
                              icon: const Icon(Icons.car_rental),
                              label: const Text('Owner Mode'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: isOwnerViewingAsOwner ? Colors.blue : Colors.grey,
                                foregroundColor: Colors.white,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: ElevatedButton.icon(
                              onPressed: isOwnerViewingAsCustomer ? null : _switchRole,
                              icon: const Icon(Icons.person),
                              label: const Text('Customer Mode'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: isOwnerViewingAsCustomer ? Colors.green : Colors.grey,
                                foregroundColor: Colors.white,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.amber.shade50,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.amber.shade200),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.info_outline, size: 20, color: Colors.amber.shade700),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                activeRole == 'owner'
                                    ? 'Owner mode: Manage your vehicles and bookings'
                                    : 'Customer mode: Browse and book vehicles',
                                style: TextStyle(fontSize: 12, color: Colors.amber.shade900),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
            ],

            // Profile Actions
            ListTile(
              leading: const Icon(Icons.edit),
              title: const Text('Edit Profile'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () {
                // Navigate to edit profile
              },
            ),
            ListTile(
              leading: const Icon(Icons.security),
              title: const Text('Security'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () {
                // Navigate to security settings
              },
            ),
            ListTile(
              leading: const Icon(Icons.history),
              title: const Text('Booking History'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () {
                // Navigate to booking history
              },
            ),
            if (isOwnerViewingAsOwner) ...[
              const Divider(),
              ListTile(
                leading: const Icon(Icons.directions_car),
                title: const Text('My Vehicles'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () {
                  // Navigate to vehicles
                },
              ),
              ListTile(
                leading: const Icon(Icons.calendar_today),
                title: const Text('Rental Requests'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () {
                  // Navigate to rental requests
                },
              ),
            ],
            const Divider(),
            ListTile(
              leading: const Icon(Icons.logout, color: Colors.red),
              title: const Text('Logout', style: TextStyle(color: Colors.red)),
              onTap: () async {
                await _authService.logout();
                if (mounted) {
                  Navigator.of(context).pushReplacementNamed('/login');
                }
              },
            ),
          ],
        ),
      ),
    );
  }
}
