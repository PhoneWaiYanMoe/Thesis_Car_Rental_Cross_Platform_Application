
import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/utils/app_routes.dart';
import 'package:wiz/screens/Booking/models/booking_data.dart';

class PhotoSubmissionScreen extends StatefulWidget {
  final BookingData booking;
  final bool isStartJourney;

  const PhotoSubmissionScreen({
    super.key,
    required this.booking,
    required this.isStartJourney,
  });

  @override
  State<PhotoSubmissionScreen> createState() => _PhotoSubmissionScreenState();
}

class _PhotoSubmissionScreenState extends State<PhotoSubmissionScreen> {
  late BookingData updatedBooking;
  List<String?> photos = [null, null, null];

  @override
  void initState() {
    super.initState();
    updatedBooking = widget.booking;
  }

  bool get allPhotosUploaded => photos.every((p) => p != null);

  void capturePhoto(int index) {
    setState(() {
      photos[index] = 'Photo ${index + 1}';
    });
  }

  void submitPhotos() {
    if (!allPhotosUploaded) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please capture all 3 photos'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    // Update booking based on photo submission type
    if (widget.isStartJourney) {
      // Start journey photos - update to onJourney status
      updatedBooking = updatedBooking.copyWith(
        startPhotosSubmitted: true,
        status: BookingStatus.onJourney,
      );
    } else {
      // End journey photos - update to completed status
      updatedBooking = updatedBooking.copyWith(
        endPhotosSubmitted: true,
        status: BookingStatus.completed,
      );
    }

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Photos submitted successfully'),
        backgroundColor: Colors.green,
      ),
    );

    if (!widget.isStartJourney) {
      // End journey - navigate to rating (replace current screen)
      final result =  Navigator.pushNamed<BookingData>(
        context,
        AppRoutes.rateReview,
        arguments: {'booking': updatedBooking},
      );
      // If rating was submitted, go back to rental history/details with updated booking
      if (result != null) {
        Navigator.pop(context, result);
      }
    } else {
      // Start journey - go back to details screen with updated booking
      Navigator.pop(context, updatedBooking);
    }
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
        title: Text(
          widget.isStartJourney ? 'Submit Start Photos' : 'Submit End Photos',
          style: AppStyles.h2(context),
        ),
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
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Please take 3 photos of the car from different angles',
                    style: AppStyles.body(context),
                  ),
                  const SizedBox(height: 24),
                  ...List.generate(3, (index) {
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: _buildPhotoCard(index),
                    );
                  }),
                ],
              ),
            ),
          ),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppStyles.background(context),
              border: Border(
                top: BorderSide(
                  color: AppStyles.textSecondary(context).withOpacity(0.2),
                ),
              ),
            ),
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: AppStyles.primaryButtonStyle(context).copyWith(
                  backgroundColor: WidgetStateProperty.all(
                    allPhotosUploaded
                        ? AppStyles.primary
                        : AppStyles.primary.withOpacity(0.5),
                  ),
                ),
                onPressed: allPhotosUploaded ? submitPhotos : null,
                child: Text('Submit Photos', style: AppStyles.button),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPhotoCard(int index) {
    final hasPhoto = photos[index] != null;

    return Card(
      color: AppStyles.surface(context),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Photo ${index + 1}', style: AppStyles.h3(context)),
                if (hasPhoto)
                  const Icon(Icons.check_circle, color: Colors.green),
              ],
            ),
            const SizedBox(height: 12),
            if (hasPhoto)
              Stack(
                children: [
                  Container(
                    width: double.infinity,
                    height: 180,
                    decoration: BoxDecoration(
                      color: Colors.grey[800],
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Center(
                      child: Text(photos[index]!, style: AppStyles.body(context)),
                    ),
                  ),
                  Positioned(
                    top: 8,
                    right: 8,
                    child: IconButton(
                      onPressed: () {
                        setState(() {
                          photos[index] = null;
                        });
                      },
                      style: IconButton.styleFrom(
                        backgroundColor: Colors.red,
                      ),
                      icon: const Icon(Icons.close, color: Colors.white),
                    ),
                  ),
                ],
              )
            else
              GestureDetector(
                onTap: () => capturePhoto(index),
                child: Container(
                  width: double.infinity,
                  height: 180,
                  decoration: BoxDecoration(
                    border: Border.all(
                      color: AppStyles.textSecondary(context).withOpacity(0.3),
                      width: 2,
                    ),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.camera_alt,
                        size: 48,
                        color: AppStyles.textSecondary(context),
                      ),
                      const SizedBox(height: 8),
                      Text('Tap to capture', style: AppStyles.caption(context)),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
