import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';
import '_summaryRow.dart';

class BuildTripSummary extends StatelessWidget {
  final Map<String, dynamic> tripData;

  const BuildTripSummary({super.key, required this.tripData});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: AppStyles.surface(context), borderRadius: BorderRadius.circular(12)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Trip Summary', style: AppStyles.h3(context)),
          const SizedBox(height: 8),
          SummaryRow(icon : Icons.location_on, text : tripData['location'] ?? '${tripData['pickup']} → ${tripData['destination']}'),
          SummaryRow(icon : Icons.calendar_today, text : tripData['datetime']),
        ],
      ),
    );
    
    
  }
  
}
