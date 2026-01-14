import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/screens/Cars/models/car.dart';
import 'package:wiz/screens/Cars/services/vehicle_api_service.dart';
import 'package:wiz/screens/Cars/views/widgets/_buildCarCard.dart';
import 'package:wiz/utils/app_routes.dart';

class OwnerCarsScreen extends StatefulWidget {
  final String ownerId;
  final String ownerName;
  final String? ownerAvatar;
  final DateTime? joinedDate;

  const OwnerCarsScreen({super.key, required this.ownerId, required this.ownerName, this.ownerAvatar, this.joinedDate});

  @override
  State<OwnerCarsScreen> createState() => _OwnerCarsScreenState();
}

class _OwnerCarsScreenState extends State<OwnerCarsScreen> {
  final VehicleApiService _apiService = VehicleApiService();

  List<Car> _vehicles = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadOwnerVehicles();
  }

  Future<void> _loadOwnerVehicles() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      print('🔍 Loading vehicles for owner: ${widget.ownerId}');

      // Search all active vehicles
      // Note: Ideally backend should support filtering by ownerId directly
      final response = await _apiService.searchVehicles(
        sortBy: 'rating',
        limit: 100, // Get more results to ensure we capture all owner's vehicles
      );

      // Filter vehicles by owner ID
      final ownerVehicles = response.vehicles.where((v) => v.ownerId == widget.ownerId).map((v) => v.toCar()).toList();

      setState(() {
        _vehicles = ownerVehicles;
        _isLoading = false;
      });

      print('✅ Loaded ${ownerVehicles.length} vehicles for owner ${widget.ownerName}');
    } catch (e) {
      print('❌ Error loading owner vehicles: $e');
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppStyles.background(context),
      appBar: AppBar(
        leading: IconButton(icon: const Icon(Icons.arrow_back), onPressed: () => Navigator.pop(context)),
        title: Text('${widget.ownerName}\'s Vehicles', style: AppStyles.h2(context)),
        centerTitle: true,
      ),
      body: Column(
        children: [
          // Owner Info Header
          _buildOwnerHeader(),

          // Vehicles List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                ? _buildErrorState()
                : _vehicles.isEmpty
                ? _buildEmptyState()
                : RefreshIndicator(
                    onRefresh: _loadOwnerVehicles,
                    child: ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _vehicles.length,
                      itemBuilder: (context, index) {
                        return BuildCarCard(
                          car: _vehicles[index],
                          tripData: {
                            'location': 'Any Location',
                            'datetime': 'Flexible Dates',
                            'days': 1,
                            'withDriver': false,
                          },
                        );
                      },
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildOwnerHeader() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppStyles.surface(context),
        borderRadius: const BorderRadius.vertical(bottom: Radius.circular(24)),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 5))],
      ),
      child: Column(
        children: [
          // Owner Avatar
          CircleAvatar(
            radius: 50,
            backgroundColor: AppStyles.primary.withOpacity(0.1),
            child: widget.ownerAvatar != null
                ? ClipOval(child: _buildAvatarImage(widget.ownerAvatar!))
                : Icon(Icons.person, size: 50, color: AppStyles.primary),
          ),
          const SizedBox(height: 16),

          // Owner Name
          Text(widget.ownerName, style: AppStyles.h2(context), textAlign: TextAlign.center),
          const SizedBox(height: 8),

          // Joined Date
          if (widget.joinedDate != null)
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.calendar_today, size: 16, color: AppStyles.textSecondary(context)),
                const SizedBox(width: 6),
                Text('Member since ${_formatDate(widget.joinedDate!)}', style: AppStyles.caption(context)),
              ],
            ),
          const SizedBox(height: 16),

          // Stats Row
          if (!_isLoading && _vehicles.isNotEmpty)
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _buildStatItem(
                  icon: Icons.directions_car,
                  label: '${_vehicles.length} ${_vehicles.length == 1 ? 'Vehicle' : 'Vehicles'}',
                ),
                const SizedBox(width: 24),
                _buildStatItem(icon: Icons.star, label: '${_calculateAverageRating().toStringAsFixed(1)} Rating'),
                const SizedBox(width: 24),
                _buildStatItem(icon: Icons.event, label: '${_calculateTotalRentals()} Rentals'),
              ],
            ),
        ],
      ),
    );
  }

  Widget _buildAvatarImage(String avatarPath) {
    if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
      return Image.network(
        avatarPath,
        width: 100,
        height: 100,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) {
          return Icon(Icons.person, size: 50, color: AppStyles.primary);
        },
      );
    } else {
      return Image.asset(
        avatarPath,
        width: 100,
        height: 100,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) {
          return Icon(Icons.person, size: 50, color: AppStyles.primary);
        },
      );
    }
  }

  Widget _buildStatItem({required IconData icon, required String label}) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 18, color: AppStyles.primary),
        const SizedBox(width: 6),
        Text(label, style: AppStyles.caption(context).copyWith(fontWeight: FontWeight.w600)),
      ],
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.car_rental, size: 80, color: AppStyles.textSecondary(context).withOpacity(0.5)),
            const SizedBox(height: 20),
            Text('No Vehicles Available', style: AppStyles.h3(context)),
            const SizedBox(height: 8),
            Text(
              'This owner doesn\'t have any active vehicles at the moment',
              style: AppStyles.caption(context),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () => Navigator.pop(context),
              style: AppStyles.primaryButtonStyle(context),
              icon: const Icon(Icons.arrow_back),
              label: const Text('Go Back'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 80, color: Colors.red.withOpacity(0.5)),
            const SizedBox(height: 20),
            Text('Failed to Load Vehicles', style: AppStyles.h3(context)),
            const SizedBox(height: 8),
            Text(_error ?? 'Unknown error', style: AppStyles.caption(context), textAlign: TextAlign.center),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                OutlinedButton.icon(
                  onPressed: () => Navigator.pop(context),
                  style: OutlinedButton.styleFrom(foregroundColor: AppStyles.primary),
                  icon: const Icon(Icons.arrow_back),
                  label: const Text('Go Back'),
                ),
                const SizedBox(width: 12),
                ElevatedButton.icon(
                  onPressed: _loadOwnerVehicles,
                  style: AppStyles.primaryButtonStyle(context),
                  icon: const Icon(Icons.refresh),
                  label: const Text('Retry'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  double _calculateAverageRating() {
    if (_vehicles.isEmpty) return 0.0;
    final totalRating = _vehicles.fold<double>(0.0, (sum, car) => sum + car.rating);
    return totalRating / _vehicles.length;
  }

  int _calculateTotalRentals() {
    if (_vehicles.isEmpty) return 0;
    return _vehicles.fold<int>(0, (sum, car) => sum + car.reviews);
  }

  String _formatDate(DateTime date) {
    final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return '${months[date.month - 1]} ${date.year}';
  }
}
