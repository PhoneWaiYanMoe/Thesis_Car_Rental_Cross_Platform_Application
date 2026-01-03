// Mobile/wiz/lib/screens/Booking/views/rental_details_screen.dart
// ✅ FIXED: Timeline map access errors

import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/screens/Booking/services/booking_api_service.dart';
import 'package:wiz/utils/app_routes.dart';

class RentalDetailsScreen extends StatefulWidget {
  final String bookingId;

  const RentalDetailsScreen({super.key, required this.bookingId});

  @override
  State<RentalDetailsScreen> createState() => _RentalDetailsScreenState();
}

class _RentalDetailsScreenState extends State<RentalDetailsScreen> {
  final BookingApiService _bookingApi = BookingApiService();

  BookingDetailsResponse? _booking;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadBookingDetails();
  }

  Future<void> _loadBookingDetails() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final details = await _bookingApi.getBookingDetails(widget.bookingId);

      setState(() {
        _booking = details;
        _isLoading = false;
      });

      print('✅ Loaded booking details for: ${widget.bookingId}');
    } catch (e) {
      print('❌ Error loading booking details: $e');
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Map<String, dynamic> _getButtonAction() {
    if (_booking == null) return {'show': false};

    final actions = _booking!.actions;

    // Priority order for actions
    if (actions.canSignContract) {
      return {'show': true, 'text': 'Sign Contract', 'action': 'sign_contract', 'color': AppStyles.primary};
    }

    if (actions.canSubmitPickupPhotos) {
      return {'show': true, 'text': 'Submit Pickup Photos', 'action': 'submit_pickup', 'color': AppStyles.primary};
    }

    if (actions.canSubmitReturnPhotos) {
      return {'show': true, 'text': 'Submit Return Photos', 'action': 'submit_return', 'color': AppStyles.primary};
    }

    if (actions.canReview) {
      return {'show': true, 'text': 'Rate & Review', 'action': 'rate_review', 'color': Colors.amber};
    }

    if (actions.canCancel) {
      return {'show': true, 'text': 'Cancel Booking', 'action': 'cancel', 'color': Colors.red};
    }

    return {'show': false};
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

    if (_error != null) {
      return Scaffold(
        backgroundColor: AppStyles.background(context),
        appBar: AppBar(title: const Text('Error')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 64, color: Colors.red),
              const SizedBox(height: 16),
              Text('Failed to load booking', style: AppStyles.h3(context)),
              const SizedBox(height: 8),
              Text(_error ?? 'Unknown error', style: AppStyles.caption(context)),
              const SizedBox(height: 24),
              ElevatedButton(
                style: AppStyles.primaryButtonStyle(context),
                onPressed: _loadBookingDetails,
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    if (_booking == null) {
      return Scaffold(
        backgroundColor: AppStyles.background(context),
        appBar: AppBar(title: const Text('Not Found')),
        body: const Center(child: Text('Booking not found')),
      );
    }

    final buttonAction = _getButtonAction();
    final showButton = buttonAction['show'] as bool;

    return Scaffold(
      backgroundColor: AppStyles.background(context),
      appBar: AppBar(
        leading: IconButton(icon: const Icon(Icons.arrow_back), onPressed: () => Navigator.pop(context, true)),
        title: Text('Booking Details', style: AppStyles.h2(context)),
        centerTitle: true,
        backgroundColor: AppStyles.background(context),
        elevation: 0,
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildStatusBadge(_booking!.status),
                  const SizedBox(height: 8),

                  // ✅ Show testing mode indicator
                  if (_booking!.timeline['isTestingMode'] == true)
                    Container(
                      margin: const EdgeInsets.only(top: 8),
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.orange.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.orange),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.science, size: 16, color: Colors.orange),
                          const SizedBox(width: 8),
                          Text(
                            'TESTING MODE: Date checks bypassed',
                            style: TextStyle(color: Colors.orange, fontSize: 12, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ),

                  const SizedBox(height: 16),

                  Text(_booking!.vehicle.name, style: AppStyles.h1(context)),
                  const SizedBox(height: 4),
                  Text('Booking ID: ${_booking!.id.substring(0, 8)}...', style: AppStyles.caption(context)),
                  const SizedBox(height: 24),

                  _buildTimelineCard(),
                  const SizedBox(height: 16),

                  _buildLocationCard(),
                  const SizedBox(height: 16),

                  _buildBillingCard(),
                  const SizedBox(height: 16),

                  if (_booking!.insurance.coverage > 0) ...[_buildInsuranceCard(), const SizedBox(height: 16)],

                  if (_booking!.contract != null) ...[_buildContractCard(), const SizedBox(height: 16)],

                  if (_booking!.pickupPhotos != null && _booking!.pickupPhotos!.isNotEmpty) ...[
                    _buildPhotosSection('Pickup Photos', _booking!.pickupPhotos!),
                    const SizedBox(height: 16),
                  ],

                  if (_booking!.returnPhotos != null && _booking!.returnPhotos!.isNotEmpty) ...[
                    _buildPhotosSection('Return Photos', _booking!.returnPhotos!),
                    const SizedBox(height: 16),
                  ],

                  if (_booking!.additionalNotes != null && _booking!.additionalNotes!.isNotEmpty) ...[
                    Card(
                      color: AppStyles.surface(context),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Additional Notes', style: AppStyles.h3(context)),
                            const SizedBox(height: 8),
                            Text(_booking!.additionalNotes!, style: AppStyles.body(context)),
                          ],
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),

          if (showButton)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppStyles.background(context),
                border: Border(top: BorderSide(color: AppStyles.textSecondary(context).withOpacity(0.2))),
              ),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: buttonAction['color'] as Color,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  onPressed: () => _handleButtonPress(buttonAction['action'] as String),
                  child: Text(buttonAction['text'] as String, style: AppStyles.button),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color color;
    String label;

    switch (status) {
      case 'pending':
        color = Colors.orange;
        label = 'PENDING APPROVAL';
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
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.circle, size: 8, color: color),
          const SizedBox(width: 8),
          Text(
            label,
            style: TextStyle(color: color, fontSize: 13, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }

  void _handleButtonPress(String action) async {
    switch (action) {
      case 'sign_contract':
        await _handleSignContract();
        break;
      case 'submit_pickup':
        await _handleSubmitPickupPhotos();
        break;
      case 'submit_return':
        await _handleSubmitReturnPhotos();
        break;
      case 'rate_review':
        _handleRateReview();
        break;
      case 'cancel':
        _showCancelDialog();
        break;
    }
  }

  Future<void> _handleSignContract() async {
    try {
      await _bookingApi.signContract(
        bookingId: widget.bookingId,
        signature: 'data:image/png;base64,mock_signature_${DateTime.now().millisecondsSinceEpoch}',
        agreedToTerms: true,
      );

      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Contract signed successfully!'), backgroundColor: Colors.green));
        _loadBookingDetails();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Failed to sign contract: $e'), backgroundColor: Colors.red));
      }
    }
  }

  Future<void> _handleSubmitPickupPhotos() async {
    final mockPhotos = List.generate(3, (i) => 'mock_pickup_photo_${DateTime.now().millisecondsSinceEpoch}_$i.jpg');

    try {
      await _bookingApi.confirmPickup(
        bookingId: widget.bookingId,
        pickupPhotos: mockPhotos,
        odometerReading: 10000 + (widget.bookingId.hashCode % 50000),
        notes: 'Car in good condition',
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Pickup confirmed! Have a safe journey!'), backgroundColor: Colors.green),
        );
        _loadBookingDetails();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Failed to confirm pickup: $e'), backgroundColor: Colors.red));
      }
    }
  }

  Future<void> _handleSubmitReturnPhotos() async {
    final mockPhotos = List.generate(3, (i) => 'mock_return_photo_${DateTime.now().millisecondsSinceEpoch}_$i.jpg');

    try {
      await _bookingApi.confirmReturn(
        bookingId: widget.bookingId,
        returnPhotos: mockPhotos,
        odometerReading: 10500 + (widget.bookingId.hashCode % 50000),
        notes: 'Returned in good condition',
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Return submitted! You can now rate your experience.'),
            backgroundColor: Colors.green,
            duration: Duration(seconds: 3),
          ),
        );
        _loadBookingDetails();

        await Future.delayed(const Duration(seconds: 2));
        if (mounted) {
          _handleRateReview();
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Failed to submit return: $e'), backgroundColor: Colors.red));
      }
    }
  }

  void _handleRateReview() {
    Navigator.pushNamed(
      context,
      AppRoutes.rateReview,
      arguments: {
        'bookingId': widget.bookingId,
        'vehicleId': _booking!.vehicle.id,
        'vehicleName': _booking!.vehicle.name,
        'ownerId': _booking!.vehicle.ownerId,
      },
    );
  }

  void _showCancelDialog() {
    final reasonController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppStyles.surface(context),
        title: Text('Cancel Booking', style: AppStyles.h2(context)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Are you sure you want to cancel this booking?', style: AppStyles.body(context)),
            const SizedBox(height: 16),
            TextField(
              controller: reasonController,
              decoration: const InputDecoration(
                hintText: 'Reason for cancellation (optional)',
                border: OutlineInputBorder(),
              ),
              maxLines: 3,
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('No')),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);

              try {
                await _bookingApi.cancelBooking(
                  bookingId: widget.bookingId,
                  reason: reasonController.text.isEmpty ? 'Customer cancelled' : reasonController.text,
                );

                if (mounted) {
                  ScaffoldMessenger.of(
                    context,
                  ).showSnackBar(const SnackBar(content: Text('Booking cancelled'), backgroundColor: Colors.orange));
                  Navigator.pop(context, true);
                }
              } catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(
                    context,
                  ).showSnackBar(SnackBar(content: Text('Failed to cancel: $e'), backgroundColor: Colors.red));
                }
              }
            },
            child: const Text('Yes, Cancel', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  // ✅ FIXED: Access timeline map properties correctly
  Widget _buildTimelineCard() {
    // Parse DateTime from timeline map
    final startDate = DateTime.parse(_booking!.timeline['startDate'] as String);
    final endDate = DateTime.parse(_booking!.timeline['endDate'] as String);
    final duration = _booking!.timeline['duration'] as String;

    return Card(
      color: AppStyles.surface(context),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Timeline', style: AppStyles.h3(context)),
            const SizedBox(height: 12),
            _buildRow('Start Date', _formatDateTime(startDate)),
            const SizedBox(height: 8),
            _buildRow('End Date', _formatDateTime(endDate)),
            const SizedBox(height: 8),
            _buildRow('Duration', duration),
          ],
        ),
      ),
    );
  }

  Widget _buildLocationCard() {
    return Card(
      color: AppStyles.surface(context),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Locations', style: AppStyles.h3(context)),
            const SizedBox(height: 12),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.location_on, size: 20, color: Colors.green),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Pickup', style: AppStyles.caption(context)),
                      Text(_booking!.pickup['address'] ?? 'N/A', style: AppStyles.body(context)),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.location_on, size: 20, color: Colors.red),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Dropoff', style: AppStyles.caption(context)),
                      Text(_booking!.dropoff['address'] ?? 'N/A', style: AppStyles.body(context)),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBillingCard() {
    final billing = _booking!.billing;

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
            _buildBillingRow('Rental (${billing.numberOfDays} days)', '${_formatPrice(billing.rentalPrice)} ₫'),
            const SizedBox(height: 8),
            _buildBillingRow('Insurance', '${_formatPrice(billing.insuranceFee)} ₫'),
            const Divider(height: 24),
            _buildBillingRow('Total', '${_formatPrice(billing.total)} ₫', isTotal: true),
            const SizedBox(height: 16),
            _buildBillingRow('Deposit (30%)', '${_formatPrice(billing.deposit)} ₫'),
            Row(
              children: [
                Icon(
                  billing.depositPaid ? Icons.check_circle : Icons.cancel,
                  size: 16,
                  color: billing.depositPaid ? Colors.green : Colors.red,
                ),
                const SizedBox(width: 4),
                Text(billing.depositPaid ? 'Paid' : 'Unpaid', style: AppStyles.caption(context)),
              ],
            ),
            const SizedBox(height: 12),
            _buildBillingRow('Remaining Payment', '${_formatPrice(billing.remainingPayment)} ₫'),
            Row(
              children: [
                Icon(
                  billing.finalPaymentPaid ? Icons.check_circle : Icons.cancel,
                  size: 16,
                  color: billing.finalPaymentPaid ? Colors.green : Colors.red,
                ),
                const SizedBox(width: 4),
                Text(billing.finalPaymentPaid ? 'Paid' : 'Unpaid', style: AppStyles.caption(context)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInsuranceCard() {
    return Card(
      color: AppStyles.surface(context),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Insurance Coverage', style: AppStyles.h3(context)),
            const SizedBox(height: 8),
            Text('${_booking!.insurance.coverage}% Coverage', style: AppStyles.body(context)),
          ],
        ),
      ),
    );
  }

  Widget _buildContractCard() {
    return Card(
      color: AppStyles.surface(context),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            const Icon(Icons.description, color: Colors.green),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Contract Signed', style: AppStyles.body(context).copyWith(fontWeight: FontWeight.w600)),
                  Text(_formatDateTime(_booking!.contract!.signedAt), style: AppStyles.caption(context)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPhotosSection(String title, List<String> photos) {
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
            SizedBox(
              height: 100,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: photos.length,
                itemBuilder: (context, index) {
                  return Container(
                    margin: const EdgeInsets.only(right: 8),
                    width: 100,
                    decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(8)),
                    child: const Center(child: Icon(Icons.image, size: 40)),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: AppStyles.caption(context)),
        Text(value, style: AppStyles.body(context).copyWith(fontWeight: FontWeight.w600)),
      ],
    );
  }

  Widget _buildBillingRow(String label, String value, {bool isTotal = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: isTotal ? AppStyles.body(context).copyWith(fontWeight: FontWeight.bold) : AppStyles.caption(context),
        ),
        Text(
          value,
          style: isTotal
              ? AppStyles.h3(context).copyWith(color: AppStyles.primary)
              : AppStyles.body(context).copyWith(fontWeight: FontWeight.w600),
        ),
      ],
    );
  }

  String _formatDateTime(DateTime date) {
    return '${date.day}/${date.month}/${date.year} ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
  }

  String _formatPrice(int price) {
    return price.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},');
  }
}
