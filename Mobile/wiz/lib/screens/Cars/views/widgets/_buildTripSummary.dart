import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/screens/Booking/models/booking_data.dart';
import '_summaryRow.dart';

class BuildTripSummary extends StatelessWidget {
  final BookingData bookingData;

  const BuildTripSummary({super.key, required this.bookingData});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Container(
        margin: const EdgeInsets.all(16),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: AppStyles.surface(context), borderRadius: BorderRadius.circular(12)),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Trip Summary', style: AppStyles.h3(context)),
            const SizedBox(height: 8),
            SummaryRow(icon: Icons.location_on, text: bookingData.displayLocation),
            SummaryRow(icon: Icons.calendar_today, text: bookingData.datetime),
            SummaryRow(icon: Icons.access_time, text: '${bookingData.days} days'),
          ],
        ),
      ),
    );
  }
}
