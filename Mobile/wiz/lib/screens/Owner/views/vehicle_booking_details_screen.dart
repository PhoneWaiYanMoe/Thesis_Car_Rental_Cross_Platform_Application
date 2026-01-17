// lib/screens/Owner/views/owner_booking_details_screen.dart
import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/screens/Booking/services/booking_api_service.dart';
import 'package:wiz/screens/Owner/models/owner_vehicle_model.dart';
import 'package:wiz/screens/Owner/views/owner_contract_upload_screen.dart';
import 'package:wiz/screens/Owner/views/owner_return_confirmation_screen.dart';

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
                  ].map((s) {
                    final selected = _selectedStatus == s['value'];
                    return FilterChip(
                      label: Text(s['label'] as String),
                      selected: selected,
                      selectedColor: AppStyles.primary,
                      checkmarkColor: Colors.white,
                      labelStyle: TextStyle(color: selected ? Colors.white : AppStyles.textPrimary(context)),
                      onSelected: (_) {
                        setState(() => _selectedStatus = s['value'] as String);
                        Navigator.pop(context);
                        _loadBookings();
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
                    {'label': 'Active First', 'value': 'active', 'icon': Icons.local_shipping},
                    {'label': 'Needs Action', 'value': 'pending', 'icon': Icons.notification_important},
                    {'label': 'Highest Amount', 'value': 'amount', 'icon': Icons.attach_money},
                  ].map((s) {
                    final selected = _sortBy == s['value'];
                    return FilterChip(
                      avatar: Icon(s['icon'] as IconData, size: 18, color: selected ? Colors.white : AppStyles.primary),
                      label: Text(s['label'] as String),
                      selected: selected,
                      selectedColor: AppStyles.primary,
                      checkmarkColor: Colors.white,
                      labelStyle: TextStyle(color: selected ? Colors.white : AppStyles.textPrimary(context)),
                      onSelected: (_) {
                        setState(() => _sortBy = s['value'] as String);
                        Navigator.pop(context);
                        _applyFilters();
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

  Future<void> _handleUploadContract(OwnerBooking booking) async {
    final result = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (_) =>
            OwnerContractUploadScreen(bookingId: booking.id, vehicleName: booking.vehicle['name'] ?? 'Vehicle'),
      ),
    );

    if (result == true && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Custom contract uploaded successfully!'), backgroundColor: Colors.green),
      );
      _loadBookings();
    }
  }

  Future<void> _handleAccept(OwnerBooking booking) async {
    final confirmed = await showDialog<bool>(
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

    if (confirmed != true) return;

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
    final reasonCtrl = TextEditingController();
    final refundCtrl = TextEditingController(text: booking.totalAmount.toString());

    final result = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Reject Booking'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: reasonCtrl,
                decoration: const InputDecoration(
                  labelText: 'Rejection Reason',
                  hintText: 'Why are you rejecting this booking?',
                ),
                maxLines: 3,
              ),
              const SizedBox(height: 16),
              TextField(
                controller: refundCtrl,
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
              final reason = reasonCtrl.text.trim();
              final refund = int.tryParse(refundCtrl.text) ?? 0;
              if (reason.isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please provide a reason')));
                return;
              }
              Navigator.pop(context, {'reason': reason, 'refundAmount': refund});
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

    if (result != null && result['success'] == true && mounted) {
      _loadBookings();
    }
  }

  List<OwnerBooking> get _paginatedBookings {
    final start = (_currentPage - 1) * _bookingsPerPage;
    final end = start + _bookingsPerPage;
    if (start >= _filteredBookings.length) return [];
    return _filteredBookings.sublist(start, end.clamp(0, _filteredBookings.length));
  }

  int get _totalPages => (_filteredBookings.length / _bookingsPerPage).ceil();

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
          // Vehicle header
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

          if (_filteredBookings.isNotEmpty)
            Padding(
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
                      itemBuilder: (context, i) => _buildBookingCard(_paginatedBookings[i]),
                    ),
                  ),
          ),

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
            else if (booking.status == 'booking')
              Column(
                children: [
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
