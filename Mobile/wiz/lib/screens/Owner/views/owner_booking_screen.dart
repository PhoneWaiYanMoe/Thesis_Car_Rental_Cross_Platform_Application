import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/screens/Booking/services/booking_api_service.dart';
import 'package:wiz/screens/Owner/services/vehicle_api_services.dart';
import 'package:wiz/screens/Owner/models/owner_vehicle_model.dart';
import 'package:wiz/screens/Owner/views/owner_contract_upload_screen.dart';

class OwnerBookingsScreen extends StatefulWidget {
  const OwnerBookingsScreen({super.key});

  @override
  State<OwnerBookingsScreen> createState() => _OwnerBookingsScreenState();
}

class _OwnerBookingsScreenState extends State<OwnerBookingsScreen> {
  final BookingApiService _bookingApi = BookingApiService();
  final VehicleApiService _vehicleApi = VehicleApiService();

  // Vehicle list state
  List<OwnerVehicle> _vehicles = [];
  List<OwnerVehicle> _filteredVehicles = [];
  bool _isLoadingVehicles = false;
  String? _vehiclesError;

  // Search and filter state
  final TextEditingController _searchController = TextEditingController();
  String _selectedVehicleStatus = 'all';
  String _sortBy = 'recent';

  // Pagination state
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
      } else {
        if (mounted) {
          setState(() {
            _vehiclesError = result['error']?.toString() ?? 'Failed to load vehicles';
            _isLoadingVehicles = false;
          });
        }
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
      _filteredVehicles = _vehicles.where((vehicle) {
        final matchesSearch = query.isEmpty || vehicle.name.toLowerCase().contains(query);
        return matchesSearch;
      }).toList();

      // Apply sorting
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

      // Reset to first page when filtering
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

            // Vehicle Status Filter
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

            // Sort By
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

            // Apply Button
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
    final startIndex = (_currentPage - 1) * _vehiclesPerPage;
    final endIndex = startIndex + _vehiclesPerPage;

    if (startIndex >= _filteredVehicles.length) {
      return [];
    }

    return _filteredVehicles.sublist(
      startIndex,
      endIndex > _filteredVehicles.length ? _filteredVehicles.length : endIndex,
    );
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
          // Search Bar
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
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _searchController.clear();
                        },
                      )
                    : null,
                filled: true,
                fillColor: AppStyles.background(context),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              ),
            ),
          ),

          // Results Count & Active Filters
          if (_filteredVehicles.isNotEmpty)
            Container(
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

          // Vehicle List
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
                      itemBuilder: (context, index) {
                        return _buildVehicleCard(_paginatedVehicles[index]);
                      },
                    ),
                  ),
          ),

          // Pagination Controls
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
        onTap: () {
          Navigator.push(context, MaterialPageRoute(builder: (_) => VehicleBookingsDetailScreen(vehicle: vehicle)));
        },
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Vehicle Image
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
                  // Status Badge
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

                  // Vehicle Name
                  Text(vehicle.name, style: AppStyles.h3(context), maxLines: 2, overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 8),

                  // Stats Row
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

                  // View Bookings Button
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => VehicleBookingsDetailScreen(vehicle: vehicle)),
                        );
                      },
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
          // Previous Button
          TextButton.icon(
            onPressed: _currentPage > 1
                ? () {
                    setState(() => _currentPage--);
                  }
                : null,
            icon: const Icon(Icons.chevron_left),
            label: const Text('Previous'),
            style: TextButton.styleFrom(foregroundColor: AppStyles.primary, disabledForegroundColor: Colors.grey),
          ),

          // Page Indicator
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

          // Next Button
          TextButton.icon(
            onPressed: _currentPage < _totalPages
                ? () {
                    setState(() => _currentPage++);
                  }
                : null,
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
              onPressed: () {
                Navigator.pushNamed(context, '/owner/vehicles/create');
              },
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

// ==================== VEHICLE BOOKINGS DETAIL SCREEN ====================

class VehicleBookingsDetailScreen extends StatefulWidget {
  final OwnerVehicle vehicle;

  const VehicleBookingsDetailScreen({super.key, required this.vehicle});

  @override
  State<VehicleBookingsDetailScreen> createState() => _VehicleBookingsDetailScreenState();
}

class _VehicleBookingsDetailScreenState extends State<VehicleBookingsDetailScreen> {
  final BookingApiService _bookingApi = BookingApiService();

  List<OwnerBooking> _bookings = [];
  List<OwnerBooking> _filteredBookings = [];
  bool _isLoading = false;
  String? _error;

  String _selectedStatus = 'all';
  String _sortBy = 'recent';

  // Pagination
  int _currentPage = 1;
  final int _bookingsPerPage = 10;

  @override
  void initState() {
    super.initState();
    _loadBookings();
  }

  Future<void> _loadBookings() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final response = await _bookingApi.getOwnerBookings(vehicleId: widget.vehicle.id, status: _selectedStatus);

      setState(() {
        _bookings = response.bookings;
        _applyFilters();
        _isLoading = false;
      });

      print('✅ Loaded ${_bookings.length} bookings for vehicle ${widget.vehicle.name}');
    } catch (e) {
      print('❌ Error loading bookings: $e');
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  void _applyFilters() {
    _filteredBookings = List.from(_bookings);

    // Apply sorting
    switch (_sortBy) {
      case 'recent':
        _filteredBookings.sort((a, b) => b.createdAt.compareTo(a.createdAt));
        break;
      case 'active':
        _filteredBookings.sort((a, b) {
          final aActive = ['booking', 'picked_up'].contains(a.status);
          final bActive = ['booking', 'picked_up'].contains(b.status);
          if (aActive && !bActive) return -1;
          if (!aActive && bActive) return 1;
          return b.createdAt.compareTo(a.createdAt);
        });
        break;
      case 'pending':
        _filteredBookings.sort((a, b) {
          final aPending = a.needsAction;
          final bPending = b.needsAction;
          if (aPending && !bPending) return -1;
          if (!aPending && bPending) return 1;
          return b.createdAt.compareTo(a.createdAt);
        });
        break;
      case 'amount':
        _filteredBookings.sort((a, b) => b.totalAmount.compareTo(a.totalAmount));
        break;
    }

    // Reset to first page
    _currentPage = 1;
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
                Text('Filter & Sort Bookings', style: AppStyles.h2(context)),
                const Spacer(),
                IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
              ],
            ),
            const SizedBox(height: 24),

            // Booking Status Filter
            Text('Booking Status', style: AppStyles.h3(context)),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children:
                  [
                    {'label': 'All', 'value': 'all'},
                    {'label': 'Pending', 'value': 'pending'},
                    {'label': 'Confirmed', 'value': 'booking'},
                    {'label': 'In Progress', 'value': 'picked_up'},
                    {'label': 'Awaiting Return', 'value': 'return_submitted'},
                    {'label': 'Completed', 'value': 'completed'},
                  ].map((status) {
                    final isSelected = _selectedStatus == status['value'];
                    return FilterChip(
                      label: Text(status['label'] as String),
                      selected: isSelected,
                      selectedColor: AppStyles.primary,
                      checkmarkColor: Colors.white,
                      labelStyle: TextStyle(color: isSelected ? Colors.white : AppStyles.textPrimary(context)),
                      onSelected: (_) {
                        setState(() => _selectedStatus = status['value'] as String);
                        Navigator.pop(context);
                        _loadBookings();
                      },
                    );
                  }).toList(),
            ),

            const SizedBox(height: 24),

            // Sort By
            Text('Sort By', style: AppStyles.h3(context)),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children:
                  [
                    {'label': 'Most Recent', 'value': 'recent', 'icon': Icons.access_time},
                    {'label': 'Active First', 'value': 'active', 'icon': Icons.local_shipping},
                    {'label': 'Needs Action', 'value': 'pending', 'icon': Icons.notification_important},
                    {'label': 'Highest Amount', 'value': 'amount', 'icon': Icons.attach_money},
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
                        _applyFilters();
                      },
                    );
                  }).toList(),
            ),

            const SizedBox(height: 24),

            // Apply Button
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

  Future<void> _handleUploadContract(OwnerBooking booking) async {
    final result = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (context) =>
            OwnerContractUploadScreen(bookingId: booking.id, vehicleName: booking.vehicle['name'] ?? 'Vehicle'),
      ),
    );

    // Reload bookings if contract was uploaded
    if (result == true && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Custom contract uploaded successfully!'), backgroundColor: Colors.green),
      );
      _loadBookings(); // Refresh the list
    }
  }

  List<OwnerBooking> get _paginatedBookings {
    final startIndex = (_currentPage - 1) * _bookingsPerPage;
    final endIndex = startIndex + _bookingsPerPage;

    if (startIndex >= _filteredBookings.length) {
      return [];
    }

    return _filteredBookings.sublist(
      startIndex,
      endIndex > _filteredBookings.length ? _filteredBookings.length : endIndex,
    );
  }

  int get _totalPages => (_filteredBookings.length / _bookingsPerPage).ceil();

  Future<void> _handleAccept(OwnerBooking booking) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Accept Booking'),
        content: const Text('Are you sure you want to accept this booking request?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
            child: const Text('Accept'),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    try {
      await _bookingApi.acceptBooking(booking.id);

      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Booking accepted successfully!'), backgroundColor: Colors.green));
        _loadBookings();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Failed to accept booking: $e'), backgroundColor: Colors.red));
      }
    }
  }

  Future<void> _handleReject(OwnerBooking booking) async {
    final reasonController = TextEditingController();
    final refundController = TextEditingController(text: booking.totalAmount.toString());

    final result = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Reject Booking'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: reasonController,
                decoration: const InputDecoration(
                  labelText: 'Rejection Reason',
                  hintText: 'Why are you rejecting this booking?',
                ),
                maxLines: 3,
              ),
              const SizedBox(height: 16),
              TextField(
                controller: refundController,
                decoration: const InputDecoration(labelText: 'Refund Amount (VND)', hintText: 'Enter refund amount'),
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 8),
              Text(
                'Max refund: ${booking.totalAmount} VND',
                style: AppStyles.caption(context).copyWith(color: Colors.grey),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              final reason = reasonController.text.trim();
              final refundAmount = int.tryParse(refundController.text) ?? 0;

              if (reason.isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please provide a reason')));
                return;
              }

              Navigator.pop(context, {'reason': reason, 'refundAmount': refundAmount});
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Reject'),
          ),
        ],
      ),
    );

    if (result == null) return;

    try {
      await _bookingApi.rejectBooking(
        bookingId: booking.id,
        reason: result['reason'],
        refundAmount: result['refundAmount'],
      );

      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Booking rejected'), backgroundColor: Colors.orange));
        _loadBookings();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Failed to reject booking: $e'), backgroundColor: Colors.red));
      }
    }
  }

  Future<void> _handleConfirmReturn(OwnerBooking booking) async {
    final result = await Navigator.push<Map<String, dynamic>>(
      context,
      MaterialPageRoute(builder: (_) => OwnerReturnConfirmationScreen(booking: booking)),
    );

    if (result != null && result['success'] == true) {
      _loadBookings();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppStyles.background(context),
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Bookings', style: AppStyles.h3(context)),
            Text(widget.vehicle.name, style: AppStyles.caption(context).copyWith(fontSize: 12)),
          ],
        ),
        actions: [IconButton(icon: const Icon(Icons.tune), onPressed: _showFilterSheet)],
      ),
      body: Column(
        children: [
          // Vehicle Info Header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppStyles.surface(context),
              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 2))],
            ),
            child: Row(
              children: [
                if (widget.vehicle.primaryPhoto != null)
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.asset(
                      widget.vehicle.primaryPhoto!,
                      width: 60,
                      height: 60,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Container(
                        width: 60,
                        height: 60,
                        color: Colors.grey[300],
                        child: const Icon(Icons.directions_car),
                      ),
                    ),
                  )
                else
                  Container(
                    width: 60,
                    height: 60,
                    decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(8)),
                    child: const Icon(Icons.directions_car),
                  ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.vehicle.name,
                        style: AppStyles.body(context).copyWith(fontWeight: FontWeight.w600),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Text('${widget.vehicle.totalRentals} total rentals', style: AppStyles.caption(context)),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Results Count
          if (_filteredBookings.isNotEmpty)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(
                children: [
                  Text(
                    '${_filteredBookings.length} booking${_filteredBookings.length != 1 ? 's' : ''}',
                    style: AppStyles.caption(context).copyWith(fontWeight: FontWeight.w600),
                  ),
                  const Spacer(),
                  if (_selectedStatus != 'all')
                    TextButton.icon(
                      onPressed: () {
                        setState(() => _selectedStatus = 'all');
                        _loadBookings();
                      },
                      icon: const Icon(Icons.clear_all, size: 18),
                      label: const Text('Clear Filters'),
                      style: TextButton.styleFrom(foregroundColor: AppStyles.primary),
                    ),
                ],
              ),
            ),

          // Bookings List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                ? _buildErrorState()
                : _filteredBookings.isEmpty
                ? _buildEmptyState()
                : RefreshIndicator(
                    onRefresh: _loadBookings,
                    child: ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _paginatedBookings.length,
                      itemBuilder: (context, index) {
                        return _buildBookingCard(_paginatedBookings[index]);
                      },
                    ),
                  ),
          ),

          // Pagination Controls
          if (_filteredBookings.isNotEmpty && _totalPages > 1) _buildPaginationControls(),
        ],
      ),
    );
  }

  Widget _buildBookingCard(OwnerBooking booking) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status badge
            Row(
              children: [
                _buildStatusBadgeBooking(booking.status),
                const Spacer(),
                if (booking.needsAction)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.orange.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Text(
                      'ACTION NEEDED',
                      style: TextStyle(color: Colors.orange, fontSize: 11, fontWeight: FontWeight.bold),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 12),

            // Booking details
            Text('Booking ID: ${booking.id.substring(0, 8)}...', style: AppStyles.caption(context)),
            const SizedBox(height: 8),
            Text(
              'Customer: ${booking.customerId.substring(0, 8)}...',
              style: AppStyles.body(context).copyWith(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.calendar_today, size: 14, color: Colors.grey),
                const SizedBox(width: 4),
                Text(
                  '${_formatDate(booking.startDate)} - ${_formatDate(booking.endDate)}',
                  style: AppStyles.caption(context),
                ),
                const SizedBox(width: 12),
                Text('(${booking.duration})', style: AppStyles.caption(context)),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              'Total: ${_formatPrice(booking.totalAmount)} ₫',
              style: AppStyles.body(context).copyWith(color: AppStyles.primary, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),

            // ✅ UPDATED: Action buttons with contract upload option
            if (booking.status == 'pending')
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => _handleReject(booking),
                      style: OutlinedButton.styleFrom(foregroundColor: Colors.red),
                      child: const Text('Reject'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () => _handleAccept(booking),
                      style: AppStyles.primaryButtonStyle(context),
                      child: const Text('Accept'),
                    ),
                  ),
                ],
              )
            // ✅ NEW: Upload Contract button for 'booking' status
            else if (booking.status == 'booking')
              Column(
                children: [
                  // Info banner
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.blue.shade50,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.blue.shade200),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.info_outline, color: Colors.blue.shade700, size: 20),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'You can upload a custom rental contract (optional)',
                            style: AppStyles.caption(context).copyWith(color: Colors.blue.shade700),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () => _handleUploadContract(booking),
                      style: AppStyles.primaryButtonStyle(context),
                      icon: const Icon(Icons.upload_file, size: 20),
                      label: const Text('Upload Custom Contract'),
                    ),
                  ),
                ],
              )
            else if (booking.status == 'return_submitted')
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => _handleConfirmReturn(booking),
                  style: AppStyles.primaryButtonStyle(context),
                  child: const Text('Confirm Return'),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusBadgeBooking(String status) {
    Color color;
    String label;

    switch (status) {
      case 'pending':
        color = Colors.orange;
        label = 'PENDING';
        break;
      case 'booking':
        color = Colors.blue;
        label = 'CONFIRMED';
        break;
      case 'picked_up':
        color = Colors.purple;
        label = 'IN PROGRESS';
        break;
      case 'return_submitted':
        color = Colors.indigo;
        label = 'AWAITING CONFIRMATION';
        break;
      case 'completed':
        color = Colors.green;
        label = 'COMPLETED';
        break;
      case 'cancelled':
        color = Colors.red;
        label = 'CANCELLED';
        break;
      default:
        color = Colors.grey;
        label = status.toUpperCase();
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color),
      ),
      child: Text(
        label,
        style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.bold),
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
          Icon(Icons.inbox, size: 64, color: AppStyles.textSecondary(context).withOpacity(0.5)),
          const SizedBox(height: 16),
          Text('No bookings yet', style: AppStyles.h3(context)),
          const SizedBox(height: 8),
          Text(
            _selectedStatus != 'all' ? 'No bookings with this status' : 'Bookings will appear here',
            style: AppStyles.caption(context),
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
          Text('Failed to load bookings', style: AppStyles.body(context)),
          Text(_error ?? 'Unknown error', style: AppStyles.caption(context)),
          const SizedBox(height: 24),
          ElevatedButton(
            style: AppStyles.primaryButtonStyle(context),
            onPressed: _loadBookings,
            child: const Text('Retry'),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }

  String _formatPrice(int price) {
    return price.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},');
  }
}

