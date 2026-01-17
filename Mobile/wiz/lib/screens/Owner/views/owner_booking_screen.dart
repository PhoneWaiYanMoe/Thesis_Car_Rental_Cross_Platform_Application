import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/screens/Owner/models/owner_vehicle_model.dart';
import 'package:wiz/screens/Owner/services/vehicle_api_services.dart';
import 'package:wiz/screens/Owner/views/vehicle_booking_details_screen.dart';

class OwnerBookingsScreen extends StatefulWidget {
  const OwnerBookingsScreen({super.key});

  @override
  State<OwnerBookingsScreen> createState() => _OwnerBookingsScreenState();
}

class _OwnerBookingsScreenState extends State<OwnerBookingsScreen> {
  final VehicleApiService _vehicleApi = VehicleApiService();

  List<OwnerVehicle> _vehicles = [];
  List<OwnerVehicle> _filteredVehicles = [];
  bool _isLoadingVehicles = false;
  String? _vehiclesError;

  final TextEditingController _searchController = TextEditingController();
  String _selectedVehicleStatus = 'all';
  String _sortBy = 'recent';

  int _currentPage = 1;
  final int _vehiclesPerPage = 10;

  @override
  void initState() {
    super.initState();
    _loadVehicles();
    _searchController.addListener(_filterVehicles);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadVehicles() async {
    setState(() {
      _isLoadingVehicles = true;
      _vehiclesError = null;
    });

    try {
      final result = await _vehicleApi.getMyVehicles(
        status: _selectedVehicleStatus == 'all' ? 'all' : _selectedVehicleStatus,
        sortBy: 'name',
      );

      if (result['success'] && mounted) {
        final data = result['data'];
        final vehiclesList = (data['vehicles'] as List<dynamic>)
            .map((v) => OwnerVehicle.fromJson(v as Map<String, dynamic>))
            .toList();

        setState(() {
          _vehicles = vehiclesList;
          _filterVehicles();
          _isLoadingVehicles = false;
        });
      } else if (mounted) {
        setState(() {
          _vehiclesError = result['error']?.toString() ?? 'Failed to load vehicles';
          _isLoadingVehicles = false;
        });
      }
    } catch (e) {
      print('❌ Error loading vehicles: $e');
      if (mounted) {
        setState(() {
          _vehiclesError = e.toString();
          _isLoadingVehicles = false;
        });
      }
    }
  }

  void _filterVehicles() {
    final query = _searchController.text.toLowerCase().trim();

    setState(() {
      _filteredVehicles = _vehicles.where((v) {
        return query.isEmpty || v.name.toLowerCase().contains(query);
      }).toList();

      // Sorting
      switch (_sortBy) {
        case 'recent':
          _filteredVehicles.sort((a, b) => b.createdAt.compareTo(a.createdAt));
          break;
        case 'active':
          _filteredVehicles.sort((a, b) {
            if (a.status == 'active' && b.status != 'active') return -1;
            if (a.status != 'active' && b.status == 'active') return 1;
            return 0;
          });
          break;
        case 'name':
          _filteredVehicles.sort((a, b) => a.name.compareTo(b.name));
          break;
        case 'rentals':
          _filteredVehicles.sort((a, b) => b.totalRentals.compareTo(a.totalRentals));
          break;
      }

      _currentPage = 1;
    });
  }

  void _showFilterSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.tune, color: AppStyles.primary),
                const SizedBox(width: 12),
                Text('Filter & Sort', style: AppStyles.h2(context)),
                const Spacer(),
                IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
              ],
            ),
            const SizedBox(height: 24),

            Text('Vehicle Status', style: AppStyles.h3(context)),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children:
                  [
                    {'label': 'All', 'value': 'all'},
                    {'label': 'Active', 'value': 'active'},
                    {'label': 'Pending', 'value': 'pending'},
                    {'label': 'Stopped', 'value': 'stopped'},
                  ].map((status) {
                    final isSelected = _selectedVehicleStatus == status['value'];
                    return FilterChip(
                      label: Text(status['label']!),
                      selected: isSelected,
                      selectedColor: AppStyles.primary,
                      checkmarkColor: Colors.white,
                      labelStyle: TextStyle(color: isSelected ? Colors.white : AppStyles.textPrimary(context)),
                      onSelected: (_) {
                        setState(() => _selectedVehicleStatus = status['value']!);
                        Navigator.pop(context);
                        _loadVehicles();
                      },
                    );
                  }).toList(),
            ),

            const SizedBox(height: 24),

            Text('Sort By', style: AppStyles.h3(context)),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children:
                  [
                    {'label': 'Most Recent', 'value': 'recent', 'icon': Icons.access_time},
                    {'label': 'Active First', 'value': 'active', 'icon': Icons.verified},
                    {'label': 'Name', 'value': 'name', 'icon': Icons.sort_by_alpha},
                    {'label': 'Most Rentals', 'value': 'rentals', 'icon': Icons.trending_up},
                  ].map((sort) {
                    final isSelected = _sortBy == sort['value'];
                    return FilterChip(
                      avatar: Icon(
                        sort['icon'] as IconData,
                        size: 18,
                        color: isSelected ? Colors.white : AppStyles.primary,
                      ),
                      label: Text(sort['label'] as String),
                      selected: isSelected,
                      selectedColor: AppStyles.primary,
                      checkmarkColor: Colors.white,
                      labelStyle: TextStyle(color: isSelected ? Colors.white : AppStyles.textPrimary(context)),
                      onSelected: (_) {
                        setState(() => _sortBy = sort['value'] as String);
                        Navigator.pop(context);
                        _filterVehicles();
                      },
                    );
                  }).toList(),
            ),

            const SizedBox(height: 24),

            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () => Navigator.pop(context),
                style: AppStyles.primaryButtonStyle(context),
                icon: const Icon(Icons.check),
                label: const Text('Apply Filters'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  List<OwnerVehicle> get _paginatedVehicles {
    final start = (_currentPage - 1) * _vehiclesPerPage;
    final end = start + _vehiclesPerPage;
    if (start >= _filteredVehicles.length) return [];
    return _filteredVehicles.sublist(start, end.clamp(0, _filteredVehicles.length));
  }

  int get _totalPages => (_filteredVehicles.length / _vehiclesPerPage).ceil();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppStyles.background(context),
      appBar: AppBar(
        title: Text('Vehicle Bookings', style: AppStyles.h2(context)),
        centerTitle: true,
        actions: [IconButton(icon: const Icon(Icons.tune), onPressed: _showFilterSheet)],
      ),
      body: Column(
        children: [
          // Search bar
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppStyles.surface(context),
              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 2))],
            ),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search vehicles by name...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(icon: const Icon(Icons.clear), onPressed: _searchController.clear)
                    : null,
                filled: true,
                fillColor: AppStyles.background(context),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              ),
            ),
          ),

          if (_filteredVehicles.isNotEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(
                children: [
                  Text(
                    '${_filteredVehicles.length} vehicle${_filteredVehicles.length != 1 ? 's' : ''}',
                    style: AppStyles.caption(context).copyWith(fontWeight: FontWeight.w600),
                  ),
                  const Spacer(),
                  if (_selectedVehicleStatus != 'all' || _searchController.text.isNotEmpty)
                    TextButton.icon(
                      onPressed: () {
                        setState(() {
                          _selectedVehicleStatus = 'all';
                          _searchController.clear();
                        });
                        _loadVehicles();
                      },
                      icon: const Icon(Icons.clear_all, size: 18),
                      label: const Text('Clear Filters'),
                      style: TextButton.styleFrom(foregroundColor: AppStyles.primary),
                    ),
                ],
              ),
            ),

          Expanded(
            child: _isLoadingVehicles
                ? const Center(child: CircularProgressIndicator())
                : _vehiclesError != null
                ? _buildErrorState()
                : _filteredVehicles.isEmpty
                ? _buildEmptyState()
                : RefreshIndicator(
                    onRefresh: _loadVehicles,
                    child: ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _paginatedVehicles.length,
                      itemBuilder: (context, index) => _buildVehicleCard(_paginatedVehicles[index]),
                    ),
                  ),
          ),

          if (_filteredVehicles.isNotEmpty && _totalPages > 1) _buildPaginationControls(),
        ],
      ),
    );
  }

  Widget _buildVehicleCard(OwnerVehicle vehicle) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      elevation: 2,
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () =>
            Navigator.push(context, MaterialPageRoute(builder: (_) => VehicleBookingsDetailScreen(vehicle: vehicle))),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
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
                child: const Center(child: Icon(Icons.directions_car, size: 60)),
              ),

            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      _buildStatusBadge(vehicle.status),
                      const Spacer(),
                      if (vehicle.rating > 0) ...[
                        const Icon(Icons.star, color: Colors.amber, size: 16),
                        const SizedBox(width: 4),
                        Text(
                          vehicle.rating.toStringAsFixed(1),
                          style: AppStyles.caption(context).copyWith(fontWeight: FontWeight.w600),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(vehicle.name, style: AppStyles.h3(context), maxLines: 2, overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Icon(Icons.event, size: 16, color: AppStyles.textSecondary(context)),
                      const SizedBox(width: 4),
                      Text('${vehicle.totalRentals} rentals', style: AppStyles.caption(context)),
                      const SizedBox(width: 16),
                      Icon(Icons.attach_money, size: 16, color: AppStyles.textSecondary(context)),
                      const SizedBox(width: 4),
                      Text('${vehicle.formattedPrice}₫/day', style: AppStyles.caption(context)),
                    ],
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () => Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => VehicleBookingsDetailScreen(vehicle: vehicle)),
                      ),
                      style: AppStyles.primaryButtonStyle(context),
                      icon: const Icon(Icons.list_alt, size: 20),
                      label: const Text('View Bookings'),
                    ),
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
    String label;

    switch (status) {
      case 'active':
        color = Colors.green;
        icon = Icons.check_circle;
        label = 'ACTIVE';
        break;
      case 'pending':
        color = Colors.orange;
        icon = Icons.pending;
        label = 'PENDING';
        break;
      case 'stopped':
        color = Colors.grey;
        icon = Icons.stop_circle;
        label = 'STOPPED';
        break;
      case 'banned':
        color = Colors.red;
        icon = Icons.block;
        label = 'BANNED';
        break;
      default:
        color = Colors.grey;
        icon = Icons.help;
        label = status.toUpperCase();
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
            label,
            style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }

  Widget _buildPaginationControls() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: AppStyles.surface(context),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -2))],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          TextButton.icon(
            onPressed: _currentPage > 1 ? () => setState(() => _currentPage--) : null,
            icon: const Icon(Icons.chevron_left),
            label: const Text('Previous'),
            style: TextButton.styleFrom(foregroundColor: AppStyles.primary, disabledForegroundColor: Colors.grey),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: AppStyles.primary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              'Page $_currentPage of $_totalPages',
              style: AppStyles.body(context).copyWith(color: AppStyles.primary, fontWeight: FontWeight.w600),
            ),
          ),
          TextButton.icon(
            onPressed: _currentPage < _totalPages ? () => setState(() => _currentPage++) : null,
            icon: const Icon(Icons.chevron_right),
            label: const Text('Next'),
            style: TextButton.styleFrom(foregroundColor: AppStyles.primary, disabledForegroundColor: Colors.grey),
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
          Icon(Icons.directions_car_outlined, size: 80, color: AppStyles.textSecondary(context).withOpacity(0.5)),
          const SizedBox(height: 16),
          Text(
            _searchController.text.isNotEmpty ? 'No vehicles found' : 'No vehicles yet',
            style: AppStyles.h3(context),
          ),
          const SizedBox(height: 8),
          Text(
            _searchController.text.isNotEmpty
                ? 'Try adjusting your search'
                : 'Add vehicles to start receiving bookings',
            style: AppStyles.caption(context),
            textAlign: TextAlign.center,
          ),
          if (_searchController.text.isEmpty) ...[
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () => Navigator.pushNamed(context, '/owner/vehicles/create'),
              style: AppStyles.primaryButtonStyle(context),
              icon: const Icon(Icons.add),
              label: const Text('Add Vehicle'),
            ),
          ],
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
          Text(_vehiclesError ?? 'Unknown error', style: AppStyles.caption(context)),
          const SizedBox(height: 24),
          ElevatedButton(
            style: AppStyles.primaryButtonStyle(context),
            onPressed: _loadVehicles,
            child: const Text('Retry'),
          ),
        ],
      ),
    );
  }
}
