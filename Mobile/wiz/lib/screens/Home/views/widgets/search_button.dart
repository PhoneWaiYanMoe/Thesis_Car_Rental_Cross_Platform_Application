import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';

class SearchButton extends StatelessWidget {
  final void Function()? onPressed;
  final bool canSearch;
  const SearchButton({super.key, this.onPressed,  required this.canSearch}) ;

  @override
  Widget build(BuildContext context) {
     
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        style: AppStyles.primaryButtonStyle(context).copyWith(
          backgroundColor: MaterialStateProperty.all(
            canSearch ? AppStyles.primary : AppStyles.primary.withOpacity(0.5),
          ),
        ),
        onPressed: onPressed,
        child: Text('Search Car', style: AppStyles.button),
      ),
    );
  }
}