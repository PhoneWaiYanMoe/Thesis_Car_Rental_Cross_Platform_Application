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
      // Extract location and dates from tripData
      final location = widget.tripData['location'] as String?;
      final pickup = widget.tripData['pickup'] as String?;
      final datetime = widget.tripData['datetime'] as String?;

      // Parse city/district from location
      String? city;
      String? district;

      if (location != null && location.isNotEmpty) {
        final parts = location.split(',');
        if (parts.length >= 2) {
          district = parts[0].trim();
          city = parts[1].trim();
        } else {
          city = location.trim();
        }
      } else if (pickup != null && pickup.isNotEmpty) {
        final parts = pickup.split(',');
        if (parts.length >= 2) {
          district = parts[0].trim();
          city = parts[1].trim();
        } else {
          city = pickup.trim();
        }
      }

      // Parse dates (format: "HH:MM, DD/MM - HH:MM, DD/MM")
      String? startDate;
      String? endDate;

      if (datetime != null && datetime.contains(' - ')) {
        final parts = datetime.split(' - ');
        if (parts.length == 2) {
          // Extract DD/MM from "HH:MM, DD/MM"
          final startParts = parts[0].split(', ');
          final endParts = parts[1].split(', ');

          if (startParts.length == 2) {
            final startDayMonth = startParts[1].split('/');
            if (startDayMonth.length == 2) {
              startDate = '2025-${startDayMonth[1].padLeft(2, '0')}-${startDayMonth[0].padLeft(2, '0')}';
            }
          }

          if (endParts.length == 2) {
            final endDayMonth = endParts[1].split('/');
            if (endDayMonth.length == 2) {
              endDate = '2025-${endDayMonth[1].padLeft(2, '0')}-${endDayMonth[0].padLeft(2, '0')}';
            }
          }
        }
      }

      print('🔍 Searching with filters:');
      print('   - City: $city');
      print('   - District: $district');
      print('   - Start Date: $startDate');
      print('   - End Date: $endDate');

      // Call API with filters
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

      // Convert to Car models
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
