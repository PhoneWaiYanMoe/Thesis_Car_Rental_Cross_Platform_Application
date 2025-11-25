import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';

class LimitsAndFees extends StatelessWidget {
  final Map<String, String> limitsAndFees;

  const LimitsAndFees({super.key, required this.limitsAndFees});

  @override
  Widget build(BuildContext context) {
    // Convert map to list of formatted strings
    final items = limitsAndFees.entries.map((entry) {
      if (entry.key == 'Note') {
        return '⚠️ ${entry.value}';
      }
      return '${entry.key}: ${entry.value}';
    }).toList();

    return Card(
      color: AppStyles.surface(context),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Additional Fees and Limits', style: AppStyles.h3(context)),
            const SizedBox(height: 8),
            ...items.map(
              (item) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 2),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (!item.startsWith('⚠️')) const Text('• ', style: TextStyle(fontSize: 16)),
                    Expanded(child: Text(item, style: AppStyles.body(context))),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
