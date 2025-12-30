import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/services/location_service.dart';
import 'package:wiz/screens/Location/services/location_api_service.dart';
import 'location_search_screen.dart';

class MapScreen extends StatefulWidget {
  final String title;

  const MapScreen({super.key, this.title = 'Select Location'});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  final MapController _mapController = MapController();
  final LocationService _locationService = LocationService();
  final LocationApiService _locationApiService = LocationApiService();

  LatLng _currentPosition = const LatLng(10.8231, 106.6297);
  LatLng? _selectedPosition;
  String? _selectedAddress;
  bool _isLoadingLocation = false;
  bool _isLoadingAddress = false;
  bool _hasLocationPermission = false;

  @override
  void initState() {
    super.initState();
    _initializeLocation();
  }

  Future<void> _initializeLocation() async {
    setState(() => _isLoadingLocation = true);

    try {
      final lastKnown = await _locationService.getLastKnownPosition();
      if (lastKnown != null && mounted) {
        setState(() {
          _currentPosition = lastKnown;
          _hasLocationPermission = true;
        });
        _mapController.move(_currentPosition, 15);
      }

      final current = await _locationService.getCurrentPosition();
      if (current != null && mounted) {
        setState(() {
          _currentPosition = current;
          _hasLocationPermission = true;
        });
        _mapController.move(_currentPosition, 15);
      }
    } catch (e) {
      print('Error initializing location: $e');
      setState(() => _hasLocationPermission = false);
    } finally {
      if (mounted) {
        setState(() => _isLoadingLocation = false);
      }
    }
  }

  Future<void> _moveToCurrentLocation() async {
    setState(() => _isLoadingLocation = true);

    final position = await _locationService.getCurrentPosition();

    if (position != null && mounted) {
      setState(() {
        _currentPosition = position;
        _hasLocationPermission = true;
      });
      _mapController.move(_currentPosition, 15);
    } else if (mounted) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Unable to get current location'), backgroundColor: Colors.red));
    }

