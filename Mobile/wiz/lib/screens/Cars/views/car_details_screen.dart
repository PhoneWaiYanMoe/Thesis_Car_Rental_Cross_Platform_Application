import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/constants/booking_constants.dart';
import 'package:wiz/screens/Cars/views/widgets/_buildBottomBar.dart';
import 'package:wiz/screens/Cars/views/widgets/_buildCarHeader.dart';
import 'package:wiz/screens/Cars/views/widgets/_buildCarOwnerInfo.dart';
import 'package:wiz/screens/Cars/views/widgets/_buildFeatures.dart';
import 'package:wiz/screens/Cars/views/widgets/_buildInsurance.dart';
import 'package:wiz/screens/Cars/views/widgets/_buildLimitsAndFees.dart';
import 'package:wiz/screens/Cars/views/widgets/_buildPaymentMethod.dart';
import 'package:wiz/screens/Cars/views/widgets/_buildReviews.dart';
import 'package:wiz/screens/Cars/views/widgets/_buildRules.dart';
import 'package:wiz/screens/Cars/views/widgets/_buildTravelScope.dart';
import 'package:wiz/screens/Cars/views/widgets/_buildTripSummary.dart';
import 'package:wiz/utils/app_routes.dart';
import 'widgets/_buildCarImage.dart';
import 'package:wiz/screens/Booking/models/booking_data.dart';

class CarDetailsScreen extends StatefulWidget {
  final Map<String, dynamic> arguments;

  const CarDetailsScreen({super.key, required this.arguments});

  @override
  State<CarDetailsScreen> createState() => _CarDetailsScreenState();
}

class _CarDetailsScreenState extends State<CarDetailsScreen> {
  late BookingData _bookingData;

  @override
  void initState() {
    super.initState();
    _bookingData = BookingData.fromMap(widget.arguments);
  }

  void _updateBookingData({TravelScope? travelScope, InsuranceOption? insurance, PaymentMethod? paymentMethod}) {
    setState(() {
      _bookingData = _bookingData.copyWith(
        travelScope: travelScope,
        insurance: insurance,
        paymentMethod: paymentMethod,
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    final car = _bookingData.car;

    return Scaffold(
      backgroundColor: AppStyles.background(context),
      appBar: AppBar(
        leading: IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
        actions: [
          IconButton(icon: const Icon(Icons.share), onPressed: () {}),
          IconButton(icon: const Icon(Icons.favorite_border), onPressed: () {}),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            buildCarImage(images: car.images, height: 240),
            const SizedBox(height: 16),
            CarHeader(
              name: car.name,
              transmission: car.transmission,
              brand: car.brand,
              year: car.year,
              mileage: car.mileage,
              color: car.color,
              rating: car.rating,
              reviewCount: car.reviews,
            ),
            const SizedBox(height: 16),
            BuildTripSummary(bookingData: _bookingData),
            const SizedBox(height: 24),

            // Display mode (read-only)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: AppStyles.surface(context), borderRadius: BorderRadius.circular(12)),
              child: Row(
                children: [
                  Icon(_bookingData.withDriver ? Icons.person : Icons.directions_car, color: AppStyles.primary),
                  const SizedBox(width: 12),
                  Text(_bookingData.mode, style: AppStyles.h3(context).copyWith(color: AppStyles.primary)),
                ],
              ),
            ),

            const SizedBox(height: 16),
            TravelScopeSelector(
              selectedScope: _bookingData.travelScope,
              onChanged: (scope) => _updateBookingData(travelScope: scope),
            ),
            const SizedBox(height: 24),
            OwnerInfoCard(
              ownerName: car.owner,
              ownerAvatarAsset: car.ownerAvatar,
              joinedDate: car.ownerJoinedDate,
              onViewCarsPressed: () {},
            ),
            const SizedBox(height: 24),
            RulesByOwner(rules: car.rules),
            const SizedBox(height: 24),
            LimitsAndFees(limitsAndFees: car.limitsAndFees),
            const SizedBox(height: 24),
            CarFeaturesCard(
              transmission: car.transmission,
              seats: '${car.seats}-seater',
              fuelType: car.fuel,
              features: car.features,
            ),
            const SizedBox(height: 24),
            InsuranceSelector(
              initialOption: _bookingData.insurance,
              onChanged: (option) => _updateBookingData(insurance: option),
            ),
            const SizedBox(height: 24),
            PaymentMethodCard(
              initialMethod: _bookingData.paymentMethod,
              onChanged: (method) => _updateBookingData(paymentMethod: method),
            ),
            const SizedBox(height: 24),
            ReviewsSection(
              reviews: [
                Review(name: 'Nguyen Thi A', date: '15/May/2025', rating: 4.8),
                Review(
                  name: 'Tran Van B',
                  date: '10/May/2025',
                  rating: 5.0,
                  comment: 'Great car! Clean and comfortable.',
                ),
                Review(name: 'Le Thi C', date: '08/May/2025', rating: 4.5),
              ],
              onSeeMorePressed: () {},
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
      bottomNavigationBar: BookingBottomBar(
        pricePerDay: car.price,
        buttonText: 'Book Now',
        isLoading: false,
        onPressed: () {
          AppRoutes.navigateTo(context, AppRoutes.booking, arguments: _bookingData.toMap());
        },
      ),
    );
  }
}
