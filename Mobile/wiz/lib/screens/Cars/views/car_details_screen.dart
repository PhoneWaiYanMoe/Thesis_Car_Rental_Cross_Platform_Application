// lib/screens/Cars/views/car_details_screen.dart
import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/constants/booking_constants.dart';
import 'package:wiz/screens/Cars/models/car.dart';
import 'package:wiz/screens/Cars/services/vehicle_api_service.dart';
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
  final VehicleApiService _apiService = VehicleApiService();

  late BookingData _bookingData;
  bool _isLoading = true;
  bool _isCheckingAvailability = false;
  String? _error;
  VehicleAvailability? _availability;

  @override
  void initState() {
    super.initState();
    _bookingData = BookingData.fromMap(widget.arguments);
    _loadVehicleDetails();
  }

  Future<void> _loadVehicleDetails() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      // Get vehicle ID from allCars list
      final carIndex = widget.arguments['carIndex'] as int;
      final allCars = (widget.arguments['allCars'] as List?)?.cast<Car>() ?? [];

      if (carIndex < 0 || carIndex >= allCars.length) {
        throw Exception('Invalid car index');
      }

      // For now, use the car from the list
      // In production, you'd fetch fresh details from API
      final car = allCars[carIndex];

      // Update booking data with the car
      _bookingData = _bookingData.copyWith();

      // Check availability
      await _checkAvailability();

      setState(() {
        _isLoading = false;
      });
    } catch (e) {
      print('❌ Error loading vehicle details: $e');
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _checkAvailability() async {
    setState(() {
      _isCheckingAvailability = true;
    });

    try {
      // Parse dates from datetime string
      final datetime = widget.arguments['datetime'] as String?;
      String? startDate;
      String? endDate;

      if (datetime != null && datetime.contains(' - ')) {
        final parts = datetime.split(' - ');
        if (parts.length == 2) {
          final startParts = parts[0].split(', ');
          final endParts = parts[1].split(', ');

          if (startParts.length == 2) {
            final startDayMonth = startParts[1].split('/');
            if (startDayMonth.length == 2) {
              startDate = '2025-${startDayMonth[1].padLeft(2, '0')}-${startDayMonth[0].padLeft(2, '0')}';
            }
          }

          if (endParts.length == 2) {
            final endDayMonth = endParts[1].split('/');
            if (endDayMonth.length == 2) {
              endDate = '2025-${endDayMonth[1].padLeft(2, '0')}-${endDayMonth[0].padLeft(2, '0')}';
            }
          }
        }
      }

      if (startDate != null && endDate != null) {
        // In production, get actual vehicle ID
        // For now, we'll skip the API call since we don't have real vehicle IDs yet
        print('📅 Would check availability from $startDate to $endDate');
      }

      setState(() {
        _isCheckingAvailability = false;
      });
    } catch (e) {
      print('⚠️ Availability check failed: $e');
      setState(() {
        _isCheckingAvailability = false;
      });
    }
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
    if (_isLoading) {
      return Scaffold(
        backgroundColor: AppStyles.background(context),
        appBar: AppBar(
          leading: IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
        ),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_error != null) {
      return Scaffold(
        backgroundColor: AppStyles.background(context),
        appBar: AppBar(
          leading: IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, size: 64, color: Colors.red.withOpacity(0.5)),
              const SizedBox(height: 16),
              Text('Failed to load vehicle', style: AppStyles.body(context)),
              Text(_error!, style: AppStyles.caption(context)),
              const SizedBox(height: 24),
              ElevatedButton(onPressed: _loadVehicleDetails, child: const Text('Retry')),
            ],
          ),
        ),
      );
    }

    final car = _bookingData.car;

    // Show availability warning if not available
    if (_availability != null && !_availability!.isAvailable) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(_availability!.message),
              backgroundColor: Colors.orange,
              duration: const Duration(seconds: 5),
              action: SnackBarAction(
                label: 'Details',
                textColor: Colors.white,
                onPressed: () {
                  showDialog(
                    context: context,
                    builder: (_) => AlertDialog(
                      title: const Text('Unavailable Periods'),
                      content: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: _availability!.unavailablePeriods.map((period) {
                          return ListTile(
                            leading: const Icon(Icons.event_busy),
                            title: Text('${period.startDate} - ${period.endDate}'),
                            subtitle: Text(period.reason),
                          );
                        }).toList(),
                      ),
                      actions: [TextButton(onPressed: () => Navigator.pop(context), child: const Text('Close'))],
                    ),
                  );
                },
              ),
            ),
          );
        }
      });
    }

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

            // Availability indicator
            if (_isCheckingAvailability)
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: Colors.blue.shade50, borderRadius: BorderRadius.circular(8)),
                child: Row(
                  children: [
                    const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)),
                    const SizedBox(width: 12),
                    Text('Checking availability...', style: AppStyles.caption(context)),
                  ],
                ),
              )
            else if (_availability != null && !_availability!.isAvailable)
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.orange.shade50,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.orange),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.warning, color: Colors.orange),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Not available for selected dates',
                        style: AppStyles.caption(context).copyWith(color: Colors.orange.shade900),
                      ),
                    ),
                  ],
                ),
              ),

            if (_isCheckingAvailability || (_availability != null && !_availability!.isAvailable))
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
            if (car.rules.isNotEmpty) ...[RulesByOwner(rules: car.rules), const SizedBox(height: 24)],
            if (car.limitsAndFees.isNotEmpty) ...[
              LimitsAndFees(limitsAndFees: car.limitsAndFees),
              const SizedBox(height: 24),
            ],
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
        onPressed: (_availability != null && !_availability!.isAvailable)
            ? null
            : () {
                AppRoutes.navigateTo(context, AppRoutes.booking, arguments: _bookingData.toMap());
              },
      ),
    );
  }
}
