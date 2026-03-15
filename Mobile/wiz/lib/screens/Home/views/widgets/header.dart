import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/main.dart'; // import themeNotifier

class Header extends StatelessWidget {
  final String userName;
  final String userAvatar;

  const Header({super.key, this.userName = 'Guest', this.userAvatar = 'assets/images/article_2.png'});

  void _toggleTheme() {
    themeNotifier.value = themeNotifier.value == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark;
  }

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
        ValueListenableBuilder<ThemeMode>(
          valueListenable: themeNotifier,
          builder: (context, themeMode, _) {
            final isDark = themeMode == ThemeMode.dark;
            return IconButton(
              tooltip: isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode',
              icon: Icon(isDark ? Icons.light_mode : Icons.dark_mode, color: AppStyles.textPrimary(context)),
              onPressed: _toggleTheme,
            );
          },
        ),
      ],
    );
  }
}
