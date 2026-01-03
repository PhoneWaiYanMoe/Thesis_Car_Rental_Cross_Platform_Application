// lib/screens/Owner/views/owner_bookings_screen.dart
import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/screens/Booking/services/booking_api_service.dart';

class OwnerBookingsScreen extends StatefulWidget {
  const OwnerBookingsScreen({super.key});

  @override
  State<OwnerBookingsScreen> createState() => _OwnerBookingsScreenState();
}

class _OwnerBookingsScreenState extends State<OwnerBookingsScreen> {
  final BookingApiService _bookingApi = BookingApiService();

  List<OwnerBooking> _bookings = [];
  bool _isLoading = false;
  String _selectedStatus = 'all';
  String? _error;

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
      final response = await _bookingApi.getOwnerBookings(status: _selectedStatus);

      setState(() {
        _bookings = response.bookings;
        _isLoading = false;
      });

      print('✅ Loaded ${_bookings.length} owner bookings');
    } catch (e) {
      print('❌ Error loading owner bookings: $e');
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

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
    // This would open a screen to capture photos and confirm return
    // For now, show a simplified dialog
    final notesController = TextEditingController();
    final odometerController = TextEditingController();

    final result = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirm Return'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('Take 3+ photos of the car condition'),
              const SizedBox(height: 16),
              TextField(
                controller: odometerController,
                decoration: const InputDecoration(labelText: 'Odometer Reading', hintText: 'Enter current reading'),
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 16),
              TextField(
                controller: notesController,
                decoration: const InputDecoration(labelText: 'Condition Notes', hintText: 'Any damages or issues?'),
                maxLines: 3,
              ),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context, {
                'action': 'complete',
                'odometer': int.tryParse(odometerController.text) ?? 0,
                'notes': notesController.text,
              });
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
            child: const Text('Complete (No Issues)'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context, {
                'action': 'dispute',
                'odometer': int.tryParse(odometerController.text) ?? 0,
                'notes': notesController.text,
              });
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.orange),
            child: const Text('Open Dispute'),
          ),
        ],
      ),
    );

    if (result == null) return;

    try {
      // Mock photos for now
      final mockPhotos = ['photo1.jpg', 'photo2.jpg', 'photo3.jpg'];

      await _bookingApi.ownerConfirmReturn(
        bookingId: booking.id,
        conditionPhotos: mockPhotos,
        conditionNotes: result['notes'] ?? '',
        damagesReported: result['action'] == 'dispute',
        odometerReading: result['odometer'] ?? 0,
        action: result['action'],
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              result['action'] == 'complete' ? 'Return confirmed - Booking completed!' : 'Dispute opened for CS review',
            ),
            backgroundColor: result['action'] == 'complete' ? Colors.green : Colors.orange,
          ),
        );
        _loadBookings();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Failed to confirm return: $e'), backgroundColor: Colors.red));
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
            Text('Filter by Status', style: AppStyles.h2(context)),
            const SizedBox(height: 20),
            Wrap(
              spacing: 8,
              children: ['all', 'pending', 'booking', 'picked_up', 'return_submitted', 'completed'].map((status) {
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
        title: Text('Booking Requests', style: AppStyles.h2(context)),
        centerTitle: true,
        actions: [IconButton(icon: const Icon(Icons.tune), onPressed: _showFilterSheet)],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
          ? _buildErrorState()
          : _bookings.isEmpty
          ? _buildEmptyState()
          : RefreshIndicator(
              onRefresh: _loadBookings,
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: _bookings.length,
                itemBuilder: (context, index) {
                  return _buildBookingCard(_bookings[index]);
                },
              ),
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
          Text('No booking requests', style: AppStyles.h3(context)),
          const SizedBox(height: 8),
          Text('Booking requests will appear here', style: AppStyles.caption(context)),
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
                _buildStatusBadge(booking.status),
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

            // Action buttons
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

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }

  String _formatPrice(int price) {
    return price.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},');
  }
}
