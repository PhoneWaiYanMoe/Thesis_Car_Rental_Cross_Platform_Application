import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/screens/Booking/services/booking_api_service.dart';
import 'package:wiz/screens/Payment/views/stripe_payment_screen.dart';
import 'package:wiz/utils/app_routes.dart';

class RentalDetailsScreen extends StatefulWidget {
  final String bookingId;

  const RentalDetailsScreen({super.key, required this.bookingId});

  @override
  State<RentalDetailsScreen> createState() => _RentalDetailsScreenState();
}

class _RentalDetailsScreenState extends State<RentalDetailsScreen> {
  final _bookingApiService = BookingApiService();
  bool _isLoading = true;
  BookingDetailsResponse? _bookingDetails;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadBookingDetails();
  }

  Future<void> _loadBookingDetails() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final details = await _bookingApiService.getBookingDetails(widget.bookingId);
      setState(() {
        _bookingDetails = details;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppStyles.background(context),
      appBar: AppBar(
        title: Text('Rental Details', style: AppStyles.h2(context)),
        centerTitle: true,
        backgroundColor: AppStyles.background(context),
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _errorMessage != null
          ? _buildErrorView()
          : _bookingDetails != null
          ? _buildDetailsView()
          : const Center(child: Text('No booking details found')),
    );
  }

  Widget _buildErrorView() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: Colors.red.shade300),
            const SizedBox(height: 16),
            Text('Error loading booking details', style: AppStyles.h3(context)),
            const SizedBox(height: 8),
            Text(_errorMessage ?? 'Unknown error', style: AppStyles.caption(context), textAlign: TextAlign.center),
            const SizedBox(height: 24),
            ElevatedButton(
              style: AppStyles.primaryButtonStyle(context),
              onPressed: _loadBookingDetails,
              child: Text('Retry', style: AppStyles.button),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailsView() {
    final booking = _bookingDetails!;
    final isCancelled = booking.status == 'cancelled' || booking.status == 'rejected';

    return RefreshIndicator(
      onRefresh: _loadBookingDetails,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildStatusCard(booking),
            const SizedBox(height: 16),

            // Show cancellation/rejection reason if cancelled
            if (isCancelled) ...[_buildCancellationReasonCard(booking), const SizedBox(height: 16)],

            _buildVehicleCard(booking),
            const SizedBox(height: 16),
            _buildTimelineCard(booking),
            const SizedBox(height: 16),
            _buildLocationCard(booking),
            const SizedBox(height: 16),
            _buildBillingCard(booking),
            const SizedBox(height: 16),

            // Only show payment steps if NOT cancelled
            if (!isCancelled) ...[
              _buildPaymentStepsCard(booking),
              const SizedBox(height: 16),
              _buildActionButtons(booking),
            ],

            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusCard(BookingDetailsResponse booking) {
    Color statusColor = _getStatusColor(booking.status);
    String statusText = _getStatusText(booking.status);

    return Card(
      color: AppStyles.surface(context),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: statusColor.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
              child: Icon(Icons.receipt_long, color: statusColor, size: 28),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Booking ID', style: AppStyles.caption(context)),
                  const SizedBox(height: 4),
                  Text(booking.id.substring(0, 8).toUpperCase(), style: AppStyles.h3(context)),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: statusColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: statusColor),
              ),
              child: Text(
                statusText,
                style: AppStyles.caption(context).copyWith(color: statusColor, fontWeight: FontWeight.w600),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ✅ NEW: Cancellation/Rejection Reason Card
  Widget _buildCancellationReasonCard(BookingDetailsResponse booking) {
    String? reason;
    String title;
    Color color;
    IconData icon;
    String? refundInfo;

    // ✅ SMART LOGIC: Show whichever reason is available
    if (booking.status == 'cancelled' || booking.status == 'rejected') {
      // Try to get cancellation reason first, then rejection reason
      reason = booking.cancellationReason ?? booking.rejectionReason;

      // Determine if it was cancelled by customer or rejected by owner
      if (booking.cancellationReason != null) {
        // Customer cancelled
        title = 'Cancellation Reason ';
        color = Colors.orange;
        icon = Icons.cancel;
      } else if (booking.rejectionReason != null) {
        // Owner rejected
        title = 'Rejection Reason (Owner)';
        color = Colors.red;
        icon = Icons.block;
      } else {
        // No reason provided, but still cancelled/rejected
        title = booking.status == 'cancelled' ? 'Cancellation Reason' : 'Rejection Reason';
        color = booking.status == 'cancelled' ? Colors.orange : Colors.red;
        icon = booking.status == 'cancelled' ? Icons.cancel : Icons.block;
        reason = 'No reason provided';
      }

      // Add refund information if available
      if (booking.refundAmount != null && booking.refundAmount! > 0) {
        refundInfo = 'Refund: ${_formatPrice(booking.refundAmount!)} ₫ (${booking.refundStatus ?? 'processing'})';
      }
    } else {
      return const SizedBox.shrink();
    }

    return Card(
      color: AppStyles.surface(context),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: color.withOpacity(0.3)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, color: color, size: 24),
                const SizedBox(width: 12),
                Text(title, style: AppStyles.h3(context).copyWith(color: color)),
              ],
            ),
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: AppStyles.surface(context), borderRadius: BorderRadius.circular(8)),
              child: Text(reason ?? 'No reason provided', style: AppStyles.body(context)),
            ),
            // Show refund information if available
            if (refundInfo != null) ...[
              const SizedBox(height: 12),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.green.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.green.withOpacity(0.3)),
                ),
                child: Row(
                  children: [
                    Icon(Icons.attach_money, color: Colors.green, size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(refundInfo, style: AppStyles.body(context).copyWith(color: Colors.green.shade700)),
                    ),
                  ],
                ),
              ),
            ],
            // Show cancellation date if available
            if (booking.cancellationDate != null) ...[
              const SizedBox(height: 8),
              Text('Cancelled on: ${_formatDateTime(booking.cancellationDate!)}', style: AppStyles.caption(context)),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildVehicleCard(BookingDetailsResponse booking) {
    return Card(
      color: AppStyles.surface(context),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppStyles.primary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(Icons.directions_car, color: AppStyles.primary, size: 28),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Vehicle', style: AppStyles.caption(context)),
                  const SizedBox(height: 4),
                  Text(booking.vehicle.name, style: AppStyles.h3(context)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTimelineCard(BookingDetailsResponse booking) {
    final timeline = booking.timeline;
    final startDate = DateTime.parse(timeline['startDate']);
    final endDate = DateTime.parse(timeline['endDate']);
    final duration = timeline['duration'] ?? '';

    return Card(
      color: AppStyles.surface(context),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Rental Period', style: AppStyles.h3(context)),
            const SizedBox(height: 16),
            _buildTimelineRow(Icons.event, 'Start Date', _formatDateTime(startDate)),
            const SizedBox(height: 12),
            _buildTimelineRow(Icons.event, 'End Date', _formatDateTime(endDate)),
            const SizedBox(height: 12),
            _buildTimelineRow(Icons.access_time, 'Duration', duration),
          ],
        ),
      ),
    );
  }

  Widget _buildTimelineRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, color: AppStyles.primary, size: 20),
        const SizedBox(width: 12),
        Text('$label:', style: AppStyles.caption(context)),
        const Spacer(),
        Text(value, style: AppStyles.body(context).copyWith(fontWeight: FontWeight.w600)),
      ],
    );
  }

  Widget _buildLocationCard(BookingDetailsResponse booking) {
    return Card(
      color: AppStyles.surface(context),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Location Details', style: AppStyles.h3(context)),
            const SizedBox(height: 16),
            _buildLocationRow(Icons.location_on, 'Pickup', booking.pickup['address'] ?? 'Not specified'),
            const SizedBox(height: 12),
            _buildLocationRow(Icons.flag, 'Drop-off', booking.dropoff['address'] ?? 'Not specified'),
          ],
        ),
      ),
    );
  }

  Widget _buildLocationRow(IconData icon, String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: AppStyles.primary, size: 20),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('$label:', style: AppStyles.caption(context)),
              const SizedBox(height: 4),
              Text(value, style: AppStyles.body(context)),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildBillingCard(BookingDetailsResponse booking) {
    final billing = booking.billing;

    return Card(
      color: AppStyles.surface(context),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Billing Details', style: AppStyles.h3(context)),
            const SizedBox(height: 16),
            _buildBillingRow('Rental Price', billing.rentalPrice),
            const SizedBox(height: 8),
            _buildBillingRow('Insurance Fee', billing.insuranceFee),
            const Divider(height: 24),
            _buildBillingRow('Total', billing.total, isTotal: true),
            const SizedBox(height: 16),
            _buildBillingRow('Deposit (30%)', billing.deposit, isPaid: billing.depositPaid),
            const SizedBox(height: 8),
            _buildBillingRow('Remaining Payment', billing.remainingPayment, isPaid: billing.finalPaymentPaid),
          ],
        ),
      ),
    );
  }

  Widget _buildBillingRow(String label, int amount, {bool isTotal = false, bool? isPaid}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            Text(
              label,
              style: isTotal
                  ? AppStyles.body(context).copyWith(fontWeight: FontWeight.bold)
                  : AppStyles.caption(context),
            ),
            if (isPaid != null) ...[
              const SizedBox(width: 8),
              Icon(isPaid ? Icons.check_circle : Icons.pending, size: 16, color: isPaid ? Colors.green : Colors.orange),
            ],
          ],
        ),
        Text(
          '${_formatPrice(amount)} ₫',
          style: isTotal
              ? AppStyles.h3(context).copyWith(color: AppStyles.primary)
              : AppStyles.body(context).copyWith(fontWeight: FontWeight.w600),
        ),
      ],
    );
  }

  // ✅ UPDATED: Payment Steps Card with Correct Order
  Widget _buildPaymentStepsCard(BookingDetailsResponse booking) {
    return Card(
      color: AppStyles.surface(context),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Payment Progress', style: AppStyles.h3(context)),
            const SizedBox(height: 16),

            // Step 1: Deposit Payment
            _buildPaymentStep(
              step: 1,
              title: 'Deposit Payment',
              description: '30% of total amount',
              isCompleted: booking.billing.depositPaid,
              isCurrent: booking.actions.needsDepositPayment,
            ),

            // Step 2: Owner Approval
            _buildPaymentStep(
              step: 2,
              title: 'Owner Approval',
              description: 'Waiting for owner confirmation',
              isCompleted: booking.status != 'pending' && booking.status != 'pending_payment',
              isCurrent: booking.actions.needsOwnerApproval,
            ),

            // Step 3: Sign Contract
            _buildPaymentStep(
              step: 3,
              title: 'Sign Contract',
              description: 'Sign rental agreement',
              isCompleted: booking.contract != null,
              isCurrent: booking.actions.canSignContract,
            ),

            // Step 4: Final Payment
            _buildPaymentStep(
              step: 4,
              title: 'Final Payment',
              description: 'Remaining 70% payment',
              isCompleted: booking.billing.finalPaymentPaid,
              isCurrent: booking.actions.needsFinalPayment,
            ),

            // Step 5: Submit Pickup Photos
            _buildPaymentStep(
              step: 5,
              title: 'Pickup Photos',
              description: 'Submit vehicle condition',
              isCompleted: booking.pickupPhotos != null,
              isCurrent: booking.actions.canSubmitPickupPhotos,
            ),

            // Step 6: Return Journey
            _buildPaymentStep(
              step: 6,
              title: 'Return Photos',
              description: 'Submit return condition',
              isCompleted: booking.returnPhotos != null,
              isCurrent: booking.actions.canSubmitReturnPhotos,
              isLast: true,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPaymentStep({
    required int step,
    required String title,
    required String description,
    required bool isCompleted,
    required bool isCurrent,
    bool isLast = false,
  }) {
    Color stepColor = isCompleted
        ? Colors.green
        : isCurrent
        ? AppStyles.primary
        : Colors.grey.shade400;

    return Column(
      children: [
        Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: stepColor.withOpacity(0.1),
                shape: BoxShape.circle,
                border: Border.all(color: stepColor, width: 2),
              ),
              child: Center(
                child: isCompleted
                    ? Icon(Icons.check, color: stepColor, size: 20)
                    : Text(
                        '$step',
                        style: TextStyle(color: stepColor, fontWeight: FontWeight.bold),
                      ),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: AppStyles.body(
                      context,
                    ).copyWith(fontWeight: FontWeight.w600, color: isCurrent ? AppStyles.primary : null),
                  ),
                  const SizedBox(height: 2),
                  Text(description, style: AppStyles.caption(context)),
                ],
              ),
            ),
          ],
        ),
        if (!isLast)
          Padding(
            padding: const EdgeInsets.only(left: 19, top: 4, bottom: 4),
            child: Container(width: 2, height: 24, color: isCompleted ? Colors.green : Colors.grey.shade300),
          ),
      ],
    );
  }

  Widget _buildActionButtons(BookingDetailsResponse booking) {
    return Column(
      children: [
        // Deposit Payment Button
        if (booking.actions.needsDepositPayment) ...[
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              style: AppStyles.primaryButtonStyle(context),
              onPressed: () => _handleDepositPayment(booking),
              icon: const Icon(Icons.payment, color: Colors.white),
              label: Text('Pay Deposit (${_formatPrice(booking.billing.deposit)} ₫)', style: AppStyles.button),
            ),
          ),
          const SizedBox(height: 12),
        ],

        // Sign Contract Button
        if (booking.actions.canSignContract) ...[
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              style: AppStyles.primaryButtonStyle(context),
              onPressed: () => _handleSignContract(booking),
              icon: const Icon(Icons.edit_document, color: Colors.white),
              label: Text('Sign Contract', style: AppStyles.button),
            ),
          ),
          const SizedBox(height: 12),
        ],

        // Final Payment Button
        if (booking.actions.needsFinalPayment) ...[
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              style: AppStyles.primaryButtonStyle(context),
              onPressed: () => _handleFinalPayment(booking),
              icon: const Icon(Icons.payment, color: Colors.white),
              label: Text(
                'Pay Remaining (${_formatPrice(booking.billing.remainingPayment)} ₫)',
                style: AppStyles.button,
              ),
            ),
          ),
          const SizedBox(height: 12),
        ],

        // Submit Pickup Photos Button
        if (booking.actions.canSubmitPickupPhotos) ...[
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              style: AppStyles.primaryButtonStyle(context),
              onPressed: () => _handleSubmitPickupPhotos(booking),
              icon: const Icon(Icons.camera_alt, color: Colors.white),
              label: Text('Submit Pickup Photos', style: AppStyles.button),
            ),
          ),
          const SizedBox(height: 12),
        ],

        // Submit Return Photos Button
        if (booking.actions.canSubmitReturnPhotos) ...[
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              style: AppStyles.primaryButtonStyle(context),
              onPressed: () => _handleSubmitReturnPhotos(booking),
              icon: const Icon(Icons.camera_alt, color: Colors.white),
              label: Text('Submit Return Photos', style: AppStyles.button),
            ),
          ),
          const SizedBox(height: 12),
        ],

        // Cancel Booking Button
        if (booking.actions.canCancel) ...[
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                side: const BorderSide(color: Colors.red),
              ),
              onPressed: () => _handleCancelBooking(booking),
              icon: const Icon(Icons.cancel, color: Colors.red),
              label: const Text('Cancel Booking', style: TextStyle(color: Colors.red)),
            ),
          ),
        ],
      ],
    );
  }

  // Action Handlers
  Future<void> _handleDepositPayment(BookingDetailsResponse booking) async {
    final result = await Navigator.push<Map<String, dynamic>>(
      context,
      MaterialPageRoute(
        builder: (context) =>
            StripePaymentScreen(bookingId: booking.id, paymentType: 'deposit', amount: booking.billing.deposit),
      ),
    );

    if (result != null && result['success'] == true) {
      _loadBookingDetails();
    }
  }

  Future<void> _handleSignContract(BookingDetailsResponse booking) async {
    // Navigate to contract signing screen
    // TODO: Implement contract signing
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Contract signing feature coming soon')));
  }

  Future<void> _handleFinalPayment(BookingDetailsResponse booking) async {
    final result = await Navigator.push<Map<String, dynamic>>(
      context,
      MaterialPageRoute(
        builder: (context) =>
            StripePaymentScreen(bookingId: booking.id, paymentType: 'final', amount: booking.billing.remainingPayment),
      ),
    );

    if (result != null && result['success'] == true) {
      _loadBookingDetails();
    }
  }

  Future<void> _handleSubmitPickupPhotos(BookingDetailsResponse booking) async {
    // Navigate to photo submission screen
    Navigator.pushNamed(
      context,
      AppRoutes.photoSubmission,
      arguments: {'bookingId': booking.id, 'isStartJourney': true},
    ).then((_) => _loadBookingDetails());
  }

  Future<void> _handleSubmitReturnPhotos(BookingDetailsResponse booking) async {
    // Navigate to photo submission screen
    Navigator.pushNamed(
      context,
      AppRoutes.photoSubmission,
      arguments: {'bookingId': booking.id, 'isStartJourney': false},
    ).then((_) => _loadBookingDetails());
  }

  Future<void> _handleCancelBooking(BookingDetailsResponse booking) async {
    // Show cancellation dialog
    final TextEditingController reasonController = TextEditingController();

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppStyles.surface(context),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text('Cancel Booking?', style: AppStyles.h2(context)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Are you sure you want to cancel this booking?', style: AppStyles.body(context)),
            const SizedBox(height: 16),
            TextField(
              controller: reasonController,
              maxLines: 3,
              decoration: InputDecoration(
                hintText: 'Reason for cancellation',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text('No', style: TextStyle(color: AppStyles.primary)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Yes, Cancel', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await _bookingApiService.cancelBooking(
          bookingId: booking.id,
          reason: reasonController.text.isEmpty ? 'No reason provided' : reasonController.text,
        );

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Booking cancelled successfully'), backgroundColor: Colors.green),
          );
          _loadBookingDetails();
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(SnackBar(content: Text('Failed to cancel: $e'), backgroundColor: Colors.red));
        }
      }
    }
  }

  // Helper methods
  Color _getStatusColor(String status) {
    switch (status) {
      case 'pending_payment':
        return Colors.orange;
      case 'pending':
        return Colors.blue;
      case 'booking':
        return Colors.purple;
      case 'picked_up':
        return Colors.indigo;
      case 'return_submitted':
        return Colors.teal;
      case 'completed':
        return Colors.green;
      case 'cancelled':
      case 'rejected':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  String _getStatusText(String status) {
    switch (status) {
      case 'pending_payment':
        return 'Payment Pending';
      case 'pending':
        return 'Awaiting Approval';
      case 'booking':
        return 'Confirmed';
      case 'picked_up':
        return 'On Journey';
      case 'return_submitted':
        return 'Return Pending';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      case 'rejected':
        return 'Rejected';
      default:
        return status.toUpperCase();
    }
  }

  String _formatDateTime(DateTime dateTime) {
    return '${dateTime.day}/${dateTime.month}/${dateTime.year} ${dateTime.hour}:${dateTime.minute.toString().padLeft(2, '0')}';
  }

  String _formatPrice(int price) {
    return price.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},');
  }
}