// ==================== OWNER RETURN CONFIRMATION SCREEN ====================

class OwnerReturnConfirmationScreen extends StatefulWidget {
  final OwnerBooking booking;

  const OwnerReturnConfirmationScreen({super.key, required this.booking});

  @override
  State<OwnerReturnConfirmationScreen> createState() => _OwnerReturnConfirmationScreenState();
}

class _OwnerReturnConfirmationScreenState extends State<OwnerReturnConfirmationScreen> {
  final BookingApiService _bookingApi = BookingApiService();
  final ImagePicker _picker = ImagePicker();

  final TextEditingController _odometerController = TextEditingController();
  final TextEditingController _notesController = TextEditingController();

  List<File> _photos = [];
  bool _isSubmitting = false;
  bool _damagesReported = false;
  String _action = 'complete'; // 'complete' or 'dispute'

  @override
  void dispose() {
    _odometerController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final XFile? image = await _picker.pickImage(source: source, maxWidth: 1920, maxHeight: 1080, imageQuality: 85);
      if (image != null) {
        setState(() {
          _photos.add(File(image.path));
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Failed to pick image: $e'), backgroundColor: Colors.red));
      }
    }
  }

  void _showImageSourceDialog() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.camera_alt, color: Colors.blue),
                title: const Text('Take Photo'),
                onTap: () {
                  Navigator.pop(context);
                  _pickImage(ImageSource.camera);
                },
              ),
              ListTile(
                leading: const Icon(Icons.photo_library, color: Colors.green),
                title: const Text('Choose from Gallery'),
                onTap: () {
                  Navigator.pop(context);
                  _pickImage(ImageSource.gallery);
                },
              ),
              ListTile(
                leading: const Icon(Icons.close, color: Colors.grey),
                title: const Text('Cancel'),
                onTap: () => Navigator.pop(context),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _removePhoto(int index) {
    setState(() {
      _photos.removeAt(index);
    });
  }

  Future<void> _submitConfirmation() async {
    if (_photos.length < 3) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Please take at least 3 photos'), backgroundColor: Colors.orange));
      return;
    }

    final odometerReading = int.tryParse(_odometerController.text.trim());
    if (odometerReading == null || odometerReading <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid odometer reading'), backgroundColor: Colors.orange),
      );
      return;
    }

    if (_damagesReported && _notesController.text.trim().isEmpty) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Please describe the damages'), backgroundColor: Colors.orange));
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      await _bookingApi.ownerConfirmReturn(
        bookingId: widget.booking.id,
        conditionPhotos: _photos,
        conditionNotes: _notesController.text.trim(),
        damagesReported: _damagesReported,
        odometerReading: odometerReading,
        action: _action,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              _action == 'complete' ? 'Return confirmed - Booking completed!' : 'Dispute opened for review',
            ),
            backgroundColor: _action == 'complete' ? Colors.green : Colors.orange,
          ),
        );
        Navigator.pop(context, {'success': true});
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Failed to submit: $e'), backgroundColor: Colors.red));
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppStyles.background(context),
      appBar: AppBar(title: const Text('Confirm Return'), centerTitle: true),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Booking summary
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Booking', style: AppStyles.h3(context)),
                    const SizedBox(height: 8),
                    Text('ID: ${widget.booking.id.substring(0, 8)}...'),
                    Text('Vehicle: ${widget.booking.vehicle['name'] ?? 'Unknown'}'),
                    Text(
                      'Period: ${_formatDateBooking(widget.booking.startDate)} – ${_formatDateBooking(widget.booking.endDate)}',
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 24),

            Text('Photos (${_photos.length}/3+)', style: AppStyles.h3(context)),
            const SizedBox(height: 12),

            if (_photos.isNotEmpty)
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 3,
                  crossAxisSpacing: 8,
                  mainAxisSpacing: 8,
                ),
                itemCount: _photos.length,
                itemBuilder: (context, index) {
                  return Stack(
                    fit: StackFit.expand,
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Image.file(_photos[index], fit: BoxFit.cover),
                      ),
                      Positioned(
                        top: 4,
                        right: 4,
                        child: GestureDetector(
                          onTap: () => _removePhoto(index),
                          child: Container(
                            padding: const EdgeInsets.all(4),
                            decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle),
                            child: const Icon(Icons.close, color: Colors.white, size: 16),
                          ),
                        ),
                      ),
                    ],
                  );
                },
              ),

            const SizedBox(height: 16),

            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: _showImageSourceDialog,
                icon: const Icon(Icons.add_a_photo),
                label: const Text('Add Photo'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppStyles.primary,
                  side: BorderSide(color: AppStyles.primary),
                ),
              ),
            ),

            const SizedBox(height: 32),

            Text('Odometer Reading *', style: AppStyles.h3(context)),
            const SizedBox(height: 8),
            TextField(
              controller: _odometerController,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                hintText: 'Enter current reading (km)',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),

            const SizedBox(height: 24),

            CheckboxListTile(
              value: _damagesReported,
              onChanged: (value) {
                setState(() {
                  _damagesReported = value ?? false;
                  if (_damagesReported) _action = 'dispute';
                });
              },
              title: const Text('Report damages'),
              subtitle: const Text('Check if there are damages or issues'),
              activeColor: Colors.orange,
              contentPadding: EdgeInsets.zero,
            ),

            const SizedBox(height: 16),

            Text('Notes', style: AppStyles.h3(context)),
            const SizedBox(height: 8),
            TextField(
              controller: _notesController,
              maxLines: 4,
              decoration: InputDecoration(
                hintText: _damagesReported ? 'Describe damages...' : 'Any observations?',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),

            const SizedBox(height: 32),

            SizedBox(
              width: double.infinity,
              height: 54,
              child: ElevatedButton(
                onPressed: _isSubmitting ? null : _submitConfirmation,
                style: ElevatedButton.styleFrom(
                  backgroundColor: _action == 'complete' ? Colors.green : Colors.orange,
                  foregroundColor: Colors.white,
                ),
                child: _isSubmitting
                    ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(color: Colors.white))
                    : Text(_action == 'complete' ? 'Complete Booking' : 'Submit Dispute'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatDateBooking(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}
