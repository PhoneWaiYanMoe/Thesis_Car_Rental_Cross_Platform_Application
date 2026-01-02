// Mobile/wiz/lib/screens/Cars/views/widgets/_buildCarCard.dart
import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/screens/Cars/models/car.dart';
import 'package:wiz/utils/app_routes.dart';

class BuildCarCard extends StatelessWidget {
  final Car car;
  final Map<String, dynamic> tripData;

  const BuildCarCard({super.key, required this.car, required this.tripData});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () {
          final arguments = Map<String, dynamic>.from(tripData);
          arguments['car'] = car;
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
                      // ✅ FIX: Handle owner avatar properly with fallback
                      _buildOwnerAvatar(car.ownerAvatar),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          car.owner,
                          style: AppStyles.caption(context),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 8),
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
                      Expanded(
                        child: Text(
                          car.location,
                          style: AppStyles.caption(context),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
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
                          arguments['car'] = car;
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

  // ✅ NEW: Helper to build owner avatar with proper fallback
  Widget _buildOwnerAvatar(String avatarPath) {
    // Check if it's a network URL or asset path
    if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
      return CircleAvatar(
        radius: 16,
        backgroundColor: Colors.grey[300],
        child: ClipOval(
          child: Image.network(
            avatarPath,
            width: 32,
            height: 32,
            fit: BoxFit.cover,
            errorBuilder: (context, error, stackTrace) {
              // Fallback to default icon if network image fails
              return Icon(Icons.person, size: 20, color: Colors.grey[600]);
            },
            loadingBuilder: (context, child, loadingProgress) {
              if (loadingProgress == null) return child;
              return Center(
                child: SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    value: loadingProgress.expectedTotalBytes != null
                        ? loadingProgress.cumulativeBytesLoaded / loadingProgress.expectedTotalBytes!
                        : null,
                  ),
                ),
              );
            },
          ),
        ),
      );
    } else {
      // Asset image with fallback to default icon
      return CircleAvatar(
        radius: 16,
        backgroundColor: Colors.grey[300],
        child: ClipOval(
          child: Image.asset(
            avatarPath,
            width: 32,
            height: 32,
            fit: BoxFit.cover,
            errorBuilder: (context, error, stackTrace) {
              // Fallback to default icon if asset fails
              return Icon(Icons.person, size: 20, color: Colors.grey[600]);
            },
          ),
        ),
      );
    }
  }

  String _formatPrice(int price) {
    return price.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},');
  }
}
