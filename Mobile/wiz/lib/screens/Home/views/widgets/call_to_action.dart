import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';

class CallToAction extends StatelessWidget {
  const CallToAction({super.key});

  @override
  Widget build(BuildContext context) {
    // REGISTER CTA
 
      return Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: AppStyles.surface(context),
          borderRadius: BorderRadius.circular(16),
          image: const DecorationImage(image: AssetImage('assets/images/article.png'), fit: BoxFit.cover, opacity: 0.3),
        ),
        child: Column(
          children: [
            Text(
              'Do you want to become one of the\npartners of Wiz?',
              textAlign: TextAlign.center,
              style: AppStyles.body(context),
            ),
            const SizedBox(height: 8),
            Text(
              'Many car owners join with Wiz to increase\ntheir monthly income. You can be a part of us.',
              textAlign: TextAlign.center,
              style: AppStyles.caption(context),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              style: AppStyles.primaryButtonStyle(
                context,
              ).copyWith(padding: MaterialStateProperty.all(const EdgeInsets.symmetric(horizontal: 32, vertical: 14))),
              onPressed: () {},
              child: Text('Register Now', style: AppStyles.button),
            ),
          ],
        ),
      );
    }
  
}