    if (mounted) {
      setState(() => _isLoadingLocation = false);
    }
  }

  Future<void> _handleMapTap(LatLng position) async {
    setState(() {
      _selectedPosition = position;
      _selectedAddress = null;
      _isLoadingAddress = true;
    });

    final address = await _locationApiService.reverseGeocode(position);
    if (address != null && mounted) {
      setState(() {
        _selectedAddress = address;
        _isLoadingAddress = false;
      });
    } else if (mounted) {
      setState(() => _isLoadingAddress = false);
    }
  }

  Future<void> _handleSearchResult(SearchResult result) async {
    print('📍 Received search result: displayName=${result.displayName}, shortName=${result.shortName}');

    // Use displayName if available, otherwise fallback to shortName
    final address = result.displayName.trim().isNotEmpty
        ? result.displayName
        : result.shortName.trim().isNotEmpty
        ? result.shortName
        : 'Unknown Location';

    setState(() {
      _selectedPosition = result.position;
      _selectedAddress = address;
      _isLoadingAddress = false;
    });

    _mapController.move(result.position, 15);

    // Save to backend history
    // Ensure displayName is not empty - use shortName as fallback
    final displayName = result.displayName.trim().isNotEmpty
        ? result.displayName
        : result.shortName.trim().isNotEmpty
        ? result.shortName
        : 'Unknown Location';

    final saved = await _locationApiService.saveToHistory(
      displayName: displayName,
      shortName: result.shortName,
      subtitle: result.subtitle,
      latitude: result.position.latitude,
      longitude: result.position.longitude,
    );

    if (saved) {
      print('✅ Location saved to backend history');
    } else {
      print('⚠️ Failed to save location to backend history');
    }
  }

  void _confirmSelection() {
    if (_selectedPosition != null && _selectedAddress != null) {
      print('✅ Confirming location: $_selectedAddress');

      // ✅ FIXED: Extract city and district from address
      // Format: "Street, District, City, Country"
      final parts = _selectedAddress!.split(',').map((e) => e.trim()).toList();

      String city = 'Ho Chi Minh City'; // Default
      String district = '';

      if (parts.length >= 3) {
        district = parts[1]; // Second part is usually district
        city = parts[2]; // Third part is usually city
      } else if (parts.length == 2) {
        district = parts[0];
        city = parts[1];
      } else if (parts.length == 1) {
        city = parts[0];
      }

      print('📍 Extracted - City: $city, District: $district');

      Navigator.pop(context, {
        'address': _selectedAddress,
        'city': city,
        'district': district,
        'latitude': _selectedPosition!.latitude,
        'longitude': _selectedPosition!.longitude,
      });
    } else {
      print('⚠️ Cannot confirm - missing position or address');
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Please select a location first'), backgroundColor: Colors.orange));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppStyles.background(context),
      body: Stack(
        children: [
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: _currentPosition,
              initialZoom: 15,
              onTap: (_, position) => _handleMapTap(position),
              interactionOptions: const InteractionOptions(flags: InteractiveFlag.all),
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.wiz.carRental',
                maxZoom: 19,
              ),
              if (_hasLocationPermission)
                MarkerLayer(
                  markers: [
                    Marker(
                      point: _currentPosition,
                      width: 40,
                      height: 40,
                      child: Container(
                        decoration: BoxDecoration(
                          color: Colors.blue.withOpacity(0.3),
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.blue, width: 2),
                        ),
                        child: const Icon(Icons.my_location, color: Colors.blue, size: 20),
                      ),
                    ),
                  ],
                ),
              if (_selectedPosition != null)
                MarkerLayer(
                  markers: [
                    Marker(
                      point: _selectedPosition!,
                      width: 50,
                      height: 50,
                      child: const Icon(Icons.location_on, color: Colors.red, size: 50),
                    ),
                  ],
                ),
            ],
          ),
          SafeArea(
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: GestureDetector(
                    onTap: () async {
                      final result = await Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => LocationSearchScreen(title: widget.title)),
                      );

                      print('🔍 Search screen returned: $result');

                      if (result != null && result is SearchResult) {
                        _handleSearchResult(result);
                      }
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      decoration: BoxDecoration(
                        color: AppStyles.surface(context),
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [
                          BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 10, offset: const Offset(0, 2)),
                        ],
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.search),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              _selectedAddress ?? 'Search location...',
                              style: AppStyles.body(context).copyWith(
                                color: _selectedAddress != null
                                    ? AppStyles.textPrimary(context)
                                    : AppStyles.textSecondary(context),
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          Positioned(
            right: 16,
            bottom: 200,
            child: FloatingActionButton(
              backgroundColor: AppStyles.surface(context),
              onPressed: _isLoadingLocation ? null : _moveToCurrentLocation,
              child: _isLoadingLocation
                  ? const CircularProgressIndicator()
                  : Icon(Icons.my_location, color: AppStyles.primary),
            ),
          ),
          if (_selectedPosition != null)
            Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              child: Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppStyles.surface(context),
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 10, offset: const Offset(0, -2)),
                  ],
                ),
                child: SafeArea(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(Icons.location_on, color: AppStyles.primary),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Selected Location', style: AppStyles.caption(context)),
                                const SizedBox(height: 4),
                                if (_isLoadingAddress)
                                  const SizedBox(
                                    height: 20,
                                    width: 20,
                                    child: CircularProgressIndicator(strokeWidth: 2),
                                  )
                                else
                                  Text(
                                    _selectedAddress ?? 'Loading address...',
                                    style: AppStyles.body(context).copyWith(fontWeight: FontWeight.w600),
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          style: AppStyles.primaryButtonStyle(context),
                          onPressed: (_selectedAddress != null && !_isLoadingAddress) ? _confirmSelection : null,
                          child: Text('Confirm Location', style: AppStyles.button),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _mapController.dispose();
    super.dispose();
  }
}
