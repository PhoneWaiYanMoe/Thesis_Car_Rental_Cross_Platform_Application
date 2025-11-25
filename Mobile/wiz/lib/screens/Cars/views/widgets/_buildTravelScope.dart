import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/constants/booking_constants.dart';

class TravelScopeSelector extends StatelessWidget {
  final TravelScope selectedScope;
  final ValueChanged<TravelScope> onChanged;
  final String? title;

  const TravelScopeSelector({Key? key, required this.selectedScope, required this.onChanged, this.title})
    : super(key: key);

  @override
  Widget build(BuildContext context) {
    final labels = ['Inner City', 'In the province', 'Interprovincial'];
    final values = TravelScope.values;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (title != null) ...[Text(title!, style: AppStyles.h3(context)), const SizedBox(height: 8)],

        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: ToggleButtons(
            direction: Axis.horizontal,
            borderRadius: BorderRadius.circular(12),
            selectedColor: Colors.white,
            fillColor: AppStyles.primary,
            color: AppStyles.textSecondary(context),
            splashColor: AppStyles.primary.withOpacity(0.2),
            highlightColor: AppStyles.primary.withOpacity(0.1),
            constraints: const BoxConstraints(minHeight: 44, minWidth: 100),

            isSelected: values.map((scope) => scope == selectedScope).toList(),

            onPressed: (index) {
              onChanged(values[index]);
            },

            children: labels
                .map(
                  (label) => Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
                  ),
                )
                .toList(),
          ),
        ),
      ],
    );
  }
}
