import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/screens/Booking/models/booking_data.dart';

class RateReviewScreen extends StatefulWidget {
  final BookingData booking;

  const RateReviewScreen({super.key, required this.booking});

  @override
  State<RateReviewScreen> createState() => _RateReviewScreenState();
}

class _RateReviewScreenState extends State<RateReviewScreen> {
  int rating = 0;
  final TextEditingController _reviewController = TextEditingController();

  void submitRating() {
    if (rating == 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select a rating'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    // Update booking with rating
    final updatedBooking = widget.booking.copyWith(rated: true);

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Rating submitted successfully'),
        backgroundColor: Colors.green,
      ),
    );

    // Go back to details screen with updated booking
    Navigator.pop(context, updatedBooking);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppStyles.background(context),
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text('Rate and Review', style: AppStyles.h2(context)),
        centerTitle: true,
        backgroundColor: AppStyles.background(context),
        elevation: 0,
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  const SizedBox(height: 32),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(5, (index) {
                      return GestureDetector(
                        onTap: () {
                          setState(() {
                            rating = index + 1;
                          });
                        },
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 8),
                          child: Icon(
                            index < rating ? Icons.star : Icons.star_border,
                            size: 48,
                            color: Colors.amber,
                          ),
                        ),
                      );
                    }),
                  ),
                  const SizedBox(height: 48),
                  TextField(
                    controller: _reviewController,
                    maxLines: 8,
                    decoration: InputDecoration(
                      hintText: 'Write review here',
                      filled: true,
                      fillColor: AppStyles.surface(context),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                    ),
                    style: AppStyles.body(context),
                  ),
                ],
              ),
            ),
          ),
          Container(
            padding: const EdgeInsets.all(16),
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: AppStyles.primaryButtonStyle(context),
                onPressed: submitRating,
                child: Text('Rate', style: AppStyles.button),
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _reviewController.dispose();
    super.dispose();
  }
}