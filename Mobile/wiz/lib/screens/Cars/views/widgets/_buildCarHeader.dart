import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';

class CarHeader extends StatelessWidget {
  final String name;
  final String transmission;
  final String brand;
  final int year;
  final String mileage;
  final String color;
  final double rating;
  final int reviewCount;

  const CarHeader({
    Key? key,
    required this.name,
    this.transmission = 'Automatic',
    required this.brand,
    required this.year,
    required this.mileage,
    required this.color,
    this.rating = 4.5,
    this.reviewCount = 128,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Deliver to your location', style: AppStyles.caption(context)),
              const SizedBox(height: 4),
              Text(name, style: AppStyles.h2(context)),
              Text(transmission, style: AppStyles.body(context)),
              const SizedBox(height: 12),
              _CarSpecRow(icon: Icons.time_to_leave, label: 'Brand', value: brand),
              _CarSpecRow(icon: Icons.calendar_today, label: 'Manufacture Year', value: '$year'),
              _CarSpecRow(icon: Icons.speed, label: 'Mileage Driven', value: mileage),
              _CarSpecRow(icon: Icons.color_lens, label: 'Color', value: color),
            ],
          ),
        ),

        Column(
          children: [
            _RatingBadge(rating: rating, reviewCount: reviewCount),
            const SizedBox(height: 12),
            _BrandBadge(brand: brand),
          ],
        ),
      ],
    );
  }
}

class _CarSpecRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _CarSpecRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        children: [
          Icon(icon, size: 16, color: Colors.grey.shade600),
          const SizedBox(width: 8),
          Text('$label: ', style: AppStyles.caption(context).copyWith(color: Colors.grey.shade600)),
          Text(value, style: AppStyles.body(context).copyWith(fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }
}

// Rating badge
class _RatingBadge extends StatelessWidget {
  final double rating;
  final int reviewCount;

  const _RatingBadge({required this.rating, this.reviewCount = 0});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.amber.shade50,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.amber.shade300),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.star, color: Colors.amber, size: 18),
          const SizedBox(width: 4),
          Text(
            '${rating.toStringAsFixed(1)}',
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
          ),
          if (reviewCount > 0) ...[
            const SizedBox(width: 4),
            Text('($reviewCount)', style: AppStyles.caption(context)),
          ],
        ],
      ),
    );
  }
}

// Brand badge (optional styling)
class _BrandBadge extends StatelessWidget {
  final String brand;

  const _BrandBadge({required this.brand});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: AppStyles.primary.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Text(
        brand.toUpperCase(),
        style: AppStyles.caption(context).copyWith(
          fontWeight: FontWeight.bold,
          color: AppStyles.primary,
          letterSpacing: 1.2,
        ),
      ),
    );
  }
}