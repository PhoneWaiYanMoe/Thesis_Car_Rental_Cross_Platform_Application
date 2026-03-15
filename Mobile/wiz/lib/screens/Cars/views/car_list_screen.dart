// lib/screens/Cars/views/car_list_screen.dart
import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/screens/Cars/models/car.dart';
import 'package:wiz/screens/Cars/services/vehicle_api_service.dart';
import 'package:wiz/screens/Cars/services/car_filter_service.dart';
import 'package:wiz/screens/Cars/widgets/filter_widget.dart';
import 'widgets/_buildCarCard.dart';
import 'widgets/_buildTripSummary.dart';
import 'package:wiz/screens/Booking/models/booking_data.dart';

class CarListScreen extends StatefulWidget {
  final Map<String, dynamic> tripData;
  const CarListScreen({super.key, required this.tripData});

  @override
  State<CarListScreen> createState() => _CarListScreenState();
}

class _CarListScreenState extends State<CarListScreen> {
  final VehicleApiService _apiService = VehicleApiService();

  List<Car> _allCars = [];
  List<Car> _alternativeCars = []; // NEW: Cars available in other areas
  bool _isLoading = true;
  bool _isLoadingAlternatives = false;
  String? _error;
  bool _showNoVehiclesMessage = false; // NEW: Show no vehicles in area message
  String? _searchedLocation;

  // Filters
  RangeValues _priceRange = const RangeValues(300000, 2000000); // ✅ Lowered minimum to 300k
  int? _selectedSeats;
  String? _selectedFuel;
  String? _selectedType;
  String? _selectedTransmission;
  bool _instantBooking = false;
  bool _driverSupport = false;
  bool _discount = false;

  @override
  void initState() {
    super.initState();
    _loadVehicles();
  }

