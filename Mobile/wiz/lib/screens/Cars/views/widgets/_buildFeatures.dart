// widgets/car_features_card.dart
import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';

class CarFeaturesCard extends StatelessWidget {
  final String transmission; // e.g., "Automatic"
  final String seats; // e.g., "7-seater"
  final String fuelType; // e.g., "Gasoline", "Diesel", "Electric"
  final List<String> features; // Additional features list

  const CarFeaturesCard({
    Key? key,
    this.transmission = 'Automatic',
    this.seats = '5-seater',
    this.fuelType = 'Gasoline',
    this.features = const [],
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      color: AppStyles.surface(context),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      elevation: 0,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top row: Transmission, Seats, Fuel
            Row(
              children: [
                const Icon(Icons.directions_car, size: 20),
                const SizedBox(width: 8),
                Text('Automatic', style: AppStyles.body(context)),
                const Spacer(),
                const Icon(Icons.event_seat, size: 20),
                const SizedBox(width: 8),
                Text('7-seater', style: AppStyles.body(context)),
                const Spacer(),
                const Icon(Icons.local_gas_station, size: 20),
                const SizedBox(width: 8),
                Text('Gasoline', style: AppStyles.body(context)),
              ],
            ),

            const SizedBox(height: 20),

            // Additional Features Title
            Text('Additional Features', style: AppStyles.h3(context)),
            const SizedBox(height: 12),

            // Feature chips
            if (features.isEmpty)
              Text('No additional features listed', style: AppStyles.caption(context).copyWith(color: Colors.grey))
            else
              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: features
                    .map(
                      (feature) => Chip(
                        label: Text(feature, style: AppStyles.caption(context).copyWith(fontWeight: FontWeight.w500)),
                        backgroundColor: AppStyles.surface(context),
                        side: BorderSide(color: Colors.grey.shade300),
                        padding: const EdgeInsets.symmetric(horizontal: 8),
                        materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                    )
                    .toList(),
              ),
          ],
        ),
      ),
    );
  }
}
