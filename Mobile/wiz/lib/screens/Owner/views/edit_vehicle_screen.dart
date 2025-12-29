// lib/screens/Owner/views/edit_vehicle_screen.dart
import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/screens/Owner/models/owner_vehicle_model.dart';
import '../services/vehicle_api_services.dart';

class EditVehicleScreen extends StatefulWidget {
  final String vehicleId;

  const EditVehicleScreen({super.key, required this.vehicleId});

  @override
  State<EditVehicleScreen> createState() => _EditVehicleScreenState();
}

class _EditVehicleScreenState extends State<EditVehicleScreen> {
  final _formKey = GlobalKey<FormState>();
  final VehicleApiService _vehicleApi = VehicleApiService();

  bool _isLoading = false;
  bool _isLoadingData = false;
  VehicleDetails? _vehicle;

  // Form controllers
  final _nameController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _priceController = TextEditingController();

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
  List<String> _selectedFeatures = [];

  @override
  void initState() {
    super.initState();
    _loadVehicleData();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    _priceController.dispose();
    super.dispose();
  }

  Future<void> _loadVehicleData() async {
    setState(() => _isLoadingData = true);

    final result = await _vehicleApi.getMyVehicleById(widget.vehicleId);

    if (result['success'] && mounted) {
      final vehicle = VehicleDetails.fromJson(result['data']);

      setState(() {
        _vehicle = vehicle;
        _nameController.text = vehicle.name;
        _descriptionController.text = vehicle.description;
        _priceController.text = vehicle.pricing.pricePerDay.toString();
        _selectedFeatures = List.from(vehicle.features);
        _isLoadingData = false;
      });
    } else {
      if (mounted) {
        setState(() => _isLoadingData = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(result['error'] ?? 'Failed to load vehicle'), backgroundColor: Colors.red),
        );
        Navigator.pop(context);
      }
    }
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    final result = await _vehicleApi.updateVehicle(
      vehicleId: widget.vehicleId,
      name: _nameController.text.trim(),
      description: _descriptionController.text.trim(),
      pricePerDay: int.parse(_priceController.text),
      features: _selectedFeatures,
    );

    if (mounted) {
      setState(() => _isLoading = false);

      if (result['success']) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Vehicle updated successfully!'), backgroundColor: Colors.green));
        Navigator.pop(context, true);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(result['error'] ?? 'Failed to update vehicle'), backgroundColor: Colors.red),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoadingData) {
      return Scaffold(
        backgroundColor: AppStyles.background(context),
        appBar: AppBar(title: const Text('Loading...')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      backgroundColor: AppStyles.background(context),
      appBar: AppBar(title: Text('Edit Vehicle', style: AppStyles.h2(context)), centerTitle: true),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Info message
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.blue.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.blue),
              ),
              child: Row(
                children: [
                  const Icon(Icons.info, color: Colors.blue),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'You can only edit name, description, price, and features',
                      style: AppStyles.caption(context).copyWith(color: Colors.blue),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

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

            // Current Specifications (read-only)
            if (_vehicle != null) ...[
              Text('Current Specifications (Read-Only)', style: AppStyles.h3(context)),
              const SizedBox(height: 12),
              Card(
                color: AppStyles.surface(context),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      _buildReadOnlyRow('Type', _vehicle!.specifications.vehicleType.toUpperCase()),
                      _buildReadOnlyRow('Transmission', _vehicle!.specifications.transmission.toUpperCase()),
                      _buildReadOnlyRow('Fuel', _vehicle!.specifications.fuelType.toUpperCase()),
                      _buildReadOnlyRow('Seats', '${_vehicle!.specifications.seats}'),
                      _buildReadOnlyRow('Year', '${_vehicle!.specifications.year}'),
                      _buildReadOnlyRow('License Plate', _vehicle!.specifications.licensePlate),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
            ],

            // Submit Button
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _handleSubmit,
                style: AppStyles.primaryButtonStyle(context),
                child: _isLoading
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text('Update Vehicle', style: TextStyle(fontSize: 16)),
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildReadOnlyRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          SizedBox(
            width: 120,
            child: Text(label, style: AppStyles.caption(context).copyWith(fontWeight: FontWeight.w600)),
          ),
          Expanded(child: Text(value, style: AppStyles.body(context))),
        ],
      ),
    );
  }
}
