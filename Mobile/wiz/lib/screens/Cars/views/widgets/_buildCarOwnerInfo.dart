import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';

class OwnerInfoCard extends StatelessWidget {
  final String ownerName;
  final String ownerAvatarAsset;
  final DateTime joinedDate;
  final VoidCallback? onViewCarsPressed;

  const OwnerInfoCard({
    Key? key,
    required this.ownerName,
    required this.ownerAvatarAsset,
    required this.joinedDate,
    this.onViewCarsPressed,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      color: AppStyles.surface(context),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      elevation: 0,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            // Owner Avatar
            CircleAvatar(
              radius: 28,
              backgroundImage: AssetImage(ownerAvatarAsset),
              onBackgroundImageError: (_, __) => const Icon(Icons.person, size: 32),
            ),
            const SizedBox(width: 14),

            // Owner Name + Join Date
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(ownerName, style: AppStyles.h3(context), maxLines: 1, overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 4),
                  Text(
                    'Joined ${_formatDate(joinedDate)}',
                    style: AppStyles.caption(context).copyWith(color: AppStyles.textSecondary(context)),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),

            // View Cars Button
            ElevatedButton(
              onPressed: onViewCarsPressed,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppStyles.primary,
                foregroundColor: Colors.white,
                elevation: 0,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                textStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
              ),
              child: const Text('View cars'),
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return '${date.day}/${months[date.month - 1]}/${date.year}';
  }
}
