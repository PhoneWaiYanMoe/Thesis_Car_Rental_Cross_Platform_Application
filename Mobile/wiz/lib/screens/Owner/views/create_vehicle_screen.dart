// lib/screens/Owner/views/create_vehicle_screen.dart
import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';
import '../services/vehicle_api_services.dart';

class CreateVehicleScreen extends StatefulWidget {
  const CreateVehicleScreen({super.key});

  @override
  State<CreateVehicleScreen> createState() => _CreateVehicleScreenState();
}

class _CreateVehicleScreenState extends State<CreateVehicleScreen> {
  final _formKey = GlobalKey<FormState>();
  final VehicleApiService _vehicleApi = VehicleApiService();

  bool _isLoading = false;

  // Form controllers
  final _nameController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _yearController = TextEditingController();
  final _mileageController = TextEditingController();
  final _licensePlateController = TextEditingController();
  final _priceController = TextEditingController();
  final _locationController = TextEditingController();
  final _cityController = TextEditingController();
  final _districtController = TextEditingController();

  // Dropdowns
  String _vehicleType = 'sedan';
  String _transmission = 'automatic';
  String _fuelType = 'gasoline';
  int _seats = 5;

  // Switches
  bool _driverSupported = false;
  bool _instantBooking = false;
  bool _deliveryAvailable = false;

  // Features
  final List<String> _availableFeatures = [
    'AC',
    'GPS',
    'Bluetooth',
    'USB',
    'Backup Camera',
    'Sunroof',
    'Leather Seats',
    'Apple CarPlay',
  ];
  final List<String> _selectedFeatures = [];

  // Mock photos
  final List<String> _mockPhotos = ['assets/images/Car.png', 'assets/images/Car_2.png'];

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    _yearController.dispose();
    _mileageController.dispose();
    _licensePlateController.dispose();
    _priceController.dispose();
    _locationController.dispose();
    _cityController.dispose();
    _districtController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    final result = await _vehicleApi.createVehicle(
      name: _nameController.text.trim(),
      description: _descriptionController.text.trim(),
      vehicleType: _vehicleType,
      transmission: _transmission,
      fuelType: _fuelType,
      seats: _seats,
      year: int.parse(_yearController.text),
      mileage: int.parse(_mileageController.text),
      licensePlate: _licensePlateController.text.trim(),
      pricePerDay: int.parse(_priceController.text),
      location: {
        'address': _locationController.text.trim(),
        'city': _cityController.text.trim(),
        'district': _districtController.text.trim(),
        'coordinates': {'lat': 10.8231, 'lng': 106.6297},
      },
      features: _selectedFeatures,
      rules: {'no_smoking': true, 'no_pets': true},
      driverSupported: _driverSupported,
      instantBooking: _instantBooking,
      deliveryAvailable: _deliveryAvailable,
      photoIds: _mockPhotos,
    );

