import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/screens/Booking/services/booking_api_service.dart';

class PhotoSubmissionScreen extends StatefulWidget {
  final String bookingId;
  final bool isStartJourney;

  const PhotoSubmissionScreen({super.key, required this.bookingId, required this.isStartJourney});

  @override
  State<PhotoSubmissionScreen> createState() => _PhotoSubmissionScreenState();
}

class _PhotoSubmissionScreenState extends State<PhotoSubmissionScreen> {
  final BookingApiService _bookingApi = BookingApiService();
  final ImagePicker _picker = ImagePicker();
  final TextEditingController _odometerController = TextEditingController();
  final TextEditingController _notesController = TextEditingController();

  List<File> _photos = [];
  bool _isSubmitting = false;

  @override
  void dispose() {
    _odometerController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final XFile? image = await _picker.pickImage(source: source, maxWidth: 1920, maxHeight: 1080, imageQuality: 85);

      if (image != null) {
        setState(() {
          _photos.add(File(image.path));
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Failed to pick image: $e'), backgroundColor: Colors.red));
      }
    }
  }

  void _showImageSourceDialog() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.camera_alt, color: Colors.blue),
                title: const Text('Take Photo'),
                onTap: () {
                  Navigator.pop(context);
                  _pickImage(ImageSource.camera);
                },
              ),
              ListTile(
                leading: const Icon(Icons.photo_library, color: Colors.green),
                title: const Text('Choose from Gallery'),
                onTap: () {
                  Navigator.pop(context);
                  _pickImage(ImageSource.gallery);
                },
              ),
              ListTile(
                leading: const Icon(Icons.close, color: Colors.grey),
                title: const Text('Cancel'),
                onTap: () => Navigator.pop(context),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _removePhoto(int index) {
    setState(() {
      _photos.removeAt(index);
    });
  }

  Future<void> _submitPhotos() async {
    // Validate photos
    if (_photos.length < 3) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Please take at least 3 photos'), backgroundColor: Colors.orange));
      return;
    }

    // Validate odometer reading
    final odometerReading = int.tryParse(_odometerController.text);
    if (odometerReading == null || odometerReading <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid odometer reading'), backgroundColor: Colors.orange),
      );
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    try {
      print('📸 Submitting ${_photos.length} photos for booking: ${widget.bookingId}');
      print('   Is Start Journey: ${widget.isStartJourney}');
      print('   Odometer: $odometerReading');

      if (widget.isStartJourney) {
        // ✅ PICKUP CONFIRMATION
        await _bookingApi.confirmPickup(
          bookingId: widget.bookingId,
          pickupPhotos: _photos,
          odometerReading: odometerReading,
          notes: _notesController.text,
        );

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('✅ Pickup confirmed successfully!'), backgroundColor: Colors.green),
          );

          // Go back to rental details
          Navigator.pop(context);
        }
      } else {
        // ✅ RETURN CONFIRMATION
        await _bookingApi.confirmReturn(
          bookingId: widget.bookingId,
          returnPhotos: _photos,
          odometerReading: odometerReading,
          notes: _notesController.text,
        );

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('✅ Return submitted successfully! Waiting for owner confirmation.'),
              backgroundColor: Colors.green,
            ),
          );

          // Go back to rental details
          Navigator.pop(context);
        }
      }
    } catch (e) {
      print('❌ Photo submission error: $e');
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Failed to submit: $e'), backgroundColor: Colors.red));
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppStyles.background(context),
      appBar: AppBar(
        title: Text(widget.isStartJourney ? 'Confirm Pickup' : 'Confirm Return', style: AppStyles.h2(context)),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Instructions Card
            Card(
              color: AppStyles.primary.withOpacity(0.1),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.info_outline, color: AppStyles.primary),
                        const SizedBox(width: 8),
                        Text('Instructions', style: AppStyles.h3(context).copyWith(color: AppStyles.primary)),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      '• Take at least 3 clear photos of the vehicle\n'
                      '• Capture different angles (front, sides, back)\n'
                      '• Include any existing damage or issues\n'
                      '• Enter the current odometer reading',
                      style: AppStyles.body(context),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 24),

            // Photos Section
            Text('Vehicle Photos (${_photos.length}/3+)', style: AppStyles.h3(context)),
            const SizedBox(height: 12),

            // Photo Grid
            if (_photos.isNotEmpty)
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 3,
                  crossAxisSpacing: 8,
                  mainAxisSpacing: 8,
                ),
                itemCount: _photos.length,
                itemBuilder: (context, index) {
                  return Stack(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Image.file(
                          _photos[index],
                          width: double.infinity,
                          height: double.infinity,
                          fit: BoxFit.cover,
                        ),
                      ),
                      Positioned(
                        top: 4,
                        right: 4,
                        child: GestureDetector(
                          onTap: () => _removePhoto(index),
                          child: Container(
                            padding: const EdgeInsets.all(4),
                            decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle),
                            child: const Icon(Icons.close, color: Colors.white, size: 16),
                          ),
                        ),
                      ),
                    ],
                  );
                },
              ),

            const SizedBox(height: 12),

            // Add Photo Button
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: _showImageSourceDialog,
                icon: const Icon(Icons.add_a_photo),
                label: const Text('Add Photo'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppStyles.primary,
                  side: BorderSide(color: AppStyles.primary),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
              ),
            ),

            const SizedBox(height: 24),

            // Odometer Reading
            Text('Odometer Reading *', style: AppStyles.h3(context)),
            const SizedBox(height: 12),
            TextField(
              controller: _odometerController,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                hintText: 'Enter current odometer reading (km)',
                prefixIcon: const Icon(Icons.speed),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                filled: true,
                fillColor: AppStyles.surface(context),
              ),
            ),

            const SizedBox(height: 24),

            // Additional Notes
            Text('Additional Notes (Optional)', style: AppStyles.h3(context)),
            const SizedBox(height: 12),
            TextField(
              controller: _notesController,
              maxLines: 4,
              decoration: InputDecoration(
                hintText: 'Any damages, issues, or observations?',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                filled: true,
                fillColor: AppStyles.surface(context),
              ),
            ),

            const SizedBox(height: 32),

            // Submit Button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isSubmitting ? null : _submitPhotos,
                style: AppStyles.primaryButtonStyle(
                  context,
                ).copyWith(padding: const WidgetStatePropertyAll(EdgeInsets.symmetric(vertical: 16))),
                child: _isSubmitting
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : Text(
                        widget.isStartJourney ? 'Confirm Pickup' : 'Submit Return',
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                      ),
              ),
            ),

            const SizedBox(height: 16),

            // Warning Text
            if (_photos.length < 3)
              Center(
                child: Text(
                  '⚠️ Please add at least ${3 - _photos.length} more photo${3 - _photos.length > 1 ? 's' : ''}',
                  style: AppStyles.caption(context).copyWith(color: Colors.orange),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
