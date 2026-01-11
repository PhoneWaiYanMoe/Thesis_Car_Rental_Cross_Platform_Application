// lib/screens/Cars/views/car_details_screen.dart
import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/constants/booking_constants.dart';
import 'package:wiz/screens/Cars/models/car.dart';
import 'package:wiz/screens/Cars/services/favorites_api_service.dart';
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
import 'package:wiz/screens/Home/views/dateTime_screen.dart';
import 'package:wiz/screens/Location/views/map_screen.dart';
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

  BookingData? _bookingData; // ✅ Now nullable
  bool _isLoading = true;
  bool _isCheckingAvailability = false;
  bool _isLoadingReviews = false;
  String? _error;
  VehicleAvailability? _availability;
  VehicleReviewsResponse? _reviewsResponse;

  final FavoritesApiService _favoritesApi = FavoritesApiService();
  bool _isFavorited = false;
  bool _isCheckingFavorite = true;
  bool _isTogglingFavorite = false;
  Car? _car;

  // ✅ NEW: Track if we have trip data
  bool get _hasTripData => _bookingData != null;

  // ✅ NEW: Temporary trip data before creating BookingData
  String? _tempLocation;
  String? _tempCity;
  String? _tempDistrict;
  String? _tempDatetime;
  bool _tempWithDriver = false;

  @override
  void initState() {
    super.initState();

    // ✅ Try to create BookingData - may fail if coming from favorites
    try {
      _bookingData = BookingData.fromMap(widget.arguments);
    } catch (e) {
      print('⚠️ No complete trip data available: $e');
      _bookingData = null;
    }

    _loadVehicleDetails();
    _checkFavoriteStatus();
  }

  Future<void> _loadVehicleDetails() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      Car car;

      if (widget.arguments.containsKey('car') && widget.arguments['car'] is Car) {
        car = widget.arguments['car'] as Car;
        print('✅ Loaded car from arguments: ${car.name} (ID: ${car.id})');
      } else {
        throw Exception('Car object not found in arguments');
      }

      // Fetch fresh details from API
      try {
        final vehicleDetails = await _apiService.getVehicleDetails(car.id);
        car = vehicleDetails.toCar();
        print('✅ Fetched fresh vehicle details from API');
      } catch (e) {
        print('⚠️ Failed to fetch fresh details, using cached car: $e');
      }

      _car = car;

      // Only check availability if we have trip data
      if (_hasTripData) {
        await Future.wait([_checkAvailability(), _loadReviews(car.id)]);
      } else {
        await _loadReviews(car.id);
      }

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

  Future<void> _checkFavoriteStatus() async {
    try {
      final car = widget.arguments['car'] as Car?;
      if (car != null) {
        final isFavorited = await _favoritesApi.checkFavorite(car.id);
        if (mounted) {
          setState(() {
            _isFavorited = isFavorited;
            _isCheckingFavorite = false;
          });
        }
      }
    } catch (e) {
      print('❌ Check favorite error: $e');
      if (mounted) {
        setState(() => _isCheckingFavorite = false);
      }
    }
  }

  Future<void> _toggleFavorite() async {
    if (_isTogglingFavorite) return;

    final car = _car ?? (_bookingData?.car ?? widget.arguments['car'] as Car);

    setState(() => _isTogglingFavorite = true);

    try {
      if (_isFavorited) {
        await _favoritesApi.removeFavorite(car.id);
        if (mounted) {
          setState(() => _isFavorited = false);
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(const SnackBar(content: Text('Removed from favorites'), backgroundColor: Colors.green));
        }
      } else {
        await _favoritesApi.addFavorite(car.id);
        if (mounted) {
          setState(() => _isFavorited = true);
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(const SnackBar(content: Text('Added to favorites'), backgroundColor: Colors.green));
        }
      }
    } catch (e) {
      print('❌ Toggle favorite error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              e.toString().contains('authenticated') ? 'Please login to save favorites' : 'Failed to update favorite',
            ),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isTogglingFavorite = false);
      }
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
    }
  }

  Future<void> _checkAvailability() async {
    if (!_hasTripData) return;

    setState(() {
      _isCheckingAvailability = true;
    });

    try {
      final datetime = _bookingData!.datetime;
      String? startDate;
      String? endDate;

      if (datetime.contains(' - ')) {
        final now = DateTime.now();
        final currentYear = now.year;

        final parts = datetime.split(' - ');
        if (parts.length == 2) {
          final startParts = parts[0].split(', ');
          final endParts = parts[1].split(', ');

          if (startParts.length == 2) {
            final startDayMonth = startParts[1].split('/');
            if (startDayMonth.length == 2) {
              final startDay = int.parse(startDayMonth[0]);
              final startMonth = int.parse(startDayMonth[1]);

              int startYear = currentYear;
              if (startMonth < now.month || (startMonth == now.month && startDay < now.day)) {
                startYear = currentYear + 1;
              }

              startDate = '$startYear-${startMonth.toString().padLeft(2, '0')}-${startDay.toString().padLeft(2, '0')}';
            }
          }

          if (endParts.length == 2) {
            final endDayMonth = endParts[1].split('/');
            if (endDayMonth.length == 2) {
              final endDay = int.parse(endDayMonth[0]);
              final endMonth = int.parse(endDayMonth[1]);

              int endYear = currentYear;
              if (startDate != null) {
                final parsedStartDate = DateTime.parse(startDate);

                if (endMonth < parsedStartDate.month ||
                    (endMonth == parsedStartDate.month && endDay < parsedStartDate.day)) {
                  endYear = parsedStartDate.year + 1;
                } else {
                  endYear = parsedStartDate.year;
                }
              } else {
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
        final car = _bookingData!.car;
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

  // ✅ NEW: Navigate to select location
  Future<void> _selectLocation() async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => MapScreen(title: 'Select Location')),
    );

    if (result != null && result is Map<String, dynamic>) {
      setState(() {
        _tempLocation = result['address'] as String?;
        _tempCity = result['city'] as String?;
        _tempDistrict = result['district'] as String?;
      });

      print('✅ Selected location: $_tempLocation');
    }
  }

  // ✅ NEW: Navigate to select date/time
  Future<void> _selectDateTime() async {
    final result = await Navigator.push(context, MaterialPageRoute(builder: (_) => const DateTimeScreen()));

    if (result != null && result is Map<String, dynamic>) {
      setState(() {
        _tempDatetime = result['datetime'] as String?;
      });

      print('✅ Selected datetime: $_tempDatetime');

      // ✅ If we now have both location and datetime, create BookingData
      if (_tempLocation != null && _tempDatetime != null) {
        _createBookingData();
      }
    }
  }

  // ✅ NEW: Create BookingData from temp values
  void _createBookingData() {
    if (_tempLocation == null || _tempDatetime == null || _car == null) return;

    final tripData = {
      'mode': _tempWithDriver ? 'With Driver' : 'Self Drive',
      'withDriver': _tempWithDriver,
      'location': _tempLocation,
      'city': _tempCity,
      'district': _tempDistrict,
      'datetime': _tempDatetime!,
      'car': _car!,
      'carIndex': 0,
    };

    setState(() {
      _bookingData = BookingData.fromMap(tripData);
    });

    print('✅ Created booking data');

    // Check availability
    _checkAvailability();

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Trip details set! You can now proceed to booking.'), backgroundColor: Colors.green),
    );
  }

  void _updateBookingData({TravelScope? travelScope, InsuranceOption? insurance, PaymentMethod? paymentMethod}) {
    if (!_hasTripData) return;

    setState(() {
      _bookingData = _bookingData!.copyWith(
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

    final car = _car ?? (_bookingData?.car ?? widget.arguments['car'] as Car);

    // Show availability warning if not available
    if (_availability != null && !_availability!.isAvailable && _hasTripData) {
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
          _isCheckingFavorite
              ? Padding(
                  padding: const EdgeInsets.all(16),
                  child: SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(AppStyles.primary),
                    ),
                  ),
                )
              : IconButton(
                  icon: Icon(
                    _isFavorited ? Icons.favorite : Icons.favorite_border,
                    color: _isFavorited ? Colors.red : null,
                  ),
                  onPressed: _isTogglingFavorite ? null : _toggleFavorite,
                ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            buildCarImage(images: car.images, height: 240),
            const SizedBox(height: 16),

            // ✅ NEW: Show trip setup section if no trip data
            if (!_hasTripData) ...[_buildTripSetupCard(), const SizedBox(height: 16)],

            // ✅ Availability indicator (only if has trip data)
            if (_hasTripData) ...[
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
              const SizedBox(height: 16),
            ],

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

            // ✅ Only show trip summary if we have booking data
            if (_hasTripData) ...[
              BuildTripSummary(bookingData: _bookingData!),
              const SizedBox(height: 24),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(color: AppStyles.surface(context), borderRadius: BorderRadius.circular(12)),
                child: Row(
                  children: [
                    Icon(_bookingData!.withDriver ? Icons.person : Icons.directions_car, color: AppStyles.primary),
                    const SizedBox(width: 12),
                    Text(_bookingData!.mode, style: AppStyles.h3(context).copyWith(color: AppStyles.primary)),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              TravelScopeSelector(
                selectedScope: _bookingData!.travelScope,
                onChanged: (scope) => _updateBookingData(travelScope: scope),
              ),
              const SizedBox(height: 24),
            ],

            OwnerInfoCard(
              ownerName: car.owner,
              ownerAvatarAsset: car.ownerAvatar,
              joinedDate: car.ownerJoinedDate,
              onViewCarsPressed: () {
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

            // ✅ Only show booking options if we have trip data
            if (_hasTripData) ...[
              InsuranceSelector(
                initialOption: _bookingData!.insurance,
                onChanged: (option) => _updateBookingData(insurance: option),
              ),
              const SizedBox(height: 24),
              PaymentMethodCard(
                initialMethod: _bookingData!.paymentMethod,
                onChanged: (method) => _updateBookingData(paymentMethod: method),
              ),
              const SizedBox(height: 24),
            ],

            if (_isLoadingReviews)
              const Center(
                child: Padding(padding: EdgeInsets.all(20), child: CircularProgressIndicator()),
              )
            else if (_reviewsResponse != null)
              ReviewsSection(
                reviews: _reviewsResponse!.reviews.map((r) {
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
      bottomNavigationBar: _hasTripData
          ? BookingBottomBar(
              pricePerDay: car.price,
              buttonText: 'Book Now',
              isLoading: false,
              onPressed: (_availability != null && !_availability!.isAvailable)
                  ? null
                  : () {
                      AppRoutes.navigateTo(context, AppRoutes.booking, arguments: _bookingData!.toMap());
                    },
            )
          : null,
    );
  }

  // ✅ NEW: Trip setup card
  Widget _buildTripSetupCard() {
    final hasLocation = _tempLocation != null;
    final hasDatetime = _tempDatetime != null;
    final isComplete = hasLocation && hasDatetime;

    return Card(
      color: AppStyles.primary.withOpacity(0.1),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: AppStyles.primary, width: 2),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.info_outline, color: AppStyles.primary),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Set your trip details to check availability',
                    style: AppStyles.h3(context).copyWith(color: AppStyles.primary),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Location button
            _buildSetupButton(
              icon: Icons.location_on,
              label: hasLocation ? _tempLocation! : 'Select Location',
              isSet: hasLocation,
              onTap: _selectLocation,
            ),
            const SizedBox(height: 12),

            // Date/Time button
            _buildSetupButton(
              icon: Icons.calendar_today,
              label: hasDatetime ? _tempDatetime! : 'Select Date & Time',
              isSet: hasDatetime,
              onTap: _selectDateTime,
            ),

            if (isComplete) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: Colors.green.shade50, borderRadius: BorderRadius.circular(8)),
                child: Row(
                  children: [
                    const Icon(Icons.check_circle, color: Colors.green, size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Trip details set! Scroll down to configure your booking.',
                        style: AppStyles.caption(context).copyWith(color: Colors.green.shade900),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildSetupButton({
    required IconData icon,
    required String label,
    required bool isSet,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppStyles.surface(context),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: isSet ? Colors.green : Colors.grey.shade300, width: isSet ? 2 : 1),
        ),
        child: Row(
          children: [
            Icon(icon, color: isSet ? Colors.green : AppStyles.textSecondary(context)),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                label,
                style: AppStyles.body(context).copyWith(
                  color: isSet ? AppStyles.textPrimary(context) : AppStyles.textSecondary(context),
                  fontWeight: isSet ? FontWeight.w600 : FontWeight.normal,
                ),
              ),
            ),
            Icon(
              isSet ? Icons.check_circle : Icons.arrow_forward_ios,
              color: isSet ? Colors.green : AppStyles.textSecondary(context),
              size: isSet ? 24 : 16,
            ),
          ],
        ),
      ),
    );
  }

  String _getMonthName(int month) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month - 1];
  }
}