  Future<void> _loadVehicles() async {
    setState(() {
      _isLoading = true;
      _error = null;
      _showNoVehiclesMessage = false;
      _alternativeCars = [];
    });

    try {
      String? city = widget.tripData['city'] as String?;
      String? district = widget.tripData['district'] as String?;

      // For with-driver mode, use pickup location
      if (city == null && widget.tripData['pickupCity'] != null) {
        city = widget.tripData['pickupCity'] as String?;
        district = widget.tripData['pickupDistrict'] as String?;
      }

      final location = widget.tripData['location'] as String?;
      final datetime = widget.tripData['datetime'] as String?;

      // Store searched location for display
      _searchedLocation = location ?? (city != null ? '$district, $city' : null);

      print('🔍 Searching with filters:');
      print('   - City: $city');
      print('   - District: $district');
      print('   - Location (display): $location');

      // Parse dates with year rollover handling
      String? startDate;
      String? endDate;

      if (datetime != null && datetime.contains(' - ')) {
        final now = DateTime.now();
        final currentYear = now.year;

        final parts = datetime.split(' - ');
        if (parts.length == 2) {
          final startParts = parts[0].split(', ');
          if (startParts.length == 2) {
            final startDayMonth = startParts[1].split('/');
            if (startDayMonth.length == 2) {
              final startDay = int.parse(startDayMonth[0]);
              final startMonth = int.parse(startDayMonth[1]);

              int startYear = currentYear;
              if (startMonth < now.month || (startMonth == now.month && startDay < now.day)) {
                startYear = currentYear + 1;
              }

              startDate = '$startYear-${startMonth.toString().padLeft(2, '0')}-${startDay.toString().padLeft(2, '0')}';
            }
          }

          final endParts = parts[1].split(', ');
          if (endParts.length == 2) {
            final endDayMonth = endParts[1].split('/');
            if (endDayMonth.length == 2) {
              final endDay = int.parse(endDayMonth[0]);
              final endMonth = int.parse(endDayMonth[1]);

              int endYear = currentYear;
              if (startDate != null) {
                final parsedStartDate = DateTime.parse(startDate);
                if (endMonth < parsedStartDate.month ||
                    (endMonth == parsedStartDate.month && endDay < parsedStartDate.day)) {
                  endYear = parsedStartDate.year + 1;
                } else {
                  endYear = parsedStartDate.year;
                }
              }

              endDate = '$endYear-${endMonth.toString().padLeft(2, '0')}-${endDay.toString().padLeft(2, '0')}';
            }
          }
        }
      }

      print('🔍 Date range: $startDate to $endDate');

      // ✅ FIRST SEARCH: With location filter
      final response = await _apiService.searchVehicles(
        city: city,
        district: district,
        startDate: startDate,
        endDate: endDate,
        minPrice: _priceRange.start.toInt(),
        maxPrice: _priceRange.end.toInt(),
        minSeats: _selectedSeats,
        fuelType: _selectedFuel,
        vehicleType: _selectedType,
        transmission: _selectedTransmission,
        sortBy: 'price',
      );

      final cars = response.vehicles.map((v) => v.toCar()).toList();

      // ✅ CHECK: If no vehicles in searched location
      if (response.shouldShowNoVehiclesMessage) {
        print('⚠️ No vehicles found in $city, $district');
        print('🔄 Loading alternative vehicles...');

        setState(() {
          _allCars = [];
          _showNoVehiclesMessage = true;
          _isLoading = false;
          _isLoadingAlternatives = true;
        });

        // ✅ SECOND SEARCH: Without location filter, only time constraints
        await _loadAlternativeVehicles(startDate, endDate);
      } else {
        setState(() {
          _allCars = cars;
          _showNoVehiclesMessage = false;
          _isLoading = false;
        });

        print('✅ Loaded ${cars.length} vehicles in searched area');
      }
    } catch (e) {
      print('❌ Error loading vehicles: $e');
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  // ✅ NEW: Load alternative vehicles (without location filter)
  Future<void> _loadAlternativeVehicles(String? startDate, String? endDate) async {
    try {
      final response = await _apiService.searchVehicles(
        // NO city/district filter - show all vehicles
        startDate: startDate,
        endDate: endDate,
        minPrice: _priceRange.start.toInt(),
        maxPrice: _priceRange.end.toInt(),
        minSeats: _selectedSeats,
        fuelType: _selectedFuel,
        vehicleType: _selectedType,
        transmission: _selectedTransmission,
        sortBy: 'price',
      );

      final alternativeCars = response.vehicles.map((v) => v.toCar()).toList();

      setState(() {
        _alternativeCars = alternativeCars;
        _isLoadingAlternatives = false;
      });

      print('✅ Loaded ${alternativeCars.length} alternative vehicles');
    } catch (e) {
      print('❌ Error loading alternative vehicles: $e');
      setState(() {
        _isLoadingAlternatives = false;
      });
    }
  }

  List<Car> get _filteredCars {
    return CarFilterService.filterCars(
      cars: _allCars,
      priceRange: _priceRange,
      seats: _selectedSeats,
      fuel: _selectedFuel,
      type: _selectedType,
      transmission: _selectedTransmission,
      instant: _instantBooking,
      driver: _driverSupport,
      discount: _discount,
    );
  }

  List<Car> get _filteredAlternativeCars {
    return CarFilterService.filterCars(
      cars: _alternativeCars,
      priceRange: _priceRange,
      seats: _selectedSeats,
      fuel: _selectedFuel,
      type: _selectedType,
      transmission: _selectedTransmission,
      instant: _instantBooking,
      driver: _driverSupport,
      discount: _discount,
    );
  }

  @override
  Widget build(BuildContext context) {
    final displayData = Map<String, dynamic>.from(widget.tripData);
    displayData['carIndex'] = 0;
    final bookingData = BookingData.fromMap(displayData);

    return Scaffold(
      backgroundColor: AppStyles.background(context),
      appBar: AppBar(
        leading: IconButton(icon: const Icon(Icons.arrow_back), onPressed: () => Navigator.pop(context)),
        title: Text('Available Cars', style: AppStyles.h2(context)),
        centerTitle: true,
        actions: [
          IconButton(icon: const Icon(Icons.tune), onPressed: _showFilterSheet),
          IconButton(icon: const Icon(Icons.refresh), onPressed: _loadVehicles),
        ],
      ),
      body: Column(
        children: [
          BuildTripSummary(bookingData: bookingData),
          const SizedBox(height: 16),

          // Content
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                ? _buildErrorState()
                : _buildContent(),
          ),
        ],
      ),
    );
  }

  // ✅ NEW: Build content with message and alternative vehicles
  Widget _buildContent() {
    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      children: [
        // ✅ Show "No vehicles in this area" message
        if (_showNoVehiclesMessage) ...[
          _buildNoVehiclesMessage(),
          const SizedBox(height: 24),

          // Section title for alternative vehicles
          Text('Available Cars in Other Areas', style: AppStyles.h3(context)),
          const SizedBox(height: 12),
        ],

        // ✅ Show loading for alternative vehicles
        if (_isLoadingAlternatives)
          const Center(
            child: Padding(padding: EdgeInsets.all(32), child: CircularProgressIndicator()),
          ),
        if (_showNoVehiclesMessage && !_isLoadingAlternatives)
          if (_filteredAlternativeCars.isEmpty)
            _buildEmptyState()
          else
            ..._filteredAlternativeCars.asMap().entries.map((entry) {
              final car = entry.value; // ✅ Use car directly from alternative list
              return BuildCarCard(
                car: car, // ✅ CHANGED: Pass car object instead of index
                tripData: widget.tripData,
              );
            }),

        // ✅ Show alternative vehicles
        if (!_showNoVehiclesMessage && _filteredCars.isNotEmpty)
          ..._filteredCars.asMap().entries.map((entry) {
            final car = entry.value; // ✅ Use car directly from filtered list
            return BuildCarCard(
              car: car, // ✅ CHANGED: Pass car object instead of index
              tripData: widget.tripData,
            );
          }),

        // ✅ Show empty state if no vehicles at all
        if (!_showNoVehiclesMessage && _filteredCars.isEmpty) _buildEmptyState(),
      ],
    );
  }

