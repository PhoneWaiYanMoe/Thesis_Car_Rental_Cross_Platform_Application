import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';

class SectionCard extends StatelessWidget {
  String title='';
   List<String> items=[];
   SectionCard({super.key, required this.title, required this.items});

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
            Text(title, style: AppStyles.h3(context)),
            const SizedBox(height: 8),
            ...items.map(
              (item) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 2),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('• ', style: TextStyle(fontSize: 16)),
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
