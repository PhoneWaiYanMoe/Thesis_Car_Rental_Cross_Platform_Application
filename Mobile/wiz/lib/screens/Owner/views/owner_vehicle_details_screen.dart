// lib/screens/Owner/views/owner_vehicle_details_screen.dart
import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/screens/Owner/models/owner_vehicle_model.dart';
import '../services/vehicle_api_services.dart';

class OwnerVehicleDetailsScreen extends StatefulWidget {
  final String vehicleId;

  const OwnerVehicleDetailsScreen({super.key, required this.vehicleId});

  @override
  State<OwnerVehicleDetailsScreen> createState() => _OwnerVehicleDetailsScreenState();
}

class _OwnerVehicleDetailsScreenState extends State<OwnerVehicleDetailsScreen> {
  final VehicleApiService _vehicleApi = VehicleApiService();
  
  VehicleDetails? _vehicle;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadVehicleDetails();
  }

  Future<void> _loadVehicleDetails() async {
    setState(() => _isLoading = true);

    final result = await _vehicleApi.getMyVehicleById(widget.vehicleId);

    if (result['success'] && mounted) {
      setState(() {
        _vehicle = VehicleDetails.fromJson(result['data']);
        _isLoading = false;
      });
    } else {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['error'] ?? 'Failed to load vehicle'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _handleDelete() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Vehicle'),
        content: const Text('Are you sure you want to deactivate this vehicle? You can reactivate it later.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Deactivate'),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    final result = await _vehicleApi.deleteVehicle(widget.vehicleId);

    if (mounted) {
      if (result['success']) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Vehicle deactivated successfully'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context, true);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['error'] ?? 'Failed to deactivate vehicle'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        backgroundColor: AppStyles.background(context),
        appBar: AppBar(title: const Text('Loading...')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_vehicle == null) {
      return Scaffold(
        backgroundColor: AppStyles.background(context),
        appBar: AppBar(title: const Text('Error')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 60, color: Colors.red),
              const SizedBox(height: 20),
              Text('Failed to load vehicle', style: AppStyles.h3(context)),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppStyles.background(context),
      appBar: AppBar(
        title: Text('Vehicle Details', style: AppStyles.h2(context)),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.edit),
            onPressed: () async {
              final result = await Navigator.pushNamed(
                context,
                '/owner/vehicles/edit',
                arguments: widget.vehicleId,
              );
              
              if (result == true) {
                _loadVehicleDetails();
              }
            },
          ),
          PopupMenuButton(
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'delete',
                child: Row(
                  children: [
                    Icon(Icons.delete, color: Colors.red),
                    SizedBox(width: 8),
                    Text('Deactivate', style: TextStyle(color: Colors.red)),
                  ],
                ),
              ),
            ],
            onSelected: (value) {
              if (value == 'delete') {
                _handleDelete();
              }
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadVehicleDetails,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Photos
            if (_vehicle!.photos.isNotEmpty)
              SizedBox(
                height: 220,
                child: PageView.builder(
                  itemCount: _vehicle!.photos.length,
                  itemBuilder: (context, index) {
                    final photo = _vehicle!.photos[index];
                    return ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: Image.asset(
                        photo.url,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(
                          color: Colors.grey[300],
                          child: const Icon(Icons.image_not_supported, size: 60),
                        ),
                      ),
                    );
                  },
                ),
              )
            else
              Container(
                height: 220,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Center(
                  child: Icon(Icons.directions_car, size: 80),
                ),
              ),
            const SizedBox(height: 20),

            // Status & Verification
            Row(
              children: [
                _buildStatusBadge(_vehicle!.status),
                const SizedBox(width: 12),
                _buildVerificationBadge(_vehicle!.verificationStatus),
              ],
            ),
            const SizedBox(height: 20),

            // Name & Description
            Text(_vehicle!.name, style: AppStyles.h1(context)),
            const SizedBox(height: 8),
            Text(_vehicle!.description, style: AppStyles.body(context)),
            const SizedBox(height: 24),

            // Specifications
            _buildSection(
              'Specifications',
              [
                _buildInfoRow('Type', _vehicle!.specifications.vehicleType.toUpperCase()),
                _buildInfoRow('Transmission', _vehicle!.specifications.transmission.toUpperCase()),
                _buildInfoRow('Fuel', _vehicle!.specifications.fuelType.toUpperCase()),
                _buildInfoRow('Seats', '${_vehicle!.specifications.seats}'),
                _buildInfoRow('Year', '${_vehicle!.specifications.year}'),
                _buildInfoRow('Mileage', '${_vehicle!.specifications.mileage} km'),
                _buildInfoRow('License Plate', _vehicle!.specifications.licensePlate),
              ],
            ),
            const SizedBox(height: 20),

            // Performance
            _buildSection(
              'Performance',
              [
                _buildInfoRow('Total Rentals', '${_vehicle!.performance.totalRentals}'),
                _buildInfoRow('Average Rating', '${_vehicle!.performance.rating.toStringAsFixed(1)} ⭐'),
                _buildInfoRow('Reviews', '${_vehicle!.performance.reviewCount}'),
              ],
            ),
            const SizedBox(height: 20),

            // Pricing
            _buildSection(
              'Pricing',
              [
                _buildInfoRow('Price per Day', '${_formatPrice(_vehicle!.pricing.pricePerDay)} đ'),
              ],
            ),
            const SizedBox(height: 20),

            // Features
            if (_vehicle!.features.isNotEmpty)
              _buildSection(
                'Features',
                [
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _vehicle!.features.map((feature) {
                      return Chip(
                        label: Text(feature),
                        backgroundColor: AppStyles.surface(context),
                      );
                    }).toList(),
                  ),
                ],
              ),
            const SizedBox(height: 20),

            // Availability Options
            _buildSection(
              'Availability',
              [
                _buildInfoRow('Driver Supported', _vehicle!.availability.driverSupported ? 'Yes' : 'No'),
                _buildInfoRow('Instant Booking', _vehicle!.availability.instantBooking ? 'Yes' : 'No'),
                _buildInfoRow('Delivery Available', _vehicle!.availability.deliveryAvailable ? 'Yes' : 'No'),
              ],
            ),
            const SizedBox(height: 20),

            // Verification Info
            if (_vehicle!.verificationStatus != 'pending')
              _buildSection(
                'Verification',
                [
                  if (_vehicle!.lastVerified != null)
                    _buildInfoRow('Last Verified', _formatDate(_vehicle!.lastVerified!)),
                  if (_vehicle!.nextVerificationDue != null)
                    _buildInfoRow('Next Due', _formatDate(_vehicle!.nextVerificationDue!)),
                  if (_vehicle!.verificationNotes != null)
                    _buildInfoRow('Notes', _vehicle!.verificationNotes!),
                ],
              ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildSection(String title, List<Widget> children) {
    return Card(
      color: AppStyles.surface(context),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: AppStyles.h3(context)),
            const SizedBox(height: 12),
            ...children,
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 140,
            child: Text(
              label,
              style: AppStyles.caption(context).copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          Expanded(
            child: Text(value, style: AppStyles.body(context)),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color color;
    IconData icon;

    switch (status) {
      case 'active':
        color = Colors.green;
        icon = Icons.check_circle;
        break;
      case 'pending':
        color = Colors.orange;
        icon = Icons.pending;
        break;
      case 'stopped':
        color = Colors.grey;
        icon = Icons.stop_circle;
        break;
      case 'banned':
        color = Colors.red;
        icon = Icons.block;
        break;
      default:
        color = Colors.grey;
        icon = Icons.help;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 6),
          Text(
            status.toUpperCase(),
            style: TextStyle(
              color: color,
              fontSize: 13,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildVerificationBadge(String status) {
    Color color;

    switch (status) {
      case 'approved':
        color = Colors.green;
        break;
      case 'pending':
        color = Colors.orange;
        break;
      case 'rejected':
        color = Colors.red;
        break;
      default:
        color = Colors.grey;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color),
      ),
      child: Text(
        'Verification: ${status.toUpperCase()}',
        style: TextStyle(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  String _formatPrice(int price) {
    return price.toString().replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (m) => '${m[1]},',
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}