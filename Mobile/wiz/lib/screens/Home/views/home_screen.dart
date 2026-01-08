import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/screens/Home/views/dateTime_screen.dart';
import 'package:wiz/screens/Home/views/widgets/articles_section.dart';
import 'package:wiz/screens/Home/views/widgets/call_to_action.dart';
import 'package:wiz/screens/Home/views/widgets/clickable_field.dart';
import 'package:wiz/screens/Home/views/widgets/drive_toggle.dart';
import 'package:wiz/screens/Home/views/widgets/header.dart';
import 'package:wiz/screens/Home/views/widgets/search_button.dart';
import 'package:wiz/services/local_storage_service.dart';
import 'package:wiz/utils/app_routes.dart';
import 'package:wiz/utils/bottom_nav_bar.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedTab = 0;
  final _localStorageService = LocalStorageService();

  // User info
  String _userName = '';
  String _userAvatar = 'assets/images/article_2.png';

  // Form data - location
  String? _location;
  String? _locationCity;
  String? _locationDistrict;
  double? _locationLatitude;
  double? _locationLongitude;

  // Form data - pickup/destination (for with-driver mode)
  String? _pickup;
  String? _pickupCity;
  String? _pickupDistrict;
  double? _pickupLatitude;
  double? _pickupLongitude;

  String? _destination;
  String? _destinationCity;
  String? _destinationDistrict;
  double? _destinationLatitude;
  double? _destinationLongitude;

  // Form data - datetime
  String? _dateTimeString;
  final List<Map<String, String>> _articles = [
    {'title': 'Terms and\nConditions', 'image': 'assets/images/article.png'},
    {'title': 'Cancellation\nrules', 'image': 'assets/images/article_2.png'},
  ];

  bool get _canSearch {
    if (_selectedTab == 0) {
      return _location != null && _dateTimeString != null;
    } else {
      return _pickup != null && _destination != null && _dateTimeString != null;
    }
  }

  @override
  void initState() {
    super.initState();
    _loadUserInfo();
  }

  Future<void> _loadUserInfo() async {
    final userInfo = await _localStorageService.getUserInfo();
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
                    // Clear all location data when switching tabs
                    _location = _locationCity = _locationDistrict = null;
                    _locationLatitude = _locationLongitude = null;
                    _pickup = _pickupCity = _pickupDistrict = null;
                    _pickupLatitude = _pickupLongitude = null;
                    _destination = _destinationCity = _destinationDistrict = null;
                    _destinationLatitude = _destinationLongitude = null;
                    _dateTimeString = null;
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
    print('🚗 Searching cars with:');
    print('   - Mode: ${_selectedTab == 0 ? "Self Drive" : "With Driver"}');
    print('   - Location: $_location');
    print('   - City: ${_selectedTab == 0 ? _locationCity : _pickupCity}');
    print('   - District: ${_selectedTab == 0 ? _locationDistrict : _pickupDistrict}');
    // print('   - DateTime: ${_dateTime!['start']} - ${_dateTime!['end']}');

    final data = {
      'mode': _selectedTab == 0 ? 'Self Drive' : 'With Driver',
      'withDriver': _selectedTab == 1,

      // Location data (for self-drive)
      'location': _location,
      'city': _locationCity,
      'district': _locationDistrict,
      'latitude': _locationLatitude,
      'longitude': _locationLongitude,

      // Pickup data (for with-driver)
      'pickup': _pickup,
      'pickupCity': _pickupCity,
      'pickupDistrict': _pickupDistrict,
      'pickupLatitude': _pickupLatitude,
      'pickupLongitude': _pickupLongitude,

      // Destination data (for with-driver)
      'destination': _destination,
      'destinationCity': _destinationCity,
      'destinationDistrict': _destinationDistrict,
      'destinationLatitude': _destinationLatitude,
      'destinationLongitude': _destinationLongitude,

      // DateTime
      'datetime': _dateTimeString ?? '',
      // Legacy field for backward compatibility
      'allCars': [],
    };

    AppRoutes.navigateTo(context, AppRoutes.cars, arguments: data);
  }

  Widget _buildLocationField() {
    return ClickableField(
      icon: Icons.location_on_outlined,
      hint: _location ?? 'Select Location',
      onTap: () async {
        final result = await AppRoutes.navigateTo(context, AppRoutes.map, arguments: 'Select Location');

        if (result != null && result is Map<String, dynamic>) {
          print('📍 Location result: $result');

          setState(() {
            _location = result['address'] as String?;
            _locationCity = result['city'] as String?;
            _locationDistrict = result['district'] as String?;
            _locationLatitude = result['latitude'] as double?;
            _locationLongitude = result['longitude'] as double?;
          });

          print('✅ Saved location - City: $_locationCity, District: $_locationDistrict');
        }
      },
    );
  }

  Widget _buildPickupField() {
    return ClickableField(
      icon: Icons.pin_drop_outlined,
      hint: _pickup ?? 'Pickup Location',
      onTap: () async {
        final result = await AppRoutes.navigateTo(context, AppRoutes.map, arguments: 'Pickup Location');

        if (result != null && result is Map<String, dynamic>) {
          print('📍 Pickup result: $result');

          setState(() {
            _pickup = result['address'] as String?;
            _pickupCity = result['city'] as String?;
            _pickupDistrict = result['district'] as String?;
            _pickupLatitude = result['latitude'] as double?;
            _pickupLongitude = result['longitude'] as double?;
          });

          print('✅ Saved pickup - City: $_pickupCity, District: $_pickupDistrict');
        }
      },
    );
  }

  Widget _buildDestinationField() {
    return ClickableField(
      icon: Icons.flag_outlined,
      hint: _destination ?? 'Destination',
      onTap: () async {
        final result = await AppRoutes.navigateTo(context, AppRoutes.map, arguments: 'Destination');

        if (result != null && result is Map<String, dynamic>) {
          print('📍 Destination result: $result');

          setState(() {
            _destination = result['address'] as String?;
            _destinationCity = result['city'] as String?;
            _destinationDistrict = result['district'] as String?;
            _destinationLatitude = result['latitude'] as double?;
            _destinationLongitude = result['longitude'] as double?;
          });

          print('✅ Saved destination - City: $_destinationCity, District: $_destinationDistrict');
        }
      },
    );
  }

  Widget _buildDateTimeField() {
    final text = _dateTimeString ?? 'Select Date & Time';

    return ClickableField(
      icon: Icons.calendar_today,
      hint: text,
      onTap: () async {
        final result = await Navigator.push(context, MaterialPageRoute(builder: (_) => const DateTimeScreen()));

        if (result != null && result is Map<String, dynamic>) {
          final newDateTime = result['datetime'] as String?;
          if (newDateTime != null) {
            setState(() {
              _dateTimeString = newDateTime;
            });
            print('DateTime selected: $_dateTimeString');
          }
        }
      },
    );
  }
}