    if (mounted) {
      setState(() => _isLoading = false);

      if (result['success']) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Vehicle created successfully! Pending admin approval.'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context, true);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(result['error'] ?? 'Failed to create vehicle'), backgroundColor: Colors.red),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppStyles.background(context),
      appBar: AppBar(title: Text('Add New Vehicle', style: AppStyles.h2(context)), centerTitle: true),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Basic Information
            Text('Basic Information', style: AppStyles.h3(context)),
            const SizedBox(height: 16),

            TextFormField(
              controller: _nameController,
              decoration: AppStyles.inputDecoration(hint: 'Vehicle Name', icon: Icons.directions_car, context: context),
              validator: (v) => v?.isEmpty ?? true ? 'Required' : null,
            ),
            const SizedBox(height: 16),

            TextFormField(
              controller: _descriptionController,
              decoration: AppStyles.inputDecoration(hint: 'Description', icon: Icons.description, context: context),
              maxLines: 3,
              validator: (v) => v?.isEmpty ?? true ? 'Required' : null,
            ),
            const SizedBox(height: 24),

            // Specifications
            Text('Specifications', style: AppStyles.h3(context)),
            const SizedBox(height: 16),

            DropdownButtonFormField<String>(
              value: _vehicleType,
              decoration: AppStyles.inputDecoration(hint: 'Vehicle Type', icon: Icons.category, context: context),
              items: [
                'sedan',
                'suv',
                'hatchback',
                'van',
              ].map((t) => DropdownMenuItem(value: t, child: Text(t.toUpperCase()))).toList(),
              onChanged: (v) => setState(() => _vehicleType = v!),
            ),
            const SizedBox(height: 16),

            DropdownButtonFormField<String>(
              value: _transmission,
              decoration: AppStyles.inputDecoration(hint: 'Transmission', icon: Icons.settings, context: context),
              items: [
                'automatic',
                'manual',
                'semi-auto',
              ].map((t) => DropdownMenuItem(value: t, child: Text(t.toUpperCase()))).toList(),
              onChanged: (v) => setState(() => _transmission = v!),
            ),
            const SizedBox(height: 16),

            DropdownButtonFormField<String>(
              value: _fuelType,
              decoration: AppStyles.inputDecoration(hint: 'Fuel Type', icon: Icons.local_gas_station, context: context),
              items: [
                'gasoline',
                'diesel',
                'electric',
                'hybrid',
              ].map((t) => DropdownMenuItem(value: t, child: Text(t.toUpperCase()))).toList(),
              onChanged: (v) => setState(() => _fuelType = v!),
            ),
            const SizedBox(height: 16),

            DropdownButtonFormField<int>(
              value: _seats,
              decoration: AppStyles.inputDecoration(hint: 'Seats', icon: Icons.event_seat, context: context),
              items: [4, 5, 7, 9].map((s) => DropdownMenuItem(value: s, child: Text('$s seats'))).toList(),
              onChanged: (v) => setState(() => _seats = v!),
            ),
            const SizedBox(height: 16),

            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _yearController,
                    decoration: AppStyles.inputDecoration(hint: 'Year', icon: Icons.calendar_today, context: context),
                    keyboardType: TextInputType.number,
                    validator: (v) => v?.isEmpty ?? true ? 'Required' : null,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: TextFormField(
                    controller: _mileageController,
                    decoration: AppStyles.inputDecoration(hint: 'Mileage (km)', icon: Icons.speed, context: context),
                    keyboardType: TextInputType.number,
                    validator: (v) => v?.isEmpty ?? true ? 'Required' : null,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            TextFormField(
              controller: _licensePlateController,
              decoration: AppStyles.inputDecoration(
                hint: 'License Plate',
                icon: Icons.confirmation_number,
                context: context,
              ),
              validator: (v) => v?.isEmpty ?? true ? 'Required' : null,
            ),
            const SizedBox(height: 24),

            // Pricing
            Text('Pricing', style: AppStyles.h3(context)),
            const SizedBox(height: 16),

            TextFormField(
              controller: _priceController,
              decoration: AppStyles.inputDecoration(
                hint: 'Price per Day (VND)',
                icon: Icons.attach_money,
                context: context,
              ),
              keyboardType: TextInputType.number,
              validator: (v) => v?.isEmpty ?? true ? 'Required' : null,
            ),
            const SizedBox(height: 24),

            // Location
            Text('Location', style: AppStyles.h3(context)),
            const SizedBox(height: 16),

            TextFormField(
              controller: _locationController,
              decoration: AppStyles.inputDecoration(hint: 'Full Address', icon: Icons.location_on, context: context),
              validator: (v) => v?.isEmpty ?? true ? 'Required' : null,
            ),
            const SizedBox(height: 16),

            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _cityController,
                    decoration: AppStyles.inputDecoration(hint: 'City', icon: Icons.location_city, context: context),
                    validator: (v) => v?.isEmpty ?? true ? 'Required' : null,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: TextFormField(
                    controller: _districtController,
                    decoration: AppStyles.inputDecoration(hint: 'District', icon: Icons.map, context: context),
                    validator: (v) => v?.isEmpty ?? true ? 'Required' : null,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Features
            Text('Features', style: AppStyles.h3(context)),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _availableFeatures.map((feature) {
                final isSelected = _selectedFeatures.contains(feature);
                return FilterChip(
                  label: Text(feature),
                  selected: isSelected,
                  selectedColor: AppStyles.primary,
                  checkmarkColor: Colors.white,
                  onSelected: (selected) {
                    setState(() {
                      if (selected) {
                        _selectedFeatures.add(feature);
                      } else {
                        _selectedFeatures.remove(feature);
                      }
                    });
                  },
                );
              }).toList(),
            ),
            const SizedBox(height: 24),

            // Availability Options
            Text('Availability Options', style: AppStyles.h3(context)),
            const SizedBox(height: 12),

            SwitchListTile(
              title: Text('Driver Supported', style: AppStyles.body(context)),
              value: _driverSupported,
              activeColor: AppStyles.primary,
              onChanged: (v) => setState(() => _driverSupported = v),
            ),
            SwitchListTile(
              title: Text('Instant Booking', style: AppStyles.body(context)),
              value: _instantBooking,
              activeColor: AppStyles.primary,
              onChanged: (v) => setState(() => _instantBooking = v),
            ),
            SwitchListTile(
              title: Text('Delivery Available', style: AppStyles.body(context)),
              value: _deliveryAvailable,
              activeColor: AppStyles.primary,
              onChanged: (v) => setState(() => _deliveryAvailable = v),
            ),
            const SizedBox(height: 24),

            // Submit Button
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _handleSubmit,
                style: AppStyles.primaryButtonStyle(context),
                child: _isLoading
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text('Create Vehicle', style: TextStyle(fontSize: 16)),
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }
}
