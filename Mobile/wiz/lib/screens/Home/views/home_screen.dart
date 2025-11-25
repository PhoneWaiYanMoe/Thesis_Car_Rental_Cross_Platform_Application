import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/screens/Home/views/dateTime_screen.dart';
import 'package:wiz/screens/Home/views/widgets/articles_section.dart';
import 'package:wiz/screens/Home/views/widgets/call_to_action.dart';
import 'package:wiz/screens/Home/views/widgets/clickable_field.dart';
import 'package:wiz/screens/Home/views/widgets/drive_toggle.dart';
import 'package:wiz/screens/Home/views/widgets/header.dart';
import 'package:wiz/screens/Home/views/widgets/search_button.dart';
import 'package:wiz/utils/app_routes.dart';
import 'package:wiz/utils/bottom_nav_bar.dart';
import 'package:wiz/screens/Auth/services/auth_service.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedTab = 0;
  final _authService = AuthService();

  // User info
  String _userName = '';
  String _userAvatar = 'assets/images/article_2.png';

  // Form data
  String? _location;
  String? _pickup;
  String? _destination;
  Map<String, String>? _dateTime;

  final List<Map<String, String>> _articles = [
    {'title': 'Terms and\nConditions', 'image': 'assets/images/article.png'},
    {'title': 'Cancellation\nrules', 'image': 'assets/images/article_2.png'},
  ];

  bool get _canSearch {
    if (_selectedTab == 0) {
      return _location != null && _dateTime != null;
    } else {
      return _pickup != null && _destination != null && _dateTime != null;
    }
  }

  @override
  void initState() {
    super.initState();
    _loadUserInfo();
  }

  Future<void> _loadUserInfo() async {
    final userInfo = await _authService.getUserInfo();
    setState(() {
      _userName = userInfo['userName'] ?? 'Guest';
      _userAvatar = userInfo['userAvatar'] ?? 'assets/images/article_2.png';
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppStyles.background(context),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Header(userName: _userName, userAvatar: _userAvatar),
              const SizedBox(height: 24),
              DriveToggle(
                selectedTab: _selectedTab,
                onTabChanged: (index) {
                  setState(() {
                    _selectedTab = index;
                    _location = _pickup = _destination = null;
                    _dateTime = null;
                  });
                },
              ),
              const SizedBox(height: 24),

              // DYNAMIC FIELDS
              if (_selectedTab == 0) ...[
                _buildLocationField(),
                const SizedBox(height: 16),
                _buildDateTimeField(),
              ] else ...[
                _buildPickupField(),
                const SizedBox(height: 16),
                _buildDestinationField(),
                const SizedBox(height: 16),
                _buildDateTimeField(),
              ],

              const SizedBox(height: 24),
              SearchButton(canSearch: _canSearch, onPressed: _canSearch ? _handleSearch : null),

              const SizedBox(height: 32),
              ArticlesSection(articles: _articles),
              const SizedBox(height: 32),
              CallToAction(),
              const SizedBox(height: 80),
            ],
          ),
        ),
      ),
      bottomNavigationBar: ButtonNavBar(),
    );
  }

  void _handleSearch() {
    final data = {
      'mode': _selectedTab == 0 ? 'Self Drive' : 'With Driver',
      'withDriver': _selectedTab == 1,
      'location': _location,
      'pickup': _pickup,
      'destination': _destination,
      'datetime': '${_dateTime!['start']} - ${_dateTime!['end']}',
    };
    AppRoutes.navigateTo(context, AppRoutes.cars, arguments: data);
  }

  Widget _buildLocationField() {
    return ClickableField(
      icon: Icons.location_on_outlined,
      hint: _location ?? 'Select Location',
      onTap: () => AppRoutes.navigateTo(context, AppRoutes.location, arguments: 'Select Location').then((v) {
        if (v != null) setState(() => _location = v);
      }),
    );
  }

  Widget _buildPickupField() {
    return ClickableField(
      icon: Icons.pin_drop_outlined,
      hint: _pickup ?? 'Pickup Location',
      onTap: () => AppRoutes.navigateTo(context, AppRoutes.location, arguments: 'Pickup Location').then((v) {
        if (v != null) setState(() => _pickup = v);
      }),
    );
  }

  Widget _buildDestinationField() {
    return ClickableField(
      icon: Icons.flag_outlined,
      hint: _destination ?? 'Destination',
      onTap: () => AppRoutes.navigateTo(context, AppRoutes.location, arguments: 'Destination').then((v) {
        if (v != null) setState(() => _destination = v);
      }),
    );
  }

  Widget _buildDateTimeField() {
    final text = _dateTime != null ? '${_dateTime!['start']} - ${_dateTime!['end']}' : 'Select Date & Time';
    return ClickableField(
      icon: Icons.calendar_today,
      hint: text,
      onTap: () async {
        final result = await Navigator.push(context, MaterialPageRoute(builder: (_) => const DateTimeScreen()));
        if (result != null) setState(() => _dateTime = result);
      },
    );
  }
}
