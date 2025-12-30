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
  bool _isLoading = true;
  String? _error;

  // Filters
  RangeValues _priceRange = const RangeValues(500000, 2000000);
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
    });

    try {
      // ✅ Get city and district directly from tripData
      String? city = widget.tripData['city'] as String?;
      String? district = widget.tripData['district'] as String?;

      // For with-driver mode, use pickup location
      if (city == null && widget.tripData['pickupCity'] != null) {
        city = widget.tripData['pickupCity'] as String?;
        district = widget.tripData['pickupDistrict'] as String?;
      }

      final location = widget.tripData['location'] as String?;
      final datetime = widget.tripData['datetime'] as String?;

      print('🔍 Searching with filters:');
      print('   - City: $city');
      print('   - District: $district');
      print('   - Location (display): $location');
      // ✅ FIXED: Parse dates with year rollover handling
      String? startDate;
      String? endDate;

      if (datetime != null && datetime.contains(' - ')) {
        final now = DateTime.now();
        final currentYear = now.year;

        final parts = datetime.split(' - ');
        if (parts.length == 2) {
          // Parse start date: "HH:MM, DD/MM"
          final startParts = parts[0].split(', ');
          if (startParts.length == 2) {
            final startDayMonth = startParts[1].split('/');
            if (startDayMonth.length == 2) {
              final startDay = int.parse(startDayMonth[0]);
              final startMonth = int.parse(startDayMonth[1]);

              // Determine year based on current date
              int startYear = currentYear;
              if (startMonth < now.month || (startMonth == now.month && startDay < now.day)) {
                startYear = currentYear + 1;
              }

              startDate = '$startYear-${startMonth.toString().padLeft(2, '0')}-${startDay.toString().padLeft(2, '0')}';
            }
          }

          // Parse end date: "HH:MM, DD/MM"
          final endParts = parts[1].split(', ');
          if (endParts.length == 2) {
            final endDayMonth = endParts[1].split('/');
            if (endDayMonth.length == 2) {
              final endDay = int.parse(endDayMonth[0]);
              final endMonth = int.parse(endDayMonth[1]);

              // Determine year - if end month < start month, it's next year
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

      print('🔍 Searching with filters:');
      print('   - City: $city');
      print('   - District: $district');
      print('   - Start Date: $startDate');
      print('   - End Date: $endDate');

      // Validate dates
      if (startDate != null && endDate != null) {
        final start = DateTime.parse(startDate);
        final end = DateTime.parse(endDate);
        if (end.isBefore(start)) {
          print('⚠️ WARNING: End date is before start date!');
          throw Exception('Invalid date range');
        }
      }

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

      setState(() {
        _allCars = cars;
        _isLoading = false;
      });

      print('✅ Loaded ${cars.length} vehicles');
    } catch (e) {
      print('❌ Error loading vehicles: $e');
      setState(() {
        _error = e.toString();
        _isLoading = false;
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

          // Loading / Error / Content
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                ? _buildErrorState()
                : _filteredCars.isEmpty
                ? _buildEmptyState()
                : _buildCarList(),
          ),
        ],
      ),
    );
  }

  Widget _buildCarList() {
    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      itemCount: _filteredCars.length,
      itemBuilder: (context, i) {
        final carIndex = _allCars.indexOf(_filteredCars[i]);
        return BuildCarCard(carIndex: carIndex, allCars: _allCars, tripData: widget.tripData);
      },
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.car_repair, size: 64, color: AppStyles.textSecondary(context).withOpacity(0.5)),
          const SizedBox(height: 16),
          Text('No cars found', style: AppStyles.body(context)),
          Text('Try adjusting filters', style: AppStyles.caption(context)),
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

  void _showFilterSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => StatefulBuilder(
        builder: (context, setSheetState) => DraggableScrollableSheet(
          initialChildSize: 0.9,
          maxChildSize: 0.95,
          builder: (_, controller) => Container(
            decoration: BoxDecoration(
              color: AppStyles.background(context),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
            ),
            child: Column(
              children: [
                _buildSheetHandle(),
                _buildSheetHeader(setSheetState),
                Expanded(child: _buildFilterList(controller, setSheetState)),
              ],
            ),
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
    _loadVehicles(); // Reload with new filters
  }

  void _resetFilters() {
    _priceRange = const RangeValues(500000, 2000000);
    _selectedSeats = null;
    _selectedFuel = null;
    _selectedType = null;
    _selectedTransmission = null;
    _instantBooking = false;
    _driverSupport = false;
    _discount = false;
  }
}
