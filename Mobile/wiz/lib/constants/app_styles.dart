import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppStyles {
  static const Color primary = Color(0xFF6C5CE7);
  static const Color primaryLight = Color(0xFF9980FA);
  static const Color primaryDark = Color(0xFF5A4BCF);
  static const Color background = Color(0xFFFFFFFF);
  static const Color surface = Color(0xFFF7F8FA);
  static const Color textPrimary = Colors.black87;
  static const Color textSecondary = Color(0xFF636E72);
  static const Color error = Color(0xFFE74C3C);
  static const Color success = Color(0xFF27AE60);

  static TextStyle h1 = GoogleFonts.poppins(
    fontSize: 28,
    fontWeight: FontWeight.bold,
    color: textPrimary,
  );

  static TextStyle h2 = GoogleFonts.poppins(
    fontSize: 22,
    fontWeight: FontWeight.bold,
    color: textPrimary,
  );

  static TextStyle h3 = GoogleFonts.poppins(
    fontSize: 18,
    fontWeight: FontWeight.w600,
    color: textPrimary,
  );

  static TextStyle body = GoogleFonts.poppins(
    fontSize: 16,
    color: textSecondary,
    height: 1.5,
  );

  static TextStyle bodyBold = GoogleFonts.poppins(
    fontSize: 16,
    fontWeight: FontWeight.w600,
    color: textPrimary,
  );

  static TextStyle caption = GoogleFonts.poppins(
    fontSize: 14,
    color: textSecondary,
  );

  static TextStyle button = GoogleFonts.poppins(
    fontSize: 18,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  );
}