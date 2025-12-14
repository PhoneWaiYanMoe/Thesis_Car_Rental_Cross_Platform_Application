import 'dart:ui';

import 'package:flutter/material.dart';

class RentalBooking {
  final int id;
  final String carName;
  final String carImage;
  final BookingStatus status;
  final String price;
  final String date;
  final String duration;
  final bool? rated;

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

  RentalBooking({
    required this.id,
    required this.carName,
    required this.carImage,
    required this.status,
    required this.price,
    required this.date,
    required this.duration,
    this.rated,
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
  });

  static List<RentalBooking> getSampleBookings() {
    return [
      RentalBooking(
        id: 1,
        carName: 'BMW X1 2020',
        carImage: 'assets/images/Car.png',
        status: BookingStatus.completed,
        price: '2,000,000 VND',
        date: 'Oct 25, 2025',
        duration: '2 Days',
        rated: true,
        renterName: 'Jaes Myott',
        licenseNumber: '346654',
        startTime: '8:50 A.M, 12/Oct/2025',
        endTime: '8:50 A.M, 14/Oct/2025',
        rentalPrice: 780000,
        insuranceFee: 70000,
        depositPayment: 510000,
        remainingPayment: 1190000,
        ownerName: 'Rumbling',
        ownerTrips: 16,
        ownerRating: 4.5,
        ownerCars: 3,
      ),
      RentalBooking(
        id: 2,
        carName: 'Toyota RAV4 2020',
        carImage: 'assets/images/Car_2.png',
        status: BookingStatus.completed,
        price: '2,000,000 VND',
        date: 'Oct 25, 2025',
        duration: '2 Days',
        rated: false,
      ),
      RentalBooking(
        id: 3,
        carName: 'Honda HR-V 2020',
        carImage: 'assets/images/Car.png',
        status: BookingStatus.cancelled,
        price: '2,000,000 VND',
        date: 'Oct 25, 2025',
        duration: '2 Days',
      ),
      RentalBooking(
        id: 4,
        carName: 'Honda HR-V 2020',
        carImage: 'assets/images/Car_2.png',
        status: BookingStatus.pending,
        price: '2,000,000 VND',
        date: 'Oct 25, 2025',
        duration: '2 Days',
      ),
      RentalBooking(
        id: 5,
        carName: 'Hyundai Tucson',
        carImage: 'assets/images/Car.png',
        status: BookingStatus.confirmed,
        price: '2,000,000 VND',
        date: 'Oct 25, 2025',
        duration: '2 Days',
      ),
      RentalBooking(
        id: 6,
        carName: 'Mercedes-Benz GLA',
        carImage: 'assets/images/Car_2.png',
        status: BookingStatus.onJourney,
        price: '2,000,000 VND',
        date: 'Oct 25, 2025',
        duration: '2 Days',
      ),
    ];
  }
}

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
