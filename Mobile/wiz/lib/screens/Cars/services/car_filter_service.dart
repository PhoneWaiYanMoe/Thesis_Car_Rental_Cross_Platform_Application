import '../models/car.dart';
import 'package:flutter/material.dart'; 
class CarFilterService {
  static List<Car> filterCars({
    required List<Car> cars,
    required RangeValues priceRange,
    required int? seats,
    required String? fuel,
    required String? type,
    required String? transmission,
    required bool instant,
    required bool driver,
    required bool discount,
  }) {
    return cars.where((car) {
      if (car.price < priceRange.start || car.price > priceRange.end) return false;
      if (seats != null && car.seats != seats) return false;
      if (fuel != null && car.fuel != fuel) return false;
      if (type != null && car.type != type) return false;
      if (transmission != null && car.transmission != transmission) return false;
      if (instant && !car.instant) return false;
      if (driver && !car.driver) return false;
      if (discount && !car.discount) return false;
      return true;
    }).toList();
  }
}
