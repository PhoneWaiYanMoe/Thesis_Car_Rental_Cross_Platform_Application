import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/screens/Cars/models/car.dart';
import 'package:wiz/utils/app_routes.dart';

class BuildCarCard extends StatelessWidget {
  final int carIndex;
  final List<Car> allCars;
  final Map<String, dynamic> tripData;

  const BuildCarCard({super.key, required this.carIndex, required this.allCars, required this.tripData});

  Car get car => allCars[carIndex];

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () {
          // Add carIndex to tripData
          final arguments = Map<String, dynamic>.from(tripData);
          arguments['carIndex'] = carIndex;

          AppRoutes.navigateTo(context, AppRoutes.carDetails, arguments: arguments);
        },
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
              child: Stack(
                children: [
                  Image.asset(car.image, height: 180, width: double.infinity, fit: BoxFit.cover),
                  Positioned(
                    top: 12,
                    right: 12,
                    child: IconButton(
                      icon: const Icon(Icons.favorite_border, color: Colors.white),
                      onPressed: () {},
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      CircleAvatar(radius: 16, backgroundImage: AssetImage(car.ownerAvatar)),
                      const SizedBox(width: 8),
                      Text(car.owner, style: AppStyles.caption(context)),
                      const Spacer(),
                      Row(
                        children: [
                          const Icon(Icons.star, color: Colors.amber, size: 16),
                          const SizedBox(width: 4),
                          Text('${car.rating} (${car.reviews})', style: AppStyles.caption(context)),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(car.name, style: AppStyles.h3(context)),
                  Row(
                    children: [
                      Icon(Icons.location_on, size: 16, color: AppStyles.textSecondary(context)),
                      const SizedBox(width: 4),
                      Text(car.location, style: AppStyles.caption(context)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '${_formatPrice(car.price)}₫/day',
                        style: AppStyles.h3(context).copyWith(color: AppStyles.primary),
                      ),
                      ElevatedButton(
                        style: AppStyles.primaryButtonStyle(
                          context,
                        ).copyWith(padding: WidgetStateProperty.all(const EdgeInsets.symmetric(horizontal: 24))),
                        onPressed: () {
                          final arguments = Map<String, dynamic>.from(tripData);
                          arguments['carIndex'] = carIndex;

                          AppRoutes.navigateTo(context, AppRoutes.carDetails, arguments: arguments);
                        },
                        child: Text('See details', style: AppStyles.button),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatPrice(int price) {
    return price.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},');
  }
}
