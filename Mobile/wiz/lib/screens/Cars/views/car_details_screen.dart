// lib/screens/Cars/views/car_details_screen.dart
import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/constants/booking_constants.dart';
import 'package:wiz/screens/Cars/models/car.dart';
import 'package:wiz/screens/Cars/services/vehicle_api_service.dart';
import 'package:wiz/screens/Cars/services/review_api_service.dart';
import 'package:wiz/screens/Cars/views/owner_cars_screen.dart';
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
  final ReviewApiService _reviewApiService = ReviewApiService();

  late BookingData _bookingData;
  bool _isLoading = true;
  bool _isCheckingAvailability = false;
  bool _isLoadingReviews = false;
  String? _error;
  VehicleAvailability? _availability;
  VehicleReviewsResponse? _reviewsResponse;
  Car? _car;

  @override
  void initState() {
    super.initState();
    _bookingData = BookingData.fromMap(widget.arguments);
    _loadVehicleDetails();
  }

  // Mobile/wiz/lib/screens/Cars/views/car_details_screen.dart
  // ✅ UPDATE: _loadVehicleDetails method

  Future<void> _loadVehicleDetails() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      // ✅ CHANGED: Get car directly from arguments
      Car car;

      if (widget.arguments.containsKey('car') && widget.arguments['car'] is Car) {
        // Car object passed directly from car list
        car = widget.arguments['car'] as Car;
        print('✅ Loaded car from arguments: ${car.name} (ID: ${car.id})');
      } else {
        throw Exception('Car object not found in arguments');
      }

      // ✅ Fetch fresh details from API using car.id to get latest data including owner info
      try {
        final vehicleDetails = await _apiService.getVehicleDetails(car.id);
        car = vehicleDetails.toCar();
        print('✅ Fetched fresh vehicle details from API');
      } catch (e) {
        print('⚠️ Failed to fetch fresh details, using cached car: $e');
        // Continue with car from arguments if API fails
      }

      // Store car in state
      _car = car;

      // Update booking data with the car
      _bookingData = _bookingData.copyWith();

      // Check availability and load reviews in parallel
      await Future.wait([_checkAvailability(), _loadReviews(car.id)]);

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

  Future<void> _loadReviews(String vehicleId) async {
    setState(() {
      _isLoadingReviews = true;
    });

    try {
      print('📝 Loading reviews for vehicle: $vehicleId');
      final reviewsResponse = await _reviewApiService.getVehicleReviews(
        vehicleId: vehicleId,
        sortBy: 'newest',
        limit: 10,
      );

      setState(() {
        _reviewsResponse = reviewsResponse;
        _isLoadingReviews = false;
      });

      print('✅ Loaded ${reviewsResponse.reviews.length} reviews');
    } catch (e) {
      print('⚠️ Failed to load reviews: $e');
      setState(() {
        _isLoadingReviews = false;
      });
      // Don't set error, just show empty reviews
    }
  }

  // Mobile/wiz/lib/screens/Cars/views/car_details_screen.dart
  // Replace the _checkAvailability method

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
        final now = DateTime.now();
        final currentYear = now.year;

        final parts = datetime.split(' - ');
        if (parts.length == 2) {
          final startParts = parts[0].split(', ');
          final endParts = parts[1].split(', ');

          // ✅ FIX: Parse start date with correct year logic
          if (startParts.length == 2) {
            final startDayMonth = startParts[1].split('/');
            if (startDayMonth.length == 2) {
              final startDay = int.parse(startDayMonth[0]);
              final startMonth = int.parse(startDayMonth[1]);

              // ✅ If date is in the past (same month but earlier day, or earlier month), use next year
              int startYear = currentYear;
              if (startMonth < now.month || (startMonth == now.month && startDay < now.day)) {
                startYear = currentYear + 1;
              }

              startDate = '$startYear-${startMonth.toString().padLeft(2, '0')}-${startDay.toString().padLeft(2, '0')}';
            }
          }

          // ✅ FIX: Parse end date with correct year logic
          if (endParts.length == 2) {
            final endDayMonth = endParts[1].split('/');
            if (endDayMonth.length == 2) {
              final endDay = int.parse(endDayMonth[0]);
              final endMonth = int.parse(endDayMonth[1]);

              // ✅ End date year should be based on start date
              int endYear = currentYear;
              if (startDate != null) {
                final parsedStartDate = DateTime.parse(startDate);

                // If end month/day is before start month/day, it must be next year
                if (endMonth < parsedStartDate.month ||
                    (endMonth == parsedStartDate.month && endDay < parsedStartDate.day)) {
                  endYear = parsedStartDate.year + 1;
                } else {
                  endYear = parsedStartDate.year;
                }
              } else {
                // Fallback: use same logic as start date
                if (endMonth < now.month || (endMonth == now.month && endDay < now.day)) {
                  endYear = currentYear + 1;
                }
              }

              endDate = '$endYear-${endMonth.toString().padLeft(2, '0')}-${endDay.toString().padLeft(2, '0')}';
            }
          }
        }
      }

      if (startDate != null && endDate != null) {
        final car = _bookingData.car;
        print('📅 Checking availability for vehicle ${car.id} from $startDate to $endDate');

        final availability = await _apiService.checkAvailability(
          vehicleId: car.id,
          startDate: startDate,
          endDate: endDate,
        );

        setState(() {
          _availability = availability;
        });
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

    final car = _car ?? _bookingData.car;

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
              onViewCarsPressed: () {
                // Get owner ID from vehicle details loaded from API
                final ownerId = _car?.id ?? car.id; // Use vehicle's owner_id if available

                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => OwnerCarsScreen(
                      ownerId: car.ownerId,
                      ownerName: car.owner,
                      ownerAvatar: car.ownerAvatar,
                      joinedDate: car.ownerJoinedDate,
                    ),
                  ),
                );
              },
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
            if (_isLoadingReviews)
              const Center(
                child: Padding(padding: EdgeInsets.all(20), child: CircularProgressIndicator()),
              )
            else if (_reviewsResponse != null)
              ReviewsSection(
                reviews: _reviewsResponse!.reviews.map((r) {
                  // Parse date from ISO string
                  String formattedDate = r.createdAt;
                  try {
                    final date = DateTime.parse(r.createdAt);
                    formattedDate = '${date.day}/${_getMonthName(date.month)}/${date.year}';
                  } catch (e) {
                    // Keep original format if parsing fails
                  }

                  return Review(
                    name: r.user.name,
                    date: formattedDate,
                    rating: r.rating.toDouble(),
                    comment: r.comment,
                  );
                }).toList(),
                onSeeMorePressed: () {
                  // TODO: Navigate to full reviews screen
                },
              )
            else
              ReviewsSection(reviews: [], onSeeMorePressed: () {}),
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

  String _getMonthName(int month) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month - 1];
  }
}
