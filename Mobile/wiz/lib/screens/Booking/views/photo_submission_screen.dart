import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/screens/Booking/services/booking_api_service.dart';

/// Photo Submission Screen for pickup/return photos
/// Receives arguments:
/// - bookingId: String
/// - isStartJourney: bool (true = pickup, false = return)
class PhotoSubmissionScreen extends StatefulWidget {
  final String bookingId;
  final bool isStartJourney;

  const PhotoSubmissionScreen({super.key, required this.bookingId, required this.isStartJourney});

  // Factory constructor for route arguments
  factory PhotoSubmissionScreen.fromArgs(Map<String, dynamic> args) {
    return PhotoSubmissionScreen(
      bookingId: args['bookingId'] as String,
      isStartJourney: args['isStartJourney'] as bool,
    );
  }

  @override
  State<PhotoSubmissionScreen> createState() => _PhotoSubmissionScreenState();
}

class _PhotoSubmissionScreenState extends State<PhotoSubmissionScreen> {
  final BookingApiService _bookingApi = BookingApiService();
  final ImagePicker _picker = ImagePicker();

  List<File?> photos = [null, null, null];
  bool _isSubmitting = false;

  // Odometer reading
  final TextEditingController _odometerController = TextEditingController();
  final TextEditingController _notesController = TextEditingController();

  @override
  void dispose() {
    _odometerController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  bool get allPhotosUploaded => photos.every((p) => p != null);
  bool get canSubmit => allPhotosUploaded && _odometerController.text.isNotEmpty;

  Future<void> _capturePhoto(int index) async {
    try {
      // Show options: Camera or Gallery
      final source = await showModalBottomSheet<ImageSource>(
        context: context,
        builder: (context) => Container(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.camera_alt),
                title: const Text('Take Photo'),
                onTap: () => Navigator.pop(context, ImageSource.camera),
              ),
              ListTile(
                leading: const Icon(Icons.photo_library),
                title: const Text('Choose from Gallery'),
                onTap: () => Navigator.pop(context, ImageSource.gallery),
              ),
            ],
          ),
        ),
      );

      if (source == null) return;

      final XFile? image = await _picker.pickImage(source: source, maxWidth: 1920, maxHeight: 1080, imageQuality: 85);

      if (image != null) {
        setState(() {
          photos[index] = File(image.path);
        });
      }
    } catch (e) {
      print('❌ Error capturing photo: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to capture photo: $e')));
      }
    }
  }

  Future<void> _submitPhotos() async {
    if (!canSubmit) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please capture all 3 photos and enter odometer reading'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    try {
      final odometerReading = int.parse(_odometerController.text);
      final photoFiles = photos.whereType<File>().toList();
      final notes = _notesController.text.isNotEmpty ? _notesController.text : null;

      if (widget.isStartJourney) {
        // Submit pickup photos
        await _bookingApi.confirmPickup(
          bookingId: widget.bookingId,
          pickupPhotos: photoFiles,
          odometerReading: odometerReading,
          notes: notes,
        );
      } else {
        // Submit return photos
        await _bookingApi.confirmReturn(
          bookingId: widget.bookingId,
          returnPhotos: photoFiles,
          odometerReading: odometerReading,
          notes: notes,
        );
      }

      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Photos submitted successfully'), backgroundColor: Colors.green));

        // Go back and reload booking details
        Navigator.pop(context, true);
      }
    } catch (e) {
      setState(() {
        _isSubmitting = false;
      });

      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Failed to submit photos: $e'), backgroundColor: Colors.red));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppStyles.background(context),
      appBar: AppBar(
        leading: IconButton(icon: const Icon(Icons.arrow_back), onPressed: () => Navigator.pop(context)),
        title: Text(
          widget.isStartJourney ? 'Submit Pickup Photos' : 'Submit Return Photos',
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
                  Text('Please take 3 photos of the car from different angles', style: AppStyles.body(context)),
                  const SizedBox(height: 24),

                  // Photo cards
                  ...List.generate(3, (index) {
                    return Padding(padding: const EdgeInsets.only(bottom: 16), child: _buildPhotoCard(index));
                  }),

                  const SizedBox(height: 24),

                  // Odometer reading
                  Text('Odometer Reading (km)', style: AppStyles.h3(context)),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _odometerController,
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(
                      hintText: 'Enter current odometer reading',
                      filled: true,
                      fillColor: AppStyles.surface(context),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                    ),
                    style: AppStyles.body(context),
                  ),

                  const SizedBox(height: 24),

                  // Optional notes
                  Text('Additional Notes (Optional)', style: AppStyles.h3(context)),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _notesController,
                    maxLines: 4,
                    decoration: InputDecoration(
                      hintText: 'Any damages, issues, or comments...',
                      filled: true,
                      fillColor: AppStyles.surface(context),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                    ),
                    style: AppStyles.body(context),
                  ),
                ],
              ),
            ),
          ),

          // Submit button
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppStyles.background(context),
              border: Border(top: BorderSide(color: AppStyles.textSecondary(context).withOpacity(0.2))),
            ),
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: AppStyles.primaryButtonStyle(context).copyWith(
                  backgroundColor: WidgetStateProperty.all(
                    canSubmit && !_isSubmitting ? AppStyles.primary : AppStyles.primary.withOpacity(0.5),
                  ),
                ),
                onPressed: canSubmit && !_isSubmitting ? _submitPhotos : null,
                child: _isSubmitting
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : Text('Submit Photos', style: AppStyles.button),
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
                if (hasPhoto) const Icon(Icons.check_circle, color: Colors.green),
              ],
            ),
            const SizedBox(height: 12),

            if (hasPhoto)
              Stack(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: Image.file(photos[index]!, width: double.infinity, height: 180, fit: BoxFit.cover),
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
                      style: IconButton.styleFrom(backgroundColor: Colors.red),
                      icon: const Icon(Icons.close, color: Colors.white),
                    ),
                  ),
                ],
              )
            else
              GestureDetector(
                onTap: () => _capturePhoto(index),
                child: Container(
                  width: double.infinity,
                  height: 180,
                  decoration: BoxDecoration(
                    border: Border.all(
                      color: AppStyles.textSecondary(context).withOpacity(0.3),
                      width: 2,
                      style: BorderStyle.solid,
                    ),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.camera_alt, size: 48, color: AppStyles.textSecondary(context)),
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
