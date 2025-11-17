// screens/Cars/views/car_list_screen.dart
import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/screens/Cars/models/car.dart';
import 'package:wiz/screens/Cars/services/car_filter_service.dart';
import 'package:wiz/screens/Cars/widgets/filter_widget.dart';

import 'widgets/_buildCarCard.dart';
import 'widgets/_buildTripSummary.dart';

class CarListScreen extends StatefulWidget {
  final Map<String, dynamic> tripData;
  const CarListScreen({super.key, required this.tripData});

  @override
  State<CarListScreen> createState() => _CarListScreenState();
}

class _CarListScreenState extends State<CarListScreen> {
  late List<Car> _allCars;
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
    _allCars = Car.sampleCars;
  }

  List<Car> get _filteredCars => CarFilterService.filterCars(
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppStyles.background(context),
      appBar: AppBar(
        leading: IconButton(icon: const Icon(Icons.arrow_back), onPressed: () => Navigator.pop(context)),
        title: Text('Available Cars', style: AppStyles.h2(context)),
        centerTitle: true,
        actions: [IconButton(icon: const Icon(Icons.tune), onPressed: _showFilterSheet)],
      ),
      body: Column(
        children: [
          BuildTripSummary(tripData: widget.tripData),
          const SizedBox(height: 16),
          Expanded(
            child: _filteredCars.isEmpty
                ? _buildEmptyState()
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: _filteredCars.length,
                    itemBuilder: (context, i) => BuildCarCard(car: _filteredCars[i].toMap(), tripData: widget.tripData),
                  ),
          ),
        ],
      ),
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
          items: ['Gasoline', 'Diesel', 'Electric', 'Hybrid', 'Other'],
          selected: _selectedFuel,
          labelBuilder: (f) => f,
          onSelected: (v) => _update(setSheetState, () => _selectedFuel = v),
        ),
        const SizedBox(height: 24),
        ChipFilter<String>(
          title: 'Vehicle Type',
          items: ['Sedan', 'SUV', 'Hatchback', 'Van', 'Other'],
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
        const SizedBox(height: 24),
        SwitchFilter(
          title: 'Discount Available',
          value: _discount,
          onChanged: (v) => _update(setSheetState, () => _discount = v),
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

// Extension to convert Car → Map for BuildCarCard
extension CarX on Car {
  Map<String, dynamic> toMap() => {
    'image': image,
    'name': name,
    'rating': rating,
    'reviews': reviews,
    'price': price,
    'owner': owner,
    'ownerAvatar': ownerAvatar,
    'location': location,
  };
}
