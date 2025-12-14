import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';

class RenterInfo extends StatelessWidget {
  final String userName;
  final String licenseNumber;

  const RenterInfo({
    super.key,
    required this.userName,
    required this.licenseNumber,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      color: AppStyles.surface(context),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Renter Name:', style: AppStyles.caption(context)),
                Text(
                  userName,
                  style: AppStyles.body(context).copyWith(fontWeight: FontWeight.w600),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('License Number:', style: AppStyles.caption(context)),
                Text(
                  licenseNumber,
                  style: AppStyles.body(context).copyWith(fontWeight: FontWeight.w600),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}