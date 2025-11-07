// lib/core/app_styles.dart
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppStyles {
  // ====================== COLORS ======================
  static const Color primary = Color(0xFF6C5CE7);
  static const Color primaryLight = Color(0xFF9980FA);
  static const Color primaryDark = Color(0xFF5A4BCF);

  // Light Mode
  static final Color lightBackground = Colors.white;
  static final Color lightSurface = Color(0xFFF7F8FA);
  static final Color lightTextPrimary = Color(0xFF2D3436);
  static final Color lightTextSecondary = Color(0xFF636E72);

  // Dark Mode (Your Design)
  static final Color darkBackground = Color(0xFF0F172A);
  static final Color darkSurface = Color(0xFF1E293B);
  static final Color darkTextPrimary = Color(0xFFF8FAFC);
  static final Color darkTextSecondary = Color(0xFF94A3B8);
  static final Color darkBorder = Color(0xFF334155);

  // In app_styles.dart
 static Widget logo(BuildContext context, {double? height, double? width}) {
  final isDark = Theme.of(context).brightness == Brightness.dark;
  final logoPath = isDark ? 'assets/logo/Logo_Wiz_dark.png' : 'assets/logo/Logo_Wiz.png';

  return Image.asset(
    logoPath,
    height: height,
    width: width,
    fit: BoxFit.contain,
  );
}

  // HELPER: Background
  static Color background(BuildContext context) {
    return Theme.of(context).scaffoldBackgroundColor;
  }

  // HELPER: Surface (input, card)
  static Color surface(BuildContext context) {
    final theme = Theme.of(context);
    return theme.brightness == Brightness.dark ? darkSurface : lightSurface;
  }

  // HELPER: Text Primary
  static Color textPrimary(BuildContext context) {
    return Theme.of(context).brightness == Brightness.dark ? darkTextPrimary : lightTextPrimary;
  }

  // HELPER: Text Secondary
  static Color textSecondary(BuildContext context) {
    return Theme.of(context).brightness == Brightness.dark ? darkTextSecondary : lightTextSecondary;
  }

  // ====================== TEXT STYLES (Auto Dark/Light) ======================
  static TextStyle h1(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return GoogleFonts.poppins(
      fontSize: 28,
      fontWeight: FontWeight.bold,
      color: isDark ? darkTextPrimary : lightTextPrimary,
    );
  }

  static TextStyle h2(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return GoogleFonts.poppins(
      fontSize: 22,
      fontWeight: FontWeight.bold,
      color: isDark ? darkTextPrimary : lightTextPrimary,
    );
  }

  static TextStyle h3(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return GoogleFonts.poppins(
      fontSize: 18,
      fontWeight: FontWeight.w600,
      color: isDark ? darkTextPrimary : lightTextPrimary,
    );
  }

  static TextStyle body(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return GoogleFonts.poppins(fontSize: 16, color: isDark ? darkTextSecondary : lightTextSecondary, height: 1.5, fontWeight: FontWeight.w500);
  }

  static TextStyle caption(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return GoogleFonts.poppins(fontSize: 14, color: isDark ? darkTextSecondary : lightTextSecondary);
  }

  static TextStyle link(BuildContext context) {
    return GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w600, color: primary);
  }

  static TextStyle button = GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white);

  // ====================== INPUT DECORATION ======================
  static InputDecoration inputDecoration({
    required String hint,
    required IconData icon,
    Widget? suffixIcon,
    required BuildContext context,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final fillColor = isDark ? darkSurface : lightSurface;
    final hintColor = (isDark ? darkTextSecondary : lightTextSecondary).withOpacity(0.6);
    final iconColor = isDark ? darkTextSecondary : lightTextSecondary;

    return InputDecoration(
      prefixIcon: Icon(icon, color: iconColor),
      hintText: hint,
      hintStyle: GoogleFonts.poppins(color: hintColor),
      filled: true,
      fillColor: fillColor,
      border: _border(),
      enabledBorder: _border(),
      focusedBorder: _border().copyWith(borderSide: const BorderSide(color: primary, width: 2)),
      contentPadding: const EdgeInsets.symmetric(vertical: 18, horizontal: 16),
      suffixIcon: suffixIcon,
    );
  }

  static OutlineInputBorder _border() {
    return OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none);
  }

  // ====================== BUTTON STYLES ======================
  static ButtonStyle primaryButtonStyle(BuildContext context) {
    return ElevatedButton.styleFrom(
      backgroundColor: primary,
      disabledBackgroundColor: primary.withOpacity(0.5),
      padding: const EdgeInsets.symmetric(vertical: 18),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      elevation: 0,
    );
  }

  static ButtonStyle socialButtonStyle(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return OutlinedButton.styleFrom(
      padding: const EdgeInsets.all(16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      side: BorderSide(color: isDark ? darkBorder : const Color(0xFFE5E7EB)),
      backgroundColor: isDark ? darkSurface.withOpacity(0.5) : Colors.transparent,
    );
  }

  // ====================== THEME DATA ======================
  static ThemeData lightTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,
    scaffoldBackgroundColor: lightBackground,
    primaryColor: primary,
    fontFamily: GoogleFonts.poppins().fontFamily,
    textTheme: TextTheme(
      headlineLarge: GoogleFonts.poppins(fontSize: 28, fontWeight: FontWeight.bold, color: lightTextPrimary),
      headlineMedium: GoogleFonts.poppins(fontSize: 22, fontWeight: FontWeight.bold, color: lightTextPrimary),
      headlineSmall: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w600, color: lightTextPrimary),
      bodyLarge: GoogleFonts.poppins(fontSize: 16, color: lightTextSecondary, height: 1.5),
      bodyMedium: GoogleFonts.poppins(fontSize: 16, color: lightTextSecondary),
      labelLarge: button,
    ),
    // YOUR CODE GOES HERE
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: primary,
        disabledBackgroundColor: primary.withOpacity(0.5),
        padding: const EdgeInsets.symmetric(vertical: 18),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        elevation: 0,
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: lightSurface,
      border: _border(),
      enabledBorder: _border(),
      focusedBorder: _border().copyWith(borderSide: const BorderSide(color: primary, width: 2)),
      contentPadding: const EdgeInsets.symmetric(vertical: 18, horizontal: 16),
      prefixIconColor: lightTextSecondary,
      hintStyle: GoogleFonts.poppins(color: lightTextSecondary.withOpacity(0.6)),
    ),
  );

  static ThemeData darkTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    scaffoldBackgroundColor: darkBackground,
    primaryColor: primary,
    fontFamily: GoogleFonts.poppins().fontFamily,
    textTheme: TextTheme(
      headlineLarge: GoogleFonts.poppins(fontSize: 28, fontWeight: FontWeight.bold, color: darkTextPrimary),
      headlineMedium: GoogleFonts.poppins(fontSize: 22, fontWeight: FontWeight.bold, color: darkTextPrimary),
      headlineSmall: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w600, color: darkTextPrimary),
      bodyLarge: GoogleFonts.poppins(fontSize: 16, color: darkTextSecondary, height: 1.5),
      bodyMedium: GoogleFonts.poppins(fontSize: 16, color: darkTextSecondary),
      labelLarge: button,
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: primary,
        disabledBackgroundColor: primary.withOpacity(0.5),
        padding: const EdgeInsets.symmetric(vertical: 18),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        elevation: 0,
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: darkSurface,
      border: _border(),
      enabledBorder: _border(),
      focusedBorder: _border().copyWith(borderSide: const BorderSide(color: primary, width: 2)),
      contentPadding: const EdgeInsets.symmetric(vertical: 18, horizontal: 16),
      prefixIconColor: darkTextSecondary,
      hintStyle: GoogleFonts.poppins(color: darkTextSecondary.withOpacity(0.6)),
    ),
    dividerColor: darkBorder,
  );
}
