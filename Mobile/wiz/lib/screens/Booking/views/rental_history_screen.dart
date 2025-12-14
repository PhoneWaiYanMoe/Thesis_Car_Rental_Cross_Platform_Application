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
  final List<BookingData> bookings = BookingData.getSampleBookings();

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
              decoration: AppStyles.inputDecoration(
                hint: 'Search',
                icon: Icons.search,
                context: context,
              ),
            ),
          ),
          Expanded(
            child: ListView.builder(
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
                    decoration: BoxDecoration(
                      color: AppStyles.surface(context),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
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
                              child: Image.asset(
                                booking.carImage,
                                width: 80,
                                height: 80,
                                fit: BoxFit.cover,
                              ),
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
                                        style: AppStyles.body(context).copyWith(
                                          color: AppStyles.primary,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                      Text(
                                        booking.duration ?? 'N/A',
                                        style: AppStyles.caption(context),
                                      ),
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
            ),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }
}
