import 'package:flutter/material.dart';
import 'package:wiz/screens/Cars/views/widgets/_sectionCard.dart';

class RulesByOwner extends StatelessWidget {
  final List<String> rules;

  const RulesByOwner({super.key, required this.rules});

  @override
  Widget build(BuildContext context) {
    return SectionCard(title: 'Rules By Owner', items: rules);
  }
}
