// lib/models/booking_data.dart

import 'package:wiz/constants/booking_constants.dart';
import 'package:wiz/screens/Cars/models/car.dart';

/// Consolidated model for all booking-related data
/// This eliminates the need to pass tripData and car separately
class BookingData {
  // Trip information
  final String mode; // 'Self Drive' or 'With Driver'
  final bool withDriver;
  final String? location; // For self-drive
  final String? pickup; // For with driver
  final String? destination; // For with driver
  final String datetime; // Combined date-time string
  final DateTime startDate;
  final DateTime endDate;
  final int days;

  // Car information
  final Car car;
  final int carIndex; // Keep if needed for navigation back

  // Booking options
  final TravelScope travelScope;
  final InsuranceOption insurance;
  final PaymentMethod paymentMethod;

  BookingData({
    required this.mode,
    required this.withDriver,
    this.location,
    this.pickup,
    this.destination,
    required this.datetime,
    required this.startDate,
    required this.endDate,
    required this.days,
    required this.car,
    required this.carIndex,
    this.travelScope = TravelScope.inner,
    this.insurance = InsuranceOption.none,
    this.paymentMethod = PaymentMethod.none,
  });

  // Create from Map (for navigation arguments)
  factory BookingData.fromMap(Map<String, dynamic> map) {
    final carIndex = map['carIndex'] as int;
    final car = Car.sampleCars[carIndex];

    // Parse dates from datetime string
    final datetime = map['datetime'] as String;
    final dates = _parseDateTimeString(datetime);

    return BookingData(
      mode: map['mode'] as String,
      withDriver: map['withDriver'] as bool,
      location: map['location'] as String?,
      pickup: map['pickup'] as String?,
      destination: map['destination'] as String?,
      datetime: datetime,
      startDate: dates['start']!,
      endDate: dates['end']!,
      days: dates['days']!,
      car: car,
      carIndex: carIndex,
      travelScope: map['travelScope'] as TravelScope? ?? TravelScope.inner,
      insurance: map['insurance'] as InsuranceOption? ?? InsuranceOption.none,
      paymentMethod: map['paymentMethod'] as PaymentMethod? ?? PaymentMethod.none,
    );
  }

  // Convert to Map (for navigation)
  Map<String, dynamic> toMap() {
    return {
      'mode': mode,
      'withDriver': withDriver,
      'location': location,
      'pickup': pickup,
      'destination': destination,
      'datetime': datetime,
      'carIndex': carIndex,
      'travelScope': travelScope,
      'insurance': insurance,
      'paymentMethod': paymentMethod,
    };
  }

  // Copy with for updating booking options
  BookingData copyWith({TravelScope? travelScope, InsuranceOption? insurance, PaymentMethod? paymentMethod}) {
    return BookingData(
      mode: mode,
      withDriver: withDriver,
      location: location,
      pickup: pickup,
      destination: destination,
      datetime: datetime,
      startDate: startDate,
      endDate: endDate,
      days: days,
      car: car,
      carIndex: carIndex,
      travelScope: travelScope ?? this.travelScope,
      insurance: insurance ?? this.insurance,
      paymentMethod: paymentMethod ?? this.paymentMethod,
    );
  }

  // Helper to get display location
  String get displayLocation {
    if (withDriver) {
      return '$pickup → $destination';
    }
    return location ?? 'No location';
  }

  // Calculate pricing
  int get rentalPrice => car.price * days;

  int get insuranceFee {
    switch (insurance) {
      case InsuranceOption.p30:
        return (rentalPrice * 0.30).round();
      case InsuranceOption.p50:
        return (rentalPrice * 0.50).round();
      case InsuranceOption.p70:
        return (rentalPrice * 0.70).round();
      case InsuranceOption.p100:
        return rentalPrice;
      case InsuranceOption.none:
        return 0;
    }
  }

  int get totalPrice => rentalPrice + insuranceFee;
  int get depositAmount => (totalPrice * 0.30).round();
  int get remainingAmount => totalPrice - depositAmount;

  // Helper method to parse datetime string
  static Map<String, dynamic> _parseDateTimeString(String datetime) {
    try {
      // Format: "9:00 PM, 26/11 - 8:00 PM, 3/12"
      // or "8:50 AM, 12/Oct/2025 - 8:50 AM, 14/Oct/2025"
      final parts = datetime.split(' - ');
      if (parts.length != 2) {
        throw FormatException('Invalid datetime format');
      }

      final startDate = _parseDate(parts[0].trim());
      final endDate = _parseDate(parts[1].trim());
      final days = endDate.difference(startDate).inDays + 1;

      print('Parsed dates - Start: $startDate, End: $endDate, Days: $days');

      return {'start': startDate, 'end': endDate, 'days': days > 0 ? days : 1};
    } catch (e) {
      print('Error parsing datetime: $e');
      // Fallback to current date
      final now = DateTime.now();
      return {'start': now, 'end': now.add(Duration(days: 1)), 'days': 1};
    }
  }

  static DateTime _parseDate(String dateStr) {
    // Extract date part from "9:00 PM, 26/11" or "8:50 AM, 12/Oct/2025"
    final datePart = dateStr.split(', ').last.trim();
    final parts = datePart.split('/');

    if (parts.isEmpty) {
      throw FormatException('Invalid date format');
    }

    final day = int.parse(parts[0]);
    int month;
    int year = DateTime.now().year;

    if (parts.length >= 2) {
      // Check if month is numeric or text
      if (int.tryParse(parts[1]) != null) {
        // Numeric month: "26/11" or "26/11/2025"
        month = int.parse(parts[1]);
        if (parts.length >= 3) {
          year = int.parse(parts[2]);
        }
      } else {
        // Text month: "12/Oct/2025"
        final monthMap = {
          'Jan': 1,
          'Feb': 2,
          'Mar': 3,
          'Apr': 4,
          'May': 5,
          'Jun': 6,
          'Jul': 7,
          'Aug': 8,
          'Sep': 9,
          'Oct': 10,
          'Nov': 11,
          'Dec': 12,
        };
        month = monthMap[parts[1]] ?? 1;
        if (parts.length >= 3) {
          year = int.parse(parts[2]);
        }
      }
    } else {
      month = 1;
    }

    return DateTime(year, month, day);
  }
}
