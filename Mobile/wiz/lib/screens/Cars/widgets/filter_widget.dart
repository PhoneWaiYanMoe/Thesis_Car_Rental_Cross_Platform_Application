// widgets/filter_widgets.dart
import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';

typedef FilterCallback<T> = void Function(T value);

class PriceRangeFilter extends StatelessWidget {
  final RangeValues values;
  final FilterCallback<RangeValues> onChanged;

  const PriceRangeFilter({super.key, required this.values, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Price Range', style: AppStyles.h3(context)),
        RangeSlider(
          values: values,
          min: 0,
          max: 3000000,
          divisions: 30,
          activeColor: AppStyles.primary,
          inactiveColor: AppStyles.primary.withOpacity(0.3),
          labels: RangeLabels(
            '${(values.start / 1000).toStringAsFixed(0)}k',
            '${(values.end / 1000).toStringAsFixed(0)}k',
          ),
          onChanged: onChanged,
        ),
      ],
    );
  }
}

class ChipFilter<T> extends StatelessWidget {
  final String title;
  final List<T> items;
  final T? selected;
  final FilterCallback<T?> onSelected;
  final String Function(T) labelBuilder;

  const ChipFilter({
    super.key,
    required this.title,
    required this.items,
    required this.selected,
    required this.onSelected,
    required this.labelBuilder,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: AppStyles.h3(context)),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          children: items.map((item) {
            final isSelected = selected == item;
            return FilterChip(
              label: Text(labelBuilder(item)),
              selected: isSelected,
              selectedColor: AppStyles.primary,
              checkmarkColor: Colors.white,
              onSelected: (_) => onSelected(isSelected ? null : item),
            );
          }).toList(),
        ),
      ],
    );
  }
}

class SwitchFilter extends StatelessWidget {
  final String title;
  final bool value;
  final FilterCallback<bool> onChanged;

  const SwitchFilter({super.key, required this.title, required this.value, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(title, style: AppStyles.h3(context)),
        Switch(value: value, activeColor: AppStyles.primary, onChanged: onChanged),
      ],
    );
  }
}
