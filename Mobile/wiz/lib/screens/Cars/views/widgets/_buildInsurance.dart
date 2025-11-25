import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/constants/booking_constants.dart';

class InsuranceSelector extends StatefulWidget {
  final InsuranceOption initialOption;
  final ValueChanged<InsuranceOption>? onChanged;

  const InsuranceSelector({Key? key, this.initialOption = InsuranceOption.none, this.onChanged}) : super(key: key);

  @override
  State<InsuranceSelector> createState() => _InsuranceSelectorState();
}

class _InsuranceSelectorState extends State<InsuranceSelector> {
  late InsuranceOption _selected;

  @override
  void initState() {
    super.initState();
    _selected = widget.initialOption;
  }

  @override
  Widget build(BuildContext context) {
    final options = [
      _Option('30%', InsuranceOption.p30),
      _Option('50%', InsuranceOption.p50),
      _Option('70%', InsuranceOption.p70),
      _Option('100%', InsuranceOption.p100),
      _Option('None', InsuranceOption.none),
    ];

    return Card(
      color: AppStyles.surface(context),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      elevation: 0,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Choose Insurance Type', style: AppStyles.h3(context)),
            const SizedBox(height: 12),

            // Horizontal scrollable chips
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: options.map((opt) {
                  final isSelected = _selected == opt.value;
                  return Padding(
                    padding: const EdgeInsets.only(right: 10),
                    child: FilterChip(
                      label: Text(opt.label),
                      selected: isSelected,
                      onSelected: (_) {
                        setState(() => _selected = opt.value);
                        widget.onChanged?.call(opt.value);
                      },
                      selectedColor: AppStyles.primary,
                      checkmarkColor: Colors.white,
                      backgroundColor: AppStyles.surface(context),
                      side: BorderSide(color: isSelected ? AppStyles.primary : Colors.grey.shade300, width: 1.5),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                      labelStyle: TextStyle(
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                        color: isSelected ? Colors.white : AppStyles.textPrimary(context),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),

            const SizedBox(height: 20),

            // Policy explanation
            Text('Insurance Policy', style: AppStyles.h3(context)),
            const SizedBox(height: 10),

            Text(
              'You may choose to pay 30%, 50%, 70%, or 100% of the rental cost as an insurance fee. In return, the insurance will cover the same percentage of any repair cost that may occur.\n\n'
              '• Insurance is optional and covers only accidental damage.\n'
              '• You must report any accident immediately with clear photos or video.\n'
              '• Violations of traffic laws or intentional damage are not covered.\n'
              '• If you select "None", you will be responsible for all repair costs.',
              style: AppStyles.caption(context).copyWith(height: 1.6, color: AppStyles.textSecondary(context)),
            ),
          ],
        ),
      ),
    );
  }
}

class _Option {
  final String label;
  final InsuranceOption value;
  _Option(this.label, this.value);
}
