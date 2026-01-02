// Mobile/wiz/lib/screens/Booking/views/rental_history_screen.dart
import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/screens/Booking/models/booking_data.dart';
import 'package:wiz/screens/Booking/views/rental_details_screen.dart';
import 'package:wiz/utils/app_routes.dart';

class RentalHistoryScreen extends StatefulWidget {
  const RentalHistoryScreen({super.key});

  @override
  State<RentalHistoryScreen> createState() => _RentalHistoryScreenState();
}

class _RentalHistoryScreenState extends State<RentalHistoryScreen> {
  final TextEditingController _searchController = TextEditingController();

  // ✅ CHANGED: Start with empty list
  List<BookingData> bookings = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadBookings();
  }

  // ✅ NEW: Load bookings from backend
  Future<void> _loadBookings() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      // TODO: Implement API call to get user's bookings
      // final bookingService = BookingApiService();
      // final fetchedBookings = await bookingService.getMyBookings();

      // For now, show empty state
      setState(() {
        bookings = [];
        _isLoading = false;
      });

      print('📋 Loaded ${bookings.length} bookings from backend');
    } catch (e) {
      print('❌ Error loading bookings: $e');
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppStyles.background(context),
      appBar: AppBar(
        title: Text('Rental History', style: AppStyles.h2(context)),
        centerTitle: true,
        backgroundColor: AppStyles.background(context),
        elevation: 0,
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _searchController,
              decoration: AppStyles.inputDecoration(hint: 'Search', icon: Icons.search, context: context),
            ),
          ),

          // ✅ NEW: Handle loading, error, and empty states
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                ? _buildErrorState()
                : bookings.isEmpty
                ? _buildEmptyState()
                : _buildBookingsList(),
          ),
        ],
      ),
    );
  }

  // ✅ NEW: Empty state
  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.history, size: 64, color: AppStyles.textSecondary(context).withOpacity(0.5)),
          const SizedBox(height: 16),
          Text('No bookings yet', style: AppStyles.h3(context)),
          const SizedBox(height: 8),
          Text('Your rental history will appear here', style: AppStyles.caption(context)),
          const SizedBox(height: 24),
          ElevatedButton(
            style: AppStyles.primaryButtonStyle(context),
            onPressed: () {
              Navigator.pop(context);
            },
            child: const Text('Browse Cars'),
          ),
        ],
      ),
    );
  }

  // ✅ NEW: Error state
  Widget _buildErrorState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error_outline, size: 64, color: Colors.red.withOpacity(0.5)),
          const SizedBox(height: 16),
          Text('Failed to load bookings', style: AppStyles.body(context)),
          Text(_error ?? 'Unknown error', style: AppStyles.caption(context)),
          const SizedBox(height: 24),
          ElevatedButton(
            style: AppStyles.primaryButtonStyle(context),
            onPressed: _loadBookings,
            child: const Text('Retry'),
          ),
        ],
      ),
    );
  }

  // ✅ Existing bookings list
  Widget _buildBookingsList() {
    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      itemCount: bookings.length,
      itemBuilder: (context, index) {
        final booking = bookings[index];
        return GestureDetector(
          onTap: () {
            AppRoutes.navigateToRentalDetails(context, booking);
          },
          child: Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: AppStyles.surface(context), borderRadius: BorderRadius.circular(16)),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: (booking.status ?? BookingStatus.pending).color.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    (booking.status ?? BookingStatus.pending).displayName,
                    style: TextStyle(
                      color: (booking.status ?? BookingStatus.pending).color,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Image.asset(booking.carImage, width: 80, height: 80, fit: BoxFit.cover),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(booking.carName, style: AppStyles.h3(context)),
                          const SizedBox(height: 4),
                          Text(booking.date ?? 'No date', style: AppStyles.caption(context)),
                          const SizedBox(height: 8),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                booking.price ?? 'N/A',
                                style: AppStyles.body(
                                  context,
                                ).copyWith(color: AppStyles.primary, fontWeight: FontWeight.bold),
                              ),
                              Text(booking.duration ?? 'N/A', style: AppStyles.caption(context)),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }
}
