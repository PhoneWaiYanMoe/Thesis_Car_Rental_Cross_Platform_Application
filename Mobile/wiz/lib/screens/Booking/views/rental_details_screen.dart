import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/screens/Booking/services/booking_api_service.dart';
import 'package:wiz/screens/Booking/views/contract_signing_screen.dart';
import 'package:wiz/screens/Payment/views/stripe_payment_screen.dart';
import 'package:wiz/utils/app_routes.dart';
import 'package:wiz/services/media_api_service.dart';

class RentalDetailsScreen extends StatefulWidget {
  final String bookingId;

  const RentalDetailsScreen({super.key, required this.bookingId});

  @override
  State<RentalDetailsScreen> createState() => _RentalDetailsScreenState();
}

class _RentalDetailsScreenState extends State<RentalDetailsScreen> {
  final _bookingApiService = BookingApiService();
  final _mediaApiService = MediaApiService();
  bool _isLoading = true;
  BookingDetailsResponse? _bookingDetails;
  String? _errorMessage;

  // Media URLs cache
  Map<String, String> _mediaUrls = {};
  bool _isLoadingMedia = false;

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

      // Load media URLs after booking details are loaded
      _loadMediaUrls();
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _loadMediaUrls() async {
    if (_bookingDetails == null) return;

    setState(() {
      _isLoadingMedia = true;
    });

    try {
      final booking = _bookingDetails!;
      Map<String, String> urls = {};

      // ✅ FIX: Use signedContractUrl instead of url (old field no longer exists)
      final contractFileId = booking.contract?.signedContractUrl ?? booking.contract?.platformContractUrl;
      if (contractFileId != null && contractFileId.isNotEmpty) {
        try {
          final contractFile = await _mediaApiService.getFileById(contractFileId);
          urls['contract'] = contractFile.url;
          print('✅ Contract URL loaded: ${contractFile.url}');
        } catch (e) {
          print('❌ Failed to load contract: $e');
        }
      }

      // Load pickup photos
      if (booking.pickupPhotos != null && booking.pickupPhotos!.isNotEmpty) {
        for (int i = 0; i < booking.pickupPhotos!.length; i++) {
          final photoId = booking.pickupPhotos![i];
          try {
            final photoFile = await _mediaApiService.getFileById(photoId);
            urls['pickup_$i'] = photoFile.url;
            print('✅ Pickup photo $i URL loaded: ${photoFile.url}');
          } catch (e) {
            print('❌ Failed to load pickup photo $i: $e');
          }
        }
      }

      // Load return photos
      if (booking.returnPhotos != null && booking.returnPhotos!.isNotEmpty) {
        for (int i = 0; i < booking.returnPhotos!.length; i++) {
          final photoId = booking.returnPhotos![i];
          try {
            final photoFile = await _mediaApiService.getFileById(photoId);
            urls['return_$i'] = photoFile.url;
            print('✅ Return photo $i URL loaded: ${photoFile.url}');
          } catch (e) {
            print('❌ Failed to load return photo $i: $e');
          }
        }
      }

      setState(() {
        _mediaUrls = urls;
        _isLoadingMedia = false;
      });

      print('📦 Total media URLs loaded: ${urls.length}');
    } catch (e) {
      print('❌ Error loading media URLs: $e');
      setState(() {
        _isLoadingMedia = false;
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
    final isCompleted = booking.status == 'completed';
    final isReturnSubmitted = booking.status == 'return_submitted';

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

            if (isCancelled) ...[_buildCancellationReasonCard(booking), const SizedBox(height: 16)],

            _buildVehicleCard(booking),
            const SizedBox(height: 16),
            _buildTimelineCard(booking),
            const SizedBox(height: 16),
            _buildLocationCard(booking),
            const SizedBox(height: 16),
            _buildBillingCard(booking),
            const SizedBox(height: 16),

            if (!isCancelled) ...[
              _buildPaymentStepsCardWithMedia(booking),
              const SizedBox(height: 16),
              _buildActionButtons(booking),
            ],

            if ((isReturnSubmitted || isCompleted) && !isCancelled && booking.actions.canReview) ...[
              const SizedBox(height: 16),
              _buildRateReviewSection(booking),
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

  Widget _buildCancellationReasonCard(BookingDetailsResponse booking) {
    String? reason;
    String title;
    Color color;
    IconData icon;
    String? refundInfo;

    if (booking.status == 'cancelled' || booking.status == 'rejected') {
      reason = booking.cancellationReason ?? booking.rejectionReason;

      if (booking.cancellationReason != null) {
        title = 'Cancellation Reason';
        color = Colors.orange;
        icon = Icons.cancel;
      } else if (booking.rejectionReason != null) {
        title = 'Rejection Reason (Owner)';
        color = Colors.red;
        icon = Icons.block;
      } else {
        title = booking.status == 'cancelled' ? 'Cancellation Reason' : 'Rejection Reason';
        color = booking.status == 'cancelled' ? Colors.orange : Colors.red;
        icon = booking.status == 'cancelled' ? Icons.cancel : Icons.block;
        reason = 'No reason provided';
      }

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
              decoration: BoxDecoration(color: AppStyles.background(context), borderRadius: BorderRadius.circular(8)),
              child: Text(reason ?? 'No reason provided', style: AppStyles.body(context)),
            ),
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

  Widget _buildPaymentStepsCardWithMedia(BookingDetailsResponse booking) {
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

            _buildPaymentStep(
              step: 1,
              title: 'Deposit Payment',
              description: '30% of total amount',
              isCompleted: booking.billing.depositPaid,
              isCurrent: booking.actions.needsDepositPayment,
            ),

            _buildPaymentStep(
              step: 2,
              title: 'Owner Approval',
              description: 'Waiting for owner confirmation',
              isCompleted: booking.status != 'pending' && booking.status != 'pending_payment',
              isCurrent: booking.actions.needsOwnerApproval,
            ),

            _buildPaymentStepWithMedia(
              step: 3,
              title: 'Sign Contract',
              description: 'Sign rental agreement',
              isCompleted: booking.contract != null,
              isCurrent: booking.actions.canSignContract,
              mediaWidget: booking.contract != null ? _buildContractMedia() : null,
            ),

            _buildPaymentStep(
              step: 4,
              title: 'Final Payment',
              description: 'Remaining 70% payment',
              isCompleted: booking.billing.finalPaymentPaid,
              isCurrent: booking.actions.needsFinalPayment,
            ),

            _buildPaymentStepWithMedia(
              step: 5,
              title: 'Pickup Photos',
              description: 'Submit vehicle condition',
              isCompleted: booking.pickupPhotos != null && booking.pickupPhotos!.isNotEmpty,
              isCurrent: booking.actions.canSubmitPickupPhotos,
              mediaWidget: booking.pickupPhotos != null && booking.pickupPhotos!.isNotEmpty
                  ? _buildPhotoGallery(booking.pickupPhotos!, 'pickup')
                  : null,
            ),

            _buildPaymentStepWithMedia(
              step: 6,
              title: 'Return Photos',
              description: 'Submit return condition',
              isCompleted: booking.returnPhotos != null && booking.returnPhotos!.isNotEmpty,
              isCurrent: booking.actions.canSubmitReturnPhotos,
              mediaWidget: booking.returnPhotos != null && booking.returnPhotos!.isNotEmpty
                  ? _buildPhotoGallery(booking.returnPhotos!, 'return')
                  : null,
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
    return _buildPaymentStepWithMedia(
      step: step,
      title: title,
      description: description,
      isCompleted: isCompleted,
      isCurrent: isCurrent,
      isLast: isLast,
      mediaWidget: null,
    );
  }

  Widget _buildPaymentStepWithMedia({
    required int step,
    required String title,
    required String description,
    required bool isCompleted,
    required bool isCurrent,
    Widget? mediaWidget,
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
        if (isCompleted && mediaWidget != null) ...[
          Padding(padding: const EdgeInsets.only(left: 56, top: 12, bottom: 8), child: mediaWidget),
        ],
        if (!isLast)
          Padding(
            padding: const EdgeInsets.only(left: 19, top: 4, bottom: 4),
            child: Container(
              width: 2,
              height: mediaWidget != null && isCompleted ? 16 : 24,
              color: isCompleted ? Colors.green : Colors.grey.shade300,
            ),
          ),
      ],
    );
  }

  Widget _buildContractMedia() {
    final contractUrl = _mediaUrls['contract'];

    if (_isLoadingMedia) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(8)),
        child: Row(
          children: [
            const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)),
            const SizedBox(width: 12),
            Text('Loading contract...', style: AppStyles.caption(context)),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.green.withOpacity(0.05),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.green.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          const Icon(Icons.description, color: Colors.green, size: 32),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Contract Signed ✓',
                  style: AppStyles.body(context).copyWith(fontWeight: FontWeight.w600, color: Colors.green.shade700),
                ),
                const SizedBox(height: 4),
                Text(_formatDateTime(_bookingDetails!.contract!.signedAt), style: AppStyles.caption(context)),
              ],
            ),
          ),
          if (contractUrl != null)
            IconButton(
              icon: Icon(Icons.visibility, color: AppStyles.primary),
              onPressed: () => _showContractDialog(contractUrl),
            ),
        ],
      ),
    );
  }

  Widget _buildPhotoGallery(List<String> photoIds, String type) {
    if (_isLoadingMedia) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(8)),
        child: Row(
          children: [
            const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)),
            const SizedBox(width: 12),
            Text('Loading photos...', style: AppStyles.caption(context)),
          ],
        ),
      );
    }

    List<String> availableUrls = [];
    for (int i = 0; i < photoIds.length; i++) {
      final url = _mediaUrls['${type}_$i'];
      if (url != null) availableUrls.add(url);
    }

    if (availableUrls.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.green.withOpacity(0.05),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.green.withOpacity(0.3)),
        ),
        child: Row(
          children: [
            const Icon(Icons.check_circle, color: Colors.green, size: 20),
            const SizedBox(width: 8),
            Text(
              '${photoIds.length} photo(s) submitted',
              style: AppStyles.caption(context).copyWith(color: Colors.green.shade700),
            ),
          ],
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.check_circle, color: Colors.green, size: 16),
            const SizedBox(width: 6),
            Text(
              '${availableUrls.length} photo(s) submitted',
              style: AppStyles.caption(context).copyWith(fontWeight: FontWeight.w600, color: Colors.green.shade700),
            ),
          ],
        ),
        const SizedBox(height: 8),
        SizedBox(
          height: 80,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: availableUrls.length,
            itemBuilder: (context, index) => Padding(
              padding: const EdgeInsets.only(right: 8),
              child: GestureDetector(
                onTap: () => _showPhotoDialog(availableUrls, index),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image.network(
                    availableUrls[index],
                    width: 80,
                    height: 80,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(
                      width: 80,
                      height: 80,
                      color: Colors.grey.shade300,
                      child: const Icon(Icons.broken_image, color: Colors.grey),
                    ),
                    loadingBuilder: (context, child, loadingProgress) {
                      if (loadingProgress == null) return child;
                      return Container(
                        width: 80,
                        height: 80,
                        color: Colors.grey.shade200,
                        child: Center(
                          child: CircularProgressIndicator(
                            value: loadingProgress.expectedTotalBytes != null
                                ? loadingProgress.cumulativeBytesLoaded / loadingProgress.expectedTotalBytes!
                                : null,
                            strokeWidth: 2,
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  void _showPhotoDialog(List<String> urls, int initialIndex) {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: Colors.black,
        insetPadding: EdgeInsets.zero,
        child: Stack(
          children: [
            PageView.builder(
              itemCount: urls.length,
              controller: PageController(initialPage: initialIndex),
              itemBuilder: (context, index) => InteractiveViewer(
                minScale: 0.5,
                maxScale: 4.0,
                child: Center(
                  child: Image.network(
                    urls[index],
                    fit: BoxFit.contain,
                    errorBuilder: (_, __, ___) => const Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.error_outline, color: Colors.white, size: 48),
                          SizedBox(height: 16),
                          Text('Failed to load image', style: TextStyle(color: Colors.white)),
                        ],
                      ),
                    ),
                    loadingBuilder: (context, child, loadingProgress) {
                      if (loadingProgress == null) return child;
                      return Center(
                        child: CircularProgressIndicator(
                          value: loadingProgress.expectedTotalBytes != null
                              ? loadingProgress.cumulativeBytesLoaded / loadingProgress.expectedTotalBytes!
                              : null,
                          color: Colors.white,
                        ),
                      );
                    },
                  ),
                ),
              ),
            ),
            Positioned(
              top: 40,
              right: 16,
              child: IconButton(
                icon: const Icon(Icons.close, color: Colors.white, size: 32),
                onPressed: () => Navigator.pop(context),
              ),
            ),
            Positioned(
              top: 40,
              left: 16,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(color: Colors.black54, borderRadius: BorderRadius.circular(20)),
                child: Text(
                  '${initialIndex + 1}/${urls.length}',
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showContractDialog(String contractUrl) {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: Colors.white,
        insetPadding: const EdgeInsets.all(16),
        child: Column(
          children: [
            AppBar(
              title: const Text('Contract Document'),
              backgroundColor: AppStyles.primary,
              leading: IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
            ),
            Expanded(
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.picture_as_pdf, size: 64, color: Colors.red),
                    const SizedBox(height: 16),
                    Text('Contract PDF', style: AppStyles.h3(context)),
                    const SizedBox(height: 8),
                    Text('PDF viewer coming soon', style: AppStyles.caption(context)),
                    const SizedBox(height: 24),
                    ElevatedButton.icon(
                      style: AppStyles.primaryButtonStyle(context),
                      onPressed: () {
                        ScaffoldMessenger.of(
                          context,
                        ).showSnackBar(SnackBar(content: Text('Contract URL: $contractUrl')));
                      },
                      icon: const Icon(Icons.open_in_browser, color: Colors.white),
                      label: Text('Open in Browser', style: AppStyles.button),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRateReviewSection(BookingDetailsResponse booking) {
    return Card(
      color: AppStyles.surface(context),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: AppStyles.primary.withOpacity(0.3)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.star, color: Colors.amber, size: 24),
                const SizedBox(width: 12),
                Text('Share Your Experience', style: AppStyles.h3(context).copyWith(color: AppStyles.primary)),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              'Help others by sharing your rental experience. You can rate the vehicle and owner!',
              style: AppStyles.caption(context),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                style: AppStyles.primaryButtonStyle(context),
                onPressed: () => _handleRateReview(booking),
                icon: const Icon(Icons.rate_review, color: Colors.white),
                label: Text('Rate & Review', style: AppStyles.button),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionButtons(BookingDetailsResponse booking) {
    return Column(
      children: [
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

  Future<void> _handleDepositPayment(BookingDetailsResponse booking) async {
    final result = await Navigator.push<Map<String, dynamic>>(
      context,
      MaterialPageRoute(
        builder: (context) =>
            StripePaymentScreen(bookingId: booking.id, paymentType: 'deposit', amount: booking.billing.deposit),
      ),
    );
    if (result != null && result['success'] == true) _loadBookingDetails();
  }

  Future<void> _handleSignContract(BookingDetailsResponse booking) async {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => Center(
        child: Card(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const CircularProgressIndicator(),
                const SizedBox(height: 16),
                Text('Preparing contract...', style: AppStyles.body(context)),
              ],
            ),
          ),
        ),
      ),
    );

    try {
      try {
        await _bookingApiService.getContract(booking.id);
      } catch (e) {
        await _bookingApiService.generateContract(booking.id);
      }

      if (mounted) {
        Navigator.pop(context);
        final result = await Navigator.push<bool>(
          context,
          MaterialPageRoute(builder: (context) => ContractSigningScreen(bookingId: booking.id)),
        );
        if (result == true) _loadBookingDetails();
      }
    } catch (e) {
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Failed to load contract: $e'), backgroundColor: Colors.red));
      }
    }
  }

  Future<void> _handleFinalPayment(BookingDetailsResponse booking) async {
    final result = await Navigator.push<Map<String, dynamic>>(
      context,
      MaterialPageRoute(
        builder: (context) =>
            StripePaymentScreen(bookingId: booking.id, paymentType: 'final', amount: booking.billing.remainingPayment),
      ),
    );
    if (result != null && result['success'] == true) _loadBookingDetails();
  }

  Future<void> _handleSubmitPickupPhotos(BookingDetailsResponse booking) async {
    Navigator.pushNamed(
      context,
      AppRoutes.photoSubmission,
      arguments: {'bookingId': booking.id, 'isStartJourney': true},
    ).then((_) => _loadBookingDetails());
  }

  Future<void> _handleSubmitReturnPhotos(BookingDetailsResponse booking) async {
    Navigator.pushNamed(
      context,
      AppRoutes.photoSubmission,
      arguments: {'bookingId': booking.id, 'isStartJourney': false},
    ).then((_) => _loadBookingDetails());
  }

  Future<void> _handleRateReview(BookingDetailsResponse booking) async {
    final result = await Navigator.pushNamed(
      context,
      AppRoutes.rateReview,
      arguments: {
        'bookingId': booking.id,
        'vehicleId': booking.vehicle.id,
        'vehicleName': booking.vehicle.name,
        'ownerId': booking.vehicle.ownerId,
      },
    );
    if (result == true) _loadBookingDetails();
  }

  Future<void> _handleCancelBooking(BookingDetailsResponse booking) async {
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
    return '${dateTime.day}/${dateTime.month}/${dateTime.year} '
        '${dateTime.hour}:${dateTime.minute.toString().padLeft(2, '0')}';
  }

  String _formatPrice(int price) {
    return price.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},');
  }
}
