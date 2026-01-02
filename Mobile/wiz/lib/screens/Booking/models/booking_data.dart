// lib/models/booking_data.dart

import 'package:wiz/constants/booking_constants.dart';
import 'package:wiz/screens/Cars/models/car.dart';
import 'package:flutter/material.dart';

enum BookingStatus { pending, confirmed, onJourney, completed, cancelled }

extension BookingStatusExtension on BookingStatus {
  String get displayName {
    switch (this) {
      case BookingStatus.pending:
        return 'Pending';
      case BookingStatus.confirmed:
        return 'Confirmed';
      case BookingStatus.onJourney:
        return 'On Journey';
      case BookingStatus.completed:
        return 'Completed';
      case BookingStatus.cancelled:
        return 'Cancelled';
    }
  }

  Color get color {
    switch (this) {
      case BookingStatus.pending:
        return Colors.orange;
      case BookingStatus.confirmed:
        return Colors.blue;
      case BookingStatus.onJourney:
        return Colors.purple;
      case BookingStatus.completed:
        return Colors.green;
      case BookingStatus.cancelled:
        return Colors.red;
    }
  }
}

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

  // Rental information (combined from RentalBooking)
  final int? id;
  final BookingStatus? status;
  final String? price;
  final String? date;
  final String? duration;
  final bool? rated;
  final bool? startPhotosSubmitted; // Track if start photos are submitted
  final bool? endPhotosSubmitted; // Track if end photos are submitted

  // Detailed info
  final String? renterName;
  final String? licenseNumber;
  final String? startTime;
  final String? endTime;
  final int? rentalPrice;
  final int? insuranceFee;
  final int? depositPayment;
  final int? remainingPayment;
  final String? ownerName;
  final int? ownerTrips;
  final double? ownerRating;
  final int? ownerCars;

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
    this.id,
    this.status = BookingStatus.pending,
    this.price,
    this.date,
    this.duration,
    this.rated = false,
    this.renterName,
    this.licenseNumber,
    this.startTime,
    this.endTime,
    this.rentalPrice,
    this.insuranceFee,
    this.depositPayment,
    this.remainingPayment,
    this.ownerName,
    this.ownerTrips,
    this.ownerRating,
    this.ownerCars,
    this.startPhotosSubmitted = false,
    this.endPhotosSubmitted = false,
  });

  // Getters for car details (assuming Car model has name and image properties)
  String get carName => car.name;
  String get carImage => car.image; // Adjust to match actual Car property (e.g., imagePath)

  // Create from Map (for navigation arguments)

  // Create from Map (for navigation arguments)
  factory BookingData.fromMap(Map<String, dynamic> map) {
    // ✅ CHANGED: Get car directly from map instead of using index
    Car? car;

    if (map.containsKey('car') && map['car'] is Car) {
      // Car object passed directly
      car = map['car'] as Car;
    } else {
      // ✅ FIXED: Create a placeholder car for trip summary display
      car = Car(
        id: 'placeholder',
        image: 'assets/images/Car.png',
        images: ['assets/images/Car.png'],
        name: 'Select a car',
        rating: 0.0,
        reviews: 0,
        price: 0,
        owner: 'Owner',
        ownerAvatar: 'assets/images/article_2.png',
        ownerJoinedDate: DateTime.now(),
        location: map['location'] as String? ?? 'Unknown',
        seats: 5,
        fuel: 'Gasoline',
        type: 'Sedan',
        transmission: 'Automatic',
        instant: false,
        driver: false,
        discount: false,
        brand: 'Brand',
        year: 2020,
        mileage: '0 km',
        color: 'Unknown',
        features: [],
        rules: [],
        limitsAndFees: {},
      );
    }

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
      car: car, // ✅ Use car from map
      carIndex: 0, // ✅ Keep for backwards compatibility but not used
      travelScope: map['travelScope'] as TravelScope? ?? TravelScope.inner,
      insurance: map['insurance'] as InsuranceOption? ?? InsuranceOption.none,
      paymentMethod: map['paymentMethod'] as PaymentMethod? ?? PaymentMethod.none,
      id: map['id'] as int?,
      status: map['status'] as BookingStatus? ?? BookingStatus.pending,
      price: map['price'] as String?,
      date: map['date'] as String?,
      duration: map['duration'] as String?,
      rated: map['rated'] as bool? ?? false,
      renterName: map['renterName'] as String?,
      licenseNumber: map['licenseNumber'] as String?,
      startTime: map['startTime'] as String?,
      endTime: map['endTime'] as String?,
      rentalPrice: map['rentalPrice'] as int?,
      insuranceFee: map['insuranceFee'] as int?,
      depositPayment: map['depositPayment'] as int?,
      remainingPayment: map['remainingPayment'] as int?,
      ownerName: map['ownerName'] as String?,
      ownerTrips: map['ownerTrips'] as int?,
      ownerRating: map['ownerRating'] as double?,
      ownerCars: map['ownerCars'] as int?,
      startPhotosSubmitted: map['startPhotosSubmitted'] as bool? ?? false,
      endPhotosSubmitted: map['endPhotosSubmitted'] as bool? ?? false,
    );
  }

  // ✅ UPDATE: toMap to include car object
  Map<String, dynamic> toMap() {
    return {
      'mode': mode,
      'withDriver': withDriver,
      'location': location,
      'pickup': pickup,
      'destination': destination,
      'datetime': datetime,
      'car': car, // ✅ Include car object
      'carIndex': carIndex, // Keep for compatibility
      'travelScope': travelScope,
      'insurance': insurance,
      'paymentMethod': paymentMethod,
      'id': id,
      'status': status,
      'price': price,
      'date': date,
      'duration': duration,
      'rated': rated,
      'renterName': renterName,
      'licenseNumber': licenseNumber,
      'startTime': startTime,
      'endTime': endTime,
      'rentalPrice': rentalPrice,
      'insuranceFee': insuranceFee,
      'depositPayment': depositPayment,
      'remainingPayment': remainingPayment,
      'ownerName': ownerName,
      'ownerTrips': ownerTrips,
      'ownerRating': ownerRating,
      'ownerCars': ownerCars,
      'startPhotosSubmitted': startPhotosSubmitted,
      'endPhotosSubmitted': endPhotosSubmitted,
    };
  }

  // Copy with for updating booking options
  BookingData copyWith({
    TravelScope? travelScope,
    InsuranceOption? insurance,
    PaymentMethod? paymentMethod,
    int? id,
    BookingStatus? status,
    String? price,
    String? date,
    String? duration,
    bool? rated,
    String? renterName,
    String? licenseNumber,
    String? startTime,
    String? endTime,
    int? rentalPrice,
    int? insuranceFee,
    int? depositPayment,
    int? remainingPayment,
    String? ownerName,
    int? ownerTrips,
    double? ownerRating,
    int? ownerCars,
    bool? startPhotosSubmitted,
    bool? endPhotosSubmitted,
  }) {
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
      id: id ?? this.id,
      status: status ?? this.status,
      price: price ?? this.price,
      date: date ?? this.date,
      duration: duration ?? this.duration,
      rated: rated ?? this.rated,
      renterName: renterName ?? this.renterName,
      licenseNumber: licenseNumber ?? this.licenseNumber,
      startTime: startTime ?? this.startTime,
      endTime: endTime ?? this.endTime,
      rentalPrice: rentalPrice ?? this.rentalPrice,
      insuranceFee: insuranceFee ?? this.insuranceFee,
      depositPayment: depositPayment ?? this.depositPayment,
      remainingPayment: remainingPayment ?? this.remainingPayment,
      ownerName: ownerName ?? this.ownerName,
      ownerTrips: ownerTrips ?? this.ownerTrips,
      ownerRating: ownerRating ?? this.ownerRating,
      ownerCars: ownerCars ?? this.ownerCars,
      startPhotosSubmitted: startPhotosSubmitted ?? this.startPhotosSubmitted,
      endPhotosSubmitted: endPhotosSubmitted ?? this.endPhotosSubmitted,
    );
  }

  // Helper to get display location
  String get displayLocation {
    if (withDriver) {
      return '$pickup → $destination';
    }
    return location ?? 'No location';
  }

  // Calculate pricing (use stored values if available, else compute)
  int get calculatedRentalPrice => rentalPrice ?? (car.price * days);

  int get calculatedInsuranceFee {
    if (insuranceFee != null) return insuranceFee!;
    switch (insurance) {
      case InsuranceOption.p30:
        return (calculatedRentalPrice * 0.30).round();
      case InsuranceOption.p50:
        return (calculatedRentalPrice * 0.50).round();
      case InsuranceOption.p70:
        return (calculatedRentalPrice * 0.70).round();
      case InsuranceOption.p100:
        return calculatedRentalPrice;
      case InsuranceOption.none:
        return 0;
    }
  }

  int get totalPrice => calculatedRentalPrice + calculatedInsuranceFee;
  int get depositAmount => depositPayment ?? (totalPrice * 0.30).round();
  int get remainingAmount => remainingPayment ?? (totalPrice - depositAmount);

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

  // Replace the getSampleBookings method in booking_data.dart
}
