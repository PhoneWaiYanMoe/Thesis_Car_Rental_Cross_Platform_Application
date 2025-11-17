import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';

class Header extends StatelessWidget {
  const Header({super.key});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        CircleAvatar(radius: 24, backgroundImage: const AssetImage('assets/images/article_2.png')),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Welcome!', style: AppStyles.caption(context)),
              Text('Jass Myatt', style: AppStyles.h3(context)),
            ],
          ),
        ),
        IconButton(
          icon: Icon(Icons.favorite_border, color: AppStyles.textPrimary(context)),
          onPressed: () {},
        ),
      ],
    );;
  }
}