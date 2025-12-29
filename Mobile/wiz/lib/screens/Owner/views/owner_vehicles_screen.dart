// lib/screens/Owner/views/owner_vehicles_screen.dart
import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/screens/Owner/models/owner_vehicle_model.dart';
import '../services/vehicle_api_services.dart';
import 'package:wiz/utils/app_routes.dart';

class OwnerVehiclesScreen extends StatefulWidget {
  const OwnerVehiclesScreen({super.key});

  @override
  State<OwnerVehiclesScreen> createState() => _OwnerVehiclesScreenState();
}

class _OwnerVehiclesScreenState extends State<OwnerVehiclesScreen> {
  final VehicleApiService _vehicleApi = VehicleApiService();
  
  List<OwnerVehicle> _vehicles = [];
  bool _isLoading = false;
  String _selectedStatus = 'all';
  String _sortBy = 'name';

  @override
  void initState() {
    super.initState();
    _loadVehicles();
  }

  Future<void> _loadVehicles() async {
    setState(() => _isLoading = true);

    final result = await _vehicleApi.getMyVehicles(
      status: _selectedStatus,
      sortBy: _sortBy,
    );

    if (result['success'] && mounted) {
      final data = result['data'];
      final vehiclesList = (data['vehicles'] as List<dynamic>)
          .map((v) => OwnerVehicle.fromJson(v))
          .toList();

      setState(() {
        _vehicles = vehiclesList;
        _isLoading = false;
      });
    } else {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['error'] ?? 'Failed to load vehicles'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _showFilterSheet() {
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Filter & Sort', style: AppStyles.h2(context)),
            const SizedBox(height: 20),
            
            // Status filter
            Text('Status', style: AppStyles.h3(context)),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              children: ['all', 'pending', 'active', 'stopped', 'banned'].map((status) {
                final isSelected = _selectedStatus == status;
                return FilterChip(
                  label: Text(status.toUpperCase()),
                  selected: isSelected,
                  selectedColor: AppStyles.primary,
                  checkmarkColor: Colors.white,
                  onSelected: (_) {
                    setState(() => _selectedStatus = status);
                    Navigator.pop(context);
                    _loadVehicles();
                  },
                );
              }).toList(),
            ),
            
            const SizedBox(height: 20),
            
            // Sort by
            Text('Sort By', style: AppStyles.h3(context)),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              children: [
                {'label': 'Name', 'value': 'name'},
                {'label': 'Rentals', 'value': 'rentals'},
                {'label': 'Rating', 'value': 'rating'},
                {'label': 'Price', 'value': 'price'},
              ].map((sort) {
                final isSelected = _sortBy == sort['value'];
                return FilterChip(
                  label: Text(sort['label']!),
                  selected: isSelected,
                  selectedColor: AppStyles.primary,
                  checkmarkColor: Colors.white,
                  onSelected: (_) {
                    setState(() => _sortBy = sort['value']!);
                    Navigator.pop(context);
                    _loadVehicles();
                  },
                );
              }).toList(),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppStyles.background(context),
      appBar: AppBar(
        title: Text('My Vehicles', style: AppStyles.h2(context)),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.tune),
            onPressed: _showFilterSheet,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _vehicles.isEmpty
              ? _buildEmptyState()
              : RefreshIndicator(
                  onRefresh: _loadVehicles,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _vehicles.length,
                    itemBuilder: (context, index) {
                      return _buildVehicleCard(_vehicles[index]);
                    },
                  ),
                ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          final result = await Navigator.pushNamed(
            context,
            '/owner/vehicles/create',
          );
          
          if (result == true) {
            _loadVehicles();
          }
        },
        backgroundColor: AppStyles.primary,
        icon: const Icon(Icons.add, color: Colors.white),
        label: const Text('Add Vehicle', style: TextStyle(color: Colors.white)),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.directions_car,
            size: 80,
            color: AppStyles.textSecondary(context).withOpacity(0.5),
          ),
          const SizedBox(height: 20),
          Text('No vehicles yet', style: AppStyles.h2(context)),
          const SizedBox(height: 10),
          Text(
            'Add your first vehicle to start renting',
            style: AppStyles.body(context),
          ),
          const SizedBox(height: 30),
          ElevatedButton.icon(
            onPressed: () async {
              final result = await Navigator.pushNamed(
                context,
                '/owner/vehicles/create',
              );
              
              if (result == true) {
                _loadVehicles();
              }
            },
            style: AppStyles.primaryButtonStyle(context),
            icon: const Icon(Icons.add),
            label: const Text('Add Vehicle'),
          ),
        ],
      ),
    );
  }

  Widget _buildVehicleCard(OwnerVehicle vehicle) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () async {
          final result = await Navigator.pushNamed(
            context,
            '/owner/vehicles/details',
            arguments: vehicle.id,
          );
          
          if (result == true) {
            _loadVehicles();
          }
        },
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image
            if (vehicle.primaryPhoto != null)
              ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                child: Image.asset(
                  vehicle.primaryPhoto!,
                  height: 180,
                  width: double.infinity,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => Container(
                    height: 180,
                    color: Colors.grey[300],
                    child: const Icon(Icons.directions_car, size: 60),
                  ),
                ),
              )
            else
              Container(
                height: 180,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                ),
                child: const Center(
                  child: Icon(Icons.directions_car, size: 60),
                ),
              ),

            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Status badge
                  Row(
                    children: [
                      _buildStatusBadge(vehicle.status),
                      const Spacer(),
                      if (vehicle.rating > 0) ...[
                        const Icon(Icons.star, color: Colors.amber, size: 16),
                        const SizedBox(width: 4),
                        Text(
                          '${vehicle.rating.toStringAsFixed(1)}',
                          style: AppStyles.caption(context),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 8),

                  // Name
                  Text(vehicle.name, style: AppStyles.h3(context)),
                  const SizedBox(height: 4),

                  // Stats
                  Row(
                    children: [
                      const Icon(Icons.event, size: 16, color: Colors.grey),
                      const SizedBox(width: 4),
                      Text(
                        '${vehicle.totalRentals} rentals',
                        style: AppStyles.caption(context),
                      ),
                      const SizedBox(width: 16),
                      const Icon(Icons.attach_money, size: 16, color: Colors.grey),
                      const SizedBox(width: 4),
                      Text(
                        '${vehicle.formattedPrice}₫/day',
                        style: AppStyles.caption(context),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Actions
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () async {
                            final result = await Navigator.pushNamed(
                              context,
                              '/owner/vehicles/edit',
                              arguments: vehicle.id,
                            );
                            
                            if (result == true) {
                              _loadVehicles();
                            }
                          },
                          style: OutlinedButton.styleFrom(
                            foregroundColor: AppStyles.primary,
                          ),
                          icon: const Icon(Icons.edit, size: 18),
                          label: const Text('Edit'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () async {
                            final result = await Navigator.pushNamed(
                              context,
                              '/owner/vehicles/details',
                              arguments: vehicle.id,
                            );
                            
                            if (result == true) {
                              _loadVehicles();
                            }
                          },
                          style: AppStyles.primaryButtonStyle(context),
                          icon: const Icon(Icons.visibility, size: 18),
                          label: const Text('View'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
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
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 4),
          Text(
            status.toUpperCase(),
            style: TextStyle(
              color: color,
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}