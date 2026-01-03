// Mobile/wiz/lib/screens/Booking/views/rental_history_screen.dart
import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/screens/Booking/services/booking_api_service.dart';
import 'package:wiz/utils/app_routes.dart';

class RentalHistoryScreen extends StatefulWidget {
  const RentalHistoryScreen({super.key});

  @override
  State<RentalHistoryScreen> createState() => _RentalHistoryScreenState();
}

class _RentalHistoryScreenState extends State<RentalHistoryScreen> {
  final TextEditingController _searchController = TextEditingController();
  final BookingApiService _bookingApi = BookingApiService();

  List<CustomerBooking> _bookings = [];
  bool _isLoading = true;
  String? _error;
  String _selectedStatus = 'all';

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
      final response = await _bookingApi.getMyBookings(status: _selectedStatus == 'all' ? null : _selectedStatus);

      setState(() {
        _bookings = response.bookings;
        _isLoading = false;
      });

      print('📋 Loaded ${_bookings.length} customer bookings from backend');
    } catch (e) {
      print('❌ Error loading bookings: $e');
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
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
            Text('Filter by Status', style: AppStyles.h2(context)),
            const SizedBox(height: 20),
            Wrap(
              spacing: 8,
              children: ['all', 'pending', 'booking', 'picked_up', 'return_submitted', 'completed', 'cancelled'].map((
                status,
              ) {
                final isSelected = _selectedStatus == status;
                return FilterChip(
                  label: Text(status.toUpperCase().replaceAll('_', ' ')),
                  selected: isSelected,
                  selectedColor: AppStyles.primary,
                  checkmarkColor: Colors.white,
                  onSelected: (_) {
                    setState(() => _selectedStatus = status);
                    Navigator.pop(context);
                    _loadBookings();
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
        title: Text('Rental History', style: AppStyles.h2(context)),
        centerTitle: true,
        backgroundColor: AppStyles.background(context),
        elevation: 0,
        actions: [IconButton(icon: const Icon(Icons.tune), onPressed: _showFilterSheet)],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _searchController,
              decoration: AppStyles.inputDecoration(hint: 'Search bookings', icon: Icons.search, context: context),
              onChanged: (value) {
                // TODO: Implement search filter
              },
            ),
          ),

          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                ? _buildErrorState()
                : _bookings.isEmpty
                ? _buildEmptyState()
                : RefreshIndicator(onRefresh: _loadBookings, child: _buildBookingsList()),
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
          Icon(Icons.history, size: 64, color: AppStyles.textSecondary(context).withOpacity(0.5)),
          const SizedBox(height: 16),
          Text('No bookings yet', style: AppStyles.h3(context)),
          const SizedBox(height: 8),
          Text('Your rental history will appear here', style: AppStyles.caption(context)),
          const SizedBox(height: 24),
          ElevatedButton(
            style: AppStyles.primaryButtonStyle(context),
            onPressed: () {
              Navigator.pop(context);
            },
            child: const Text('Browse Cars'),
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

  Widget _buildBookingsList() {
    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      itemCount: _bookings.length,
      itemBuilder: (context, index) {
        final booking = _bookings[index];
        return GestureDetector(
          onTap: () async {
            // Navigate to details and refresh on return
            final result = await Navigator.pushNamed(
              context,
              AppRoutes.rentalDetails,
              arguments: {'bookingId': booking.id},
            );

            if (result == true) {
              _loadBookings();
            }
          },
          child: Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: AppStyles.surface(context), borderRadius: BorderRadius.circular(16)),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Status badge
                Row(
                  children: [
                    _buildStatusBadge(booking.status),
                    const Spacer(),
                    if (booking.canCancel)
                      const Icon(Icons.cancel_outlined, size: 16, color: Colors.orange)
                    else if (booking.canReview)
                      const Icon(Icons.star_border, size: 16, color: Colors.amber),
                  ],
                ),
                const SizedBox(height: 12),

                // Vehicle info
                Text(booking.vehicle['name'] ?? 'Unknown Vehicle', style: AppStyles.h3(context)),
                const SizedBox(height: 4),
                Text('Booking ID: ${booking.id.substring(0, 8)}...', style: AppStyles.caption(context)),
                const SizedBox(height: 8),

                // Dates
                Row(
                  children: [
                    const Icon(Icons.calendar_today, size: 14, color: Colors.grey),
                    const SizedBox(width: 4),
                    Text(
                      '${_formatDate(booking.startDate)} - ${_formatDate(booking.endDate)}',
                      style: AppStyles.caption(context),
                    ),
                  ],
                ),
                const SizedBox(height: 8),

                // Price and duration
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      '${_formatPrice(booking.pricing['total'] ?? 0)} ₫',
                      style: AppStyles.body(context).copyWith(color: AppStyles.primary, fontWeight: FontWeight.bold),
                    ),
                    Text(booking.duration, style: AppStyles.caption(context)),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildStatusBadge(String status) {
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
        label = 'ON JOURNEY';
        break;
      case 'return_submitted':
        color = Colors.indigo;
        label = 'RETURN SUBMITTED';
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

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }

  String _formatPrice(int price) {
    return price.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},');
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }
}
