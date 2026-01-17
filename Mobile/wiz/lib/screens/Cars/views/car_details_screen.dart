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
import 'package:wiz/screens/Cars/views/widgets/_buildRules.dart';
import 'package:wiz/screens/Cars/views/widgets/_buildTravelScope.dart';
import 'package:wiz/screens/Cars/views/widgets/_buildTripSummary.dart';
import 'package:wiz/screens/Home/views/dateTime_screen.dart';
import 'package:wiz/screens/Location/views/map_screen.dart';
import 'package:wiz/utils/app_routes.dart';
import 'widgets/_buildCarImage.dart';
import 'package:wiz/screens/Booking/models/booking_data.dart';
import 'package:wiz/services/media_api_service.dart';

class ReviewItemWidget extends StatefulWidget {
  final Map<String, dynamic> review;

  const ReviewItemWidget({super.key, required this.review});

  @override
  State<ReviewItemWidget> createState() => _ReviewItemWidgetState();
}

class _ReviewItemWidgetState extends State<ReviewItemWidget> {
  final _mediaApiService = MediaApiService();
  List<String> _photoUrls = [];
  bool _isLoadingPhotos = false;

  @override
  void initState() {
    super.initState();
    _loadReviewPhotos();
  }

  Future<void> _loadReviewPhotos() async {
    final photoIds = widget.review['photos'] as List<dynamic>? ?? [];

    if (photoIds.isEmpty) return;

    setState(() {
      _isLoadingPhotos = true;
    });

    try {
      List<String> urls = [];

      for (final photoId in photoIds) {
        try {
          final photoFile = await _mediaApiService.getFileById(photoId.toString());
          urls.add(photoFile.url);
          print('✅ Review photo loaded: ${photoFile.url}');
        } catch (e) {
          print('❌ Failed to load review photo $photoId: $e');
        }
      }

      if (mounted) {
        setState(() {
          _photoUrls = urls;
          _isLoadingPhotos = false;
        });
      }
    } catch (e) {
      print('❌ Error loading review photos: $e');
      if (mounted) {
        setState(() {
          _isLoadingPhotos = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final rating = (widget.review['rating'] as num?)?.toInt() ?? 0;
    final comment = widget.review['comment'] as String? ?? '';
    final reviewerName =
        widget.review['reviewerName'] as String? ?? (widget.review['user']?['name'] as String?) ?? 'Anonymous';
    final reviewerAvatar = widget.review['reviewerAvatar'] as String? ?? (widget.review['user']?['avatar'] as String?);
    final createdAt = widget.review['createdAt'] as String?;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppStyles.surface(context),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Reviewer Info & Rating
          Row(
            children: [
              // Avatar
              CircleAvatar(
                radius: 20,
                backgroundImage: reviewerAvatar != null && reviewerAvatar.isNotEmpty
                    ? NetworkImage(reviewerAvatar)
                    : null,
                backgroundColor: AppStyles.primary.withOpacity(0.1),
                child: reviewerAvatar == null || reviewerAvatar.isEmpty
                    ? Text(
                        reviewerName[0].toUpperCase(),
                        style: TextStyle(color: AppStyles.primary, fontWeight: FontWeight.bold),
                      )
                    : null,
              ),
              const SizedBox(width: 12),

              // Name & Date
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(reviewerName, style: AppStyles.body(context).copyWith(fontWeight: FontWeight.w600)),
                    if (createdAt != null) ...[
                      const SizedBox(height: 2),
                      Text(_formatDate(createdAt), style: AppStyles.caption(context)),
                    ],
                  ],
                ),
              ),

              // Star Rating
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(color: Colors.amber.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
                child: Row(
                  children: [
                    Icon(Icons.star, color: Colors.amber, size: 16),
                    const SizedBox(width: 4),
                    Text(
                      rating.toString(),
                      style: AppStyles.body(
                        context,
                      ).copyWith(fontWeight: FontWeight.bold, color: Colors.amber.shade700),
                    ),
                  ],
                ),
              ),
            ],
          ),

          // Review Comment
          if (comment.isNotEmpty) ...[const SizedBox(height: 12), Text(comment, style: AppStyles.body(context))],

          // Review Photos
          if (_isLoadingPhotos) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(8)),
              child: Row(
                children: [
                  const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)),
                  const SizedBox(width: 12),
                  Text('Loading photos...', style: AppStyles.caption(context)),
                ],
              ),
            ),
          ] else if (_photoUrls.isNotEmpty) ...[
            const SizedBox(height: 12),
            SizedBox(
              height: 80,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: _photoUrls.length,
                itemBuilder: (context, index) {
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: GestureDetector(
                      onTap: () => _showPhotoDialog(_photoUrls, index),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Image.network(
                          _photoUrls[index],
                          width: 80,
                          height: 80,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) {
                            return Container(
                              width: 80,
                              height: 80,
                              color: Colors.grey.shade300,
                              child: Icon(Icons.broken_image, color: Colors.grey),
                            );
                          },
                          loadingBuilder: (context, child, loadingProgress) {
                            if (loadingProgress == null) return child;
                            return Container(
                              width: 80,
                              height: 80,
                              color: Colors.grey.shade200,
                              child: Center(
                                child: CircularProgressIndicator(
                                  value: loadingProgress.expectedTotalBytes != null
                                      ? loadingProgress.cumulativeBytesLoaded / loadingProgress.expectedTotalBytes!
                                      : null,
                                  strokeWidth: 2,
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ],
      ),
    );
  }

  void _showPhotoDialog(List<String> urls, int initialIndex) {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: Colors.black,
        insetPadding: EdgeInsets.zero,
        child: Stack(
          children: [
            PageView.builder(
              itemCount: urls.length,
              controller: PageController(initialPage: initialIndex),
              itemBuilder: (context, index) {
                return InteractiveViewer(
                  minScale: 0.5,
                  maxScale: 4.0,
                  child: Center(
                    child: Image.network(
                      urls[index],
                      fit: BoxFit.contain,
                      errorBuilder: (context, error, stackTrace) {
                        return Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.error_outline, color: Colors.white, size: 48),
                              const SizedBox(height: 16),
                              Text('Failed to load image', style: TextStyle(color: Colors.white)),
                            ],
                          ),
                        );
                      },
                      loadingBuilder: (context, child, loadingProgress) {
                        if (loadingProgress == null) return child;
                        return Center(
                          child: CircularProgressIndicator(
                            value: loadingProgress.expectedTotalBytes != null
                                ? loadingProgress.cumulativeBytesLoaded / loadingProgress.expectedTotalBytes!
                                : null,
                            color: Colors.white,
                          ),
                        );
                      },
                    ),
                  ),
                );
              },
            ),
            Positioned(
              top: 40,
              right: 16,
              child: IconButton(
                icon: const Icon(Icons.close, color: Colors.white, size: 32),
                onPressed: () => Navigator.pop(context),
              ),
            ),
            Positioned(
              top: 40,
              left: 16,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(color: Colors.black54, borderRadius: BorderRadius.circular(20)),
                child: Text(
                  '${initialIndex + 1}/${urls.length}',
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      final now = DateTime.now();
      final difference = now.difference(date);
      if (difference.inDays == 0) {
        return 'Today';
      } else if (difference.inDays == 1) {
        return 'Yesterday';
      } else if (difference.inDays < 7) {
        return '${difference.inDays} days ago';
      } else if (difference.inDays < 30) {
        final weeks = (difference.inDays / 7).floor();
        return '$weeks ${weeks == 1 ? 'week' : 'weeks'} ago';
      } else if (difference.inDays < 365) {
        final months = (difference.inDays / 30).floor();
        return '$months ${months == 1 ? 'month' : 'months'} ago';
      } else {
        return '${date.day}/${date.month}/${date.year}';
      }
    } catch (e) {
      return dateStr;
    }
  }
}

class CarDetailsScreen extends StatefulWidget {
  final Map<String, dynamic> arguments;

  const CarDetailsScreen({super.key, required this.arguments});

  @override
  State<CarDetailsScreen> createState() => _CarDetailsScreenState();
}

class _CarDetailsScreenState extends State<CarDetailsScreen> {
  final VehicleApiService _apiService = VehicleApiService();
  final ReviewApiService _reviewApiService = ReviewApiService();

  BookingData? _bookingData;
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

  bool get _hasTripData => _bookingData != null;

  String? _tempLocation;
  String? _tempCity;
  String? _tempDistrict;
  String? _tempPickup;
  String? _tempPickupCity;
  String? _tempPickupDistrict;
  String? _tempDestination;
  String? _tempDestinationCity;
  String? _tempDestinationDistrict;
  String? _tempDatetime;
  bool _tempWithDriver = false;
  int _selectedDriveMode = 0;

  @override
  void initState() {
    super.initState();

    try {
      _bookingData = BookingData.fromMap(widget.arguments);
      _tempWithDriver = _bookingData!.withDriver;
      _selectedDriveMode = _tempWithDriver ? 1 : 0;
    } catch (e) {
      print('⚠️ No complete trip data available: $e');
      _bookingData = null;
      if (widget.arguments.containsKey('withDriver')) {
        _tempWithDriver = widget.arguments['withDriver'] as bool;
        _selectedDriveMode = _tempWithDriver ? 1 : 0;
      }
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

      try {
        final vehicleDetails = await _apiService.getVehicleDetails(car.id);
        car = vehicleDetails.toCar();
        print('✅ Fetched fresh vehicle details from API');
      } catch (e) {
        print('⚠️ Failed to fetch fresh details, using cached car: $e');
      }

      _car = car;

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

  void _handleDriveModeChange(int index) {
    setState(() {
      _selectedDriveMode = index;
      _tempWithDriver = index == 1;

      if (_tempWithDriver) {
        _tempLocation = null;
        _tempCity = null;
        _tempDistrict = null;
      } else {
        _tempPickup = null;
        _tempPickupCity = null;
        _tempPickupDistrict = null;
        _tempDestination = null;
        _tempDestinationCity = null;
        _tempDestinationDistrict = null;
      }
    });

    print('🔄 Drive mode changed to: ${_tempWithDriver ? "With Driver" : "Self Drive"}');
  }

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
      _tryCreateBookingData();
    }
  }

  Future<void> _selectPickup() async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => MapScreen(title: 'Pickup Location')),
    );

    if (result != null && result is Map<String, dynamic>) {
      setState(() {
        _tempPickup = result['address'] as String?;
        _tempPickupCity = result['city'] as String?;
        _tempPickupDistrict = result['district'] as String?;
      });

      print('✅ Selected pickup: $_tempPickup');
      _tryCreateBookingData();
    }
  }

  Future<void> _selectDestination() async {
    final result = await Navigator.push(context, MaterialPageRoute(builder: (_) => MapScreen(title: 'Destination')));

    if (result != null && result is Map<String, dynamic>) {
      setState(() {
        _tempDestination = result['address'] as String?;
        _tempDestinationCity = result['city'] as String?;
        _tempDestinationDistrict = result['district'] as String?;
      });

      print('✅ Selected destination: $_tempDestination');
      _tryCreateBookingData();
    }
  }

  Future<void> _selectDateTime() async {
    final result = await Navigator.push(context, MaterialPageRoute(builder: (_) => const DateTimeScreen()));

    if (result != null && result is Map<String, dynamic>) {
      setState(() {
        _tempDatetime = result['datetime'] as String?;
      });

      print('✅ Selected datetime: $_tempDatetime');
      _tryCreateBookingData();
    }
  }

  void _tryCreateBookingData() {
    if (_car == null || _tempDatetime == null) return;

    bool hasRequiredData = false;

    if (_tempWithDriver) {
      hasRequiredData = _tempPickup != null && _tempDestination != null;
    } else {
      hasRequiredData = _tempLocation != null;
    }

    if (!hasRequiredData) return;

    final tripData = <String, dynamic>{
      'mode': _tempWithDriver ? 'With Driver' : 'Self Drive',
      'withDriver': _tempWithDriver,
      'datetime': _tempDatetime!,
      'car': _car!,
      'carIndex': 0,
    };

    if (_tempWithDriver) {
      if (_tempPickup != null) tripData['pickup'] = _tempPickup!;
      if (_tempPickupCity != null) tripData['pickupCity'] = _tempPickupCity!;
      if (_tempPickupDistrict != null) tripData['pickupDistrict'] = _tempPickupDistrict!;
      if (_tempDestination != null) tripData['destination'] = _tempDestination!;
      if (_tempDestinationCity != null) tripData['destinationCity'] = _tempDestinationCity!;
      if (_tempDestinationDistrict != null) tripData['destinationDistrict'] = _tempDestinationDistrict!;
    } else {
      if (_tempLocation != null) tripData['location'] = _tempLocation!;
      if (_tempCity != null) tripData['city'] = _tempCity!;
      if (_tempDistrict != null) tripData['district'] = _tempDistrict!;
    }

    setState(() {
      _bookingData = BookingData.fromMap(tripData);
    });

    print('✅ Created booking data in ${_tempWithDriver ? "With Driver" : "Self Drive"} mode');

    _checkAvailability();
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

            if (!_hasTripData) ...[_buildTripSetupCard(), const SizedBox(height: 16)],

            if (_hasTripData) ...[
              if (_isCheckingAvailability)
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.blue.shade50,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.blue.shade300),
                  ),
                  child: Row(
                    children: [
                      const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)),
                      const SizedBox(width: 12),
                      Expanded(child: Text('Checking availability...', style: AppStyles.caption(context))),
                    ],
                  ),
                )
              else if (_availability != null)
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: _availability!.isAvailable ? Colors.green.shade50 : Colors.red.shade50,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: _availability!.isAvailable ? Colors.green.shade300 : Colors.red.shade300,
                      width: 2,
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        _availability!.isAvailable ? Icons.check_circle : Icons.cancel,
                        color: _availability!.isAvailable ? Colors.green : Colors.red,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _availability!.isAvailable ? 'Available' : 'Not Available',
                              style: AppStyles.h3(context).copyWith(
                                color: _availability!.isAvailable ? Colors.green.shade900 : Colors.red.shade900,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              _availability!.message,
                              style: AppStyles.caption(context).copyWith(
                                color: _availability!.isAvailable ? Colors.green.shade800 : Colors.red.shade800,
                              ),
                            ),
                            if (!_availability!.isAvailable && _availability!.unavailablePeriods.isNotEmpty) ...[
                              const SizedBox(height: 8),
                              Text(
                                'Unavailable dates:',
                                style: AppStyles.caption(
                                  context,
                                ).copyWith(fontWeight: FontWeight.bold, color: Colors.red.shade900),
                              ),
                              const SizedBox(height: 4),
                              ..._availability!.unavailablePeriods.map(
                                (period) => Padding(
                                  padding: const EdgeInsets.only(left: 8, top: 2),
                                  child: Text(
                                    '• ${period.startDate} to ${period.endDate}',
                                    style: AppStyles.caption(
                                      context,
                                    ).copyWith(fontSize: 12, color: Colors.red.shade800),
                                  ),
                                ),
                              ),
                            ],
                          ],
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

            // ──────────────────────────────────────────────
            //                REVIEWS SECTION
            // ──────────────────────────────────────────────
            if (_isLoadingReviews)
              const Center(
                child: Padding(padding: EdgeInsets.all(32), child: CircularProgressIndicator()),
              )
            else ...[
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Reviews', style: AppStyles.h2(context)),
                    if (_reviewsResponse != null)
                      Text(
                        '${_reviewsResponse!.reviews.length} review${_reviewsResponse!.reviews.length != 1 ? 's' : ''}',
                        style: AppStyles.caption(context),
                      ),
                  ],
                ),
              ),
              if (_reviewsResponse == null || _reviewsResponse!.reviews.isEmpty)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 32),
                  child: Center(
                    child: Text('No reviews yet.', style: TextStyle(fontSize: 16, color: Colors.grey)),
                  ),
                )
              else
                Column(
                  children: _reviewsResponse!.reviews.map((review) {
                    return ReviewItemWidget(
                      review: {
                        'rating': review.rating,
                        'comment': review.comment,
                        'createdAt': review.createdAt,
                        'reviewerName': review.user?.name ?? 'Anonymous',
                        'reviewerAvatar': review.user?.avatar,
                        'photos': review.photos ?? [],
                      },
                    );
                  }).toList(),
                ),
            ],

            const SizedBox(height: 32),
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

  Widget _buildTripSetupCard() {
    final hasRequiredLocation = _tempWithDriver
        ? (_tempPickup != null && _tempDestination != null)
        : _tempLocation != null;
    final hasDatetime = _tempDatetime != null;
    final isComplete = hasRequiredLocation && hasDatetime;

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

            _buildDriveModeToggle(),
            const SizedBox(height: 16),

            if (!_tempWithDriver) ...[
              _buildSetupButton(
                icon: Icons.location_on,
                label: _tempLocation ?? 'Select Location',
                isSet: _tempLocation != null,
                onTap: _selectLocation,
              ),
            ] else ...[
              _buildSetupButton(
                icon: Icons.pin_drop,
                label: _tempPickup ?? 'Pickup Location',
                isSet: _tempPickup != null,
                onTap: _selectPickup,
              ),
              const SizedBox(height: 12),
              _buildSetupButton(
                icon: Icons.flag,
                label: _tempDestination ?? 'Destination',
                isSet: _tempDestination != null,
                onTap: _selectDestination,
              ),
            ],
            const SizedBox(height: 12),

            _buildSetupButton(
              icon: Icons.calendar_today,
              label: _tempDatetime ?? 'Select Date & Time',
              isSet: _tempDatetime != null,
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

  Widget _buildDriveModeToggle() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
      decoration: BoxDecoration(color: AppStyles.surface(context), borderRadius: BorderRadius.circular(12)),
      child: Row(
        children: [
          _buildDriveModeButton('Self Drive', 0, Icons.directions_car),
          _buildDriveModeButton('With Driver', 1, Icons.person),
        ],
      ),
    );
  }

  Widget _buildDriveModeButton(String text, int index, IconData icon) {
    final isSelected = _selectedDriveMode == index;
    return Expanded(
      child: GestureDetector(
        onTap: () => _handleDriveModeChange(index),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: isSelected ? AppStyles.primary : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 18, color: isSelected ? Colors.white : AppStyles.textSecondary(context)),
              const SizedBox(width: 6),
              Text(
                text,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: isSelected ? Colors.white : AppStyles.textSecondary(context),
                ),
              ),
            ],
          ),
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
}
