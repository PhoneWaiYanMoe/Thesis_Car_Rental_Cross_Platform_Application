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
class BookingData {
  // Trip information
  final String mode; // 'Self Drive' or 'With Driver'
  final bool withDriver;
  final String? location; // For self-drive
  final String? pickup; // For with driver
  final String? destination; // For with driver
  final String datetime; // Source of truth: e.g., "9:00 PM, 1/8/2026 - 8:00 PM, 2/8/2026"

  // Car information
  final Car car;
  final int carIndex;

  // Booking options
  final TravelScope travelScope;
  final InsuranceOption insurance;
  final PaymentMethod paymentMethod;

  // Rental information
  final int? id;
  final BookingStatus? status;
  final String? price;
  final String? date;
  final String? duration;
  final bool? rated;
  final bool? startPhotosSubmitted;
  final bool? endPhotosSubmitted;

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

  // COMPUTED GETTERS — always up-to-date based on 'datetime'
  DateTime get startDate => _parseDateTimeString(datetime)['start'] as DateTime;
  DateTime get endDate => _parseDateTimeString(datetime)['end'] as DateTime;
  int get days => _parseDateTimeString(datetime)['days'] as int;

  BookingData({
    required this.mode,
    required this.withDriver,
    this.location,
    this.pickup,
    this.destination,
    required this.datetime,
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

  // Getters for car details
  String get carName => car.name;
  String get carImage => car.image;

  // Factory from map (for navigation arguments)
  factory BookingData.fromMap(Map<String, dynamic> map) {
    Car car;

    if (map.containsKey('car') && map['car'] is Car) {
      car = map['car'] as Car;
    } else {
      // Placeholder car if none provided
      car = Car(
        ownerId: 'placeholder',
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

    return BookingData(
      mode: map['mode'] as String,
      withDriver: map['withDriver'] as bool,
      location: map['location'] as String?,
      pickup: map['pickup'] as String?,
      destination: map['destination'] as String?,
      datetime: map['datetime'] as String? ?? '9:00 PM, 1/1/2026 - 8:00 PM, 2/1/2026', // fallback
      car: car,
      carIndex: map['carIndex'] as int? ?? 0,
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

  Map<String, dynamic> toMap() {
    return {
      'mode': mode,
      'withDriver': withDriver,
      'location': location,
      'pickup': pickup,
      'destination': destination,
      'datetime': datetime,
      'car': car,
      'carIndex': carIndex,
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
    String? datetime, // Only this triggers date/day update
  }) {
    return BookingData(
      mode: mode,
      withDriver: withDriver,
      location: location,
      pickup: pickup,
      destination: destination,
      datetime: datetime ?? this.datetime,
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

  String get displayLocation {
    if (withDriver) {
      return '$pickup → $destination';
    }
    return location ?? 'No location';
  }

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

  // Helper: Parse datetime string into start, end, and days
  static Map<String, dynamic> _parseDateTimeString(String datetime) {
    try {
      final parts = datetime.split(' - ');
      if (parts.length != 2) throw FormatException('Invalid format');

      final startStr = parts[0].trim();
      final endStr = parts[1].trim();

      final startDate = _parseDate(startStr);
      final endDate = _parseDate(endStr);

      // Correct duration: 1/8 to 2/8 = 1 day
      final difference = endDate.difference(startDate);
      final days = difference.inDays;

      return {
        'start': startDate,
        'end': endDate,
        'days': days >= 1 ? days : 1, // Minimum 1 day
      };
    } catch (e) {
      print('Error parsing datetime "$datetime": $e');
      final now = DateTime.now();
      return {'start': now, 'end': now.add(const Duration(days: 1)), 'days': 1};
    }
  }

  static DateTime _parseDate(String dateStr) {
    // Input: "9:00 PM, 1/8/2026" or "8:50 AM, 12/Oct/2025"
    final datePart = dateStr.split(', ').last.trim();
    final segments = datePart.split('/');

    if (segments.isEmpty) throw FormatException('Invalid date');

    final day = int.parse(segments[0]);
    int month;
    int year = DateTime.now().year;

    if (segments.length >= 2) {
      if (int.tryParse(segments[1]) != null) {
        // Numeric: 1/8 or 1/8/2026
        month = int.parse(segments[1]);
        if (segments.length >= 3) {
          year = int.parse(segments[2]);
        }
      } else {
        // Text month: 12/Oct/2025
        const monthMap = {
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
        month = monthMap[segments[1]] ?? 1;
        if (segments.length >= 3) {
          year = int.parse(segments[2]);
        }
      }
    } else {
      month = DateTime.now().month;
    }

    return DateTime(year, month, day);
  }
}
