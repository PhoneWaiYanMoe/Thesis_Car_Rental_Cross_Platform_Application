import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/screens/Booking/models/booking_data.dart';
import 'package:wiz/utils/app_routes.dart';
import 'package:wiz/screens/Booking/views/widgets/_buildRenterInfo.dart';
import 'package:wiz/screens/Booking/views/widgets/_buildBillingDetails.dart';
import 'package:wiz/screens/Cars/views/widgets/_buildCarOwnerInfo.dart';

class RentalDetailsScreen extends StatefulWidget {
  final BookingData booking;

  const RentalDetailsScreen({super.key, required this.booking});

  @override
  State<RentalDetailsScreen> createState() => _RentalDetailsScreenState();
}

class _RentalDetailsScreenState extends State<RentalDetailsScreen> {
  late BookingData booking;

  @override
  void initState() {
    super.initState();
    booking = widget.booking;
  }

  // Check if today is the booking start date
  bool _isBookingDay() {
    final now = DateTime.now();
    final startDate = booking.startDate;
    return now.year == startDate.year && 
           now.month == startDate.month && 
           now.day == startDate.day;
  }

  // Check if today is the booking end date
  bool _isFinalDay() {
    final now = DateTime.now();
    final endDate = booking.endDate;
    return now.year == endDate.year && 
           now.month == endDate.month && 
           now.day == endDate.day;
  }

  // Check if booking day has passed (not including today)
  bool _isAfterBookingDay() {
    final now = DateTime.now();
    final startDate = DateTime(booking.startDate.year, booking.startDate.month, booking.startDate.day);
    final today = DateTime(now.year, now.month, now.day);
    return today.isAfter(startDate);
  }

  // Check if final day has passed (not including today)
  bool _isAfterFinalDay() {
    final now = DateTime.now();
    final endDate = DateTime(booking.endDate.year, booking.endDate.month, booking.endDate.day);
    final today = DateTime(now.year, now.month, now.day);
    return today.isAfter(endDate);
  }

  String _getButtonText(BookingStatus status, bool? rated, bool? startPhotosSubmitted, bool? endPhotosSubmitted) {
    // If cancelled or completed and rated, no button
    if (status == BookingStatus.cancelled || (status == BookingStatus.completed && rated == true)) {
      return '';
    }

    // If completed but not rated, show rate button
    if (status == BookingStatus.completed && rated == false) {
      return 'Rate & Review';
    }

    // If on journey and end photos not submitted, check if it's final day
    if (status == BookingStatus.onJourney) {
      if (endPhotosSubmitted == true) {
        // End photos submitted, should be able to rate
        return rated == false ? 'Rate & Review' : '';
      } else if (_isFinalDay() || _isAfterFinalDay()) {
        // On final day or after, need to submit end photos
        return 'Submit Photos';
      } else {
        // Still on journey, waiting for final day
        return '';
      }
    }

    // For pending or confirmed status
    if (status == BookingStatus.pending || status == BookingStatus.confirmed) {
      // If it's booking day or after, can't cancel - must submit photos
      if (_isBookingDay() || _isAfterBookingDay()) {
        if (startPhotosSubmitted == true) {
          // Start photos submitted, waiting for final day
          return '';
        } else {
          // Need to submit start photos
          return 'Submit Photos';
        }
      } else {
        // Before booking day, can cancel
        return 'Cancel Booking';
      }
    }

    return '';
  }

  Color _getButtonColor(BookingStatus status, String buttonText) {
    if (buttonText == 'Cancel Booking') {
      return Colors.red;
    }
    return AppStyles.primary;
  }

  @override
  Widget build(BuildContext context) {
    final buttonText = _getButtonText(
      booking.status ?? BookingStatus.pending, 
      booking.rated,
      booking.startPhotosSubmitted,
      booking.endPhotosSubmitted,
    );
    final showButton = buttonText.isNotEmpty;

    return Scaffold(
      backgroundColor: AppStyles.background(context),
      appBar: AppBar(
        leading: IconButton(icon: const Icon(Icons.arrow_back), onPressed: () => Navigator.pop(context)),
        title: Text('Rental History', style: AppStyles.h2(context)),
        centerTitle: true,
        actions: [
          TextButton(
            onPressed: () {},
            child: const Text('View Car', style: TextStyle(color: AppStyles.primary)),
          ),
        ],
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
                  Text(booking.carName, style: AppStyles.h1(context)),
                  const SizedBox(height: 4),
                  Text('Rumbled Services Rent a Car', style: AppStyles.caption(context)),
                  const SizedBox(height: 24),

                  RenterInfo(
                    userName: booking.renterName ?? 'John Doe',
                    licenseNumber: booking.licenseNumber ?? '****00',
                  ),
                  const SizedBox(height: 16),

                  _buildTimeDetails(context),
                  const SizedBox(height: 16),

                  BillingDetailsCard(
                    rentalPrice: booking.rentalPrice ?? booking.calculatedRentalPrice,
                    insuranceFee: booking.insuranceFee ?? booking.calculatedInsuranceFee,
                    days: booking.days,
                    deposit: booking.depositPayment ?? booking.depositAmount,
                    remaining: booking.remainingPayment ?? booking.remainingAmount,
                    total: booking.totalPrice,
                  ),
                  const SizedBox(height: 16),

                  OwnerInfoCard(
                    ownerName: booking.ownerName ?? booking.car.owner,
                    ownerAvatarAsset: booking.car.ownerAvatar,
                    joinedDate: booking.car.ownerJoinedDate,
                    onViewCarsPressed: () {},
                  ),
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
                    backgroundColor: _getButtonColor(booking.status ?? BookingStatus.pending, buttonText),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  onPressed: () => _handleButtonPress(context, buttonText),
                  child: Text(buttonText, style: AppStyles.button),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildTimeDetails(BuildContext context) {
    return Card(
      color: AppStyles.surface(context),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildRow(context, 'From:', booking.startTime ?? '8:50 A.M, 12/Oct/2025'),
            const SizedBox(height: 8),
            _buildRow(context, 'To:', booking.endTime ?? '8:50 A.M, 14/Oct/2025'),
            const SizedBox(height: 8),
            _buildRow(context, 'Duration:', booking.duration ?? '2 Days'),
          ],
        ),
      ),
    );
  }

  Widget _buildRow(BuildContext context, String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: AppStyles.caption(context)),
        Text(value, style: AppStyles.body(context).copyWith(fontWeight: FontWeight.w600)),
      ],
    );
  }

  void _handleButtonPress(BuildContext context, String buttonText) async {
    if (buttonText == 'Cancel Booking') {
      _showCancelDialog(context);
    } else if (buttonText == 'Submit Photos') {
      // Determine if this is start or end journey photos
      final isStartJourney = booking.startPhotosSubmitted != true;
      final result = await AppRoutes.navigateToPhotoSubmission(
        context,
        booking,
        isStartJourney,
      );
      if (result != null) {
        setState(() {
          booking = result;
        });
      }
    } else if (buttonText == 'Rate & Review') {
      final result = await AppRoutes.navigateToRateReview(context, booking);
      if (result != null) {
        setState(() {
          booking = result;
        });
      }
    }
  }

  void _showCancelDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppStyles.surface(context),
        title: Text('Cancel Booking', style: AppStyles.h2(context)),
        content: Text('Are you sure you want to cancel this booking?', style: AppStyles.body(context)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('No')),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              Navigator.pop(context);
            },
            child: const Text('Yes', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }
}
