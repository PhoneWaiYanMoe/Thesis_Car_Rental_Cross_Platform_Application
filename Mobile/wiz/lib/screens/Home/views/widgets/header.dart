import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';

class Header extends StatelessWidget {
  final String userName;
  final String userAvatar;

  const Header({super.key, this.userName = 'Guest', this.userAvatar = 'assets/images/article_2.png'});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        CircleAvatar(
          radius: 24,
          backgroundImage: AssetImage(userAvatar),
          onBackgroundImageError: (_, __) {},
          child: userAvatar.isEmpty ? const Icon(Icons.person, size: 24) : null,
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Welcome!', style: AppStyles.caption(context)),
              Text(userName, style: AppStyles.h3(context)),
            ],
          ),
        ),
        IconButton(
          icon: Icon(Icons.favorite_border, color: AppStyles.textPrimary(context)),
          onPressed: () {},
        ),
      ],
    );
  }
}