  // ✅ NEW: No vehicles in area message container
  Widget _buildNoVehiclesMessage() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.orange.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.orange.shade300, width: 1.5),
      ),
      child: Column(
        children: [
          Icon(Icons.location_off, size: 48, color: Colors.orange.shade700),
          const SizedBox(height: 12),
          Text(
            'No Vehicles Available in This Area',
            style: AppStyles.h3(context).copyWith(color: Colors.orange.shade900),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            _searchedLocation != null
                ? 'We couldn\'t find any vehicles in "$_searchedLocation" for your selected dates.'
                : 'We couldn\'t find any vehicles in this area for your selected dates.',
            style: AppStyles.body(context).copyWith(color: Colors.orange.shade800),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8)),
            child: Row(
              children: [
                Icon(Icons.info_outline, color: AppStyles.primary, size: 20),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Showing available cars from nearby areas that match your dates',
                    style: AppStyles.caption(context),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.car_repair, size: 64, color: AppStyles.textSecondary(context).withOpacity(0.5)),
            const SizedBox(height: 16),
            Text('No cars found', style: AppStyles.body(context)),
            Text('Try adjusting filters or dates', style: AppStyles.caption(context)),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () {
                setState(() {
                  _resetFilters();
                });
                _loadVehicles();
              },
              style: AppStyles.primaryButtonStyle(context),
              icon: const Icon(Icons.refresh),
              label: const Text('Reset Filters'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error_outline, size: 64, color: Colors.red.withOpacity(0.5)),
          const SizedBox(height: 16),
          Text('Failed to load vehicles', style: AppStyles.body(context)),
          Text(_error ?? 'Unknown error', style: AppStyles.caption(context), textAlign: TextAlign.center),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: _loadVehicles,
            style: AppStyles.primaryButtonStyle(context),
            icon: const Icon(Icons.refresh),
            label: const Text('Retry'),
          ),
        ],
      ),
    );
  }

  // ... rest of the filter methods remain the same
  void _showFilterSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => StatefulBuilder(
        builder: (context, setSheetState) => DraggableScrollableSheet(
          expand: false,
          initialChildSize: 0.6,
          maxChildSize: 0.85,
          builder: (context, scrollController) => Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildSheetHandle(),
              _buildSheetHeader(setSheetState),
              const Divider(),
              Expanded(child: _buildFilterList(scrollController, setSheetState)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSheetHandle() {
    return Container(
      margin: const EdgeInsets.only(top: 12),
      height: 5,
      width: 40,
      decoration: BoxDecoration(color: Colors.grey[400], borderRadius: BorderRadius.circular(3)),
    );
  }

  Widget _buildSheetHeader(StateSetter setSheetState) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          TextButton(onPressed: () => _resetAndUpdate(setSheetState), child: const Text('Reset')),
          Text('Filter', style: AppStyles.h2(context)),
          TextButton(onPressed: () => _applyAndClose(setSheetState), child: const Text('Apply')),
        ],
      ),
    );
  }

  Widget _buildFilterList(ScrollController controller, StateSetter setSheetState) {
    return ListView(
      controller: controller,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      children: [
        PriceRangeFilter(values: _priceRange, onChanged: (v) => _update(setSheetState, () => _priceRange = v)),
        const SizedBox(height: 24),
        ChipFilter<int>(
          title: 'Seats',
          items: [4, 5, 7, 9],
          selected: _selectedSeats,
          labelBuilder: (s) => '$s',
          onSelected: (v) => _update(setSheetState, () => _selectedSeats = v),
        ),
        const SizedBox(height: 24),
        ChipFilter<String>(
          title: 'Fuel Type',
          items: ['Gasoline', 'Diesel', 'Electric', 'Hybrid'],
          selected: _selectedFuel,
          labelBuilder: (f) => f,
          onSelected: (v) => _update(setSheetState, () => _selectedFuel = v),
        ),
        const SizedBox(height: 24),
        ChipFilter<String>(
          title: 'Vehicle Type',
          items: ['Sedan', 'SUV', 'Hatchback', 'Van'],
          selected: _selectedType,
          labelBuilder: (t) => t,
          onSelected: (v) => _update(setSheetState, () => _selectedType = v),
        ),
        const SizedBox(height: 24),
        ChipFilter<String>(
          title: 'Transmission',
          items: ['Automatic', 'Manual', 'Semi-auto'],
          selected: _selectedTransmission,
          labelBuilder: (t) => t,
          onSelected: (v) => _update(setSheetState, () => _selectedTransmission = v),
        ),
        const SizedBox(height: 24),
        SwitchFilter(
          title: 'Instant Booking',
          value: _instantBooking,
          onChanged: (v) => _update(setSheetState, () => _instantBooking = v),
        ),
        const SizedBox(height: 24),
        SwitchFilter(
          title: 'Driver Supported',
          value: _driverSupport,
          onChanged: (v) => _update(setSheetState, () => _driverSupport = v),
        ),
        const SizedBox(height: 80),
      ],
    );
  }

  void _update(StateSetter setSheetState, VoidCallback update) {
    setSheetState(update);
    setState(() {});
  }

  void _resetAndUpdate(StateSetter setSheetState) {
    setSheetState(_resetFilters);
    setState(_resetFilters);
  }

  void _applyAndClose(StateSetter setSheetState) {
    setState(() {});
    Navigator.pop(context);
    _loadVehicles();
  }

  void _resetFilters() {
    _priceRange = const RangeValues(300000, 2000000);
    _selectedSeats = null;
    _selectedFuel = null;
    _selectedType = null;
    _selectedTransmission = null;
    _instantBooking = false;
    _driverSupport = false;
    _discount = false;
  }
}
