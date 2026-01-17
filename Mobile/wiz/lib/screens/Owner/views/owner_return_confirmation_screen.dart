// lib/screens/Owner/views/owner_return_confirmation_screen.dart
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/screens/Booking/services/booking_api_service.dart';

class OwnerReturnConfirmationScreen extends StatefulWidget {
  final OwnerBooking booking;

  const OwnerReturnConfirmationScreen({super.key, required this.booking});

  @override
  State<OwnerReturnConfirmationScreen> createState() => _OwnerReturnConfirmationScreenState();
}

class _OwnerReturnConfirmationScreenState extends State<OwnerReturnConfirmationScreen> {
  final BookingApiService _bookingApi = BookingApiService();
  final ImagePicker _picker = ImagePicker();

  final TextEditingController _odometerController = TextEditingController();
  final TextEditingController _notesController = TextEditingController();

  List<File> _photos = [];
  bool _isSubmitting = false;
  bool _damagesReported = false;
  String _action = 'complete'; // 'complete' or 'dispute'

  @override
  void dispose() {
    _odometerController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final XFile? image = await _picker.pickImage(source: source, maxWidth: 1920, maxHeight: 1080, imageQuality: 85);
      if (image != null && mounted) {
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
    setState(() => _photos.removeAt(index));
  }

  Future<void> _submitConfirmation() async {
    if (_photos.length < 3) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Please take at least 3 photos'), backgroundColor: Colors.orange));
      return;
    }

    final odometer = int.tryParse(_odometerController.text.trim());
    if (odometer == null || odometer <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid odometer reading'), backgroundColor: Colors.orange),
      );
      return;
    }

    if (_damagesReported && _notesController.text.trim().isEmpty) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Please describe the damages'), backgroundColor: Colors.orange));
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      await _bookingApi.ownerConfirmReturn(
        bookingId: widget.booking.id,
        conditionPhotos: _photos,
        conditionNotes: _notesController.text.trim(),
        damagesReported: _damagesReported,
        odometerReading: odometer,
        action: _action,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              _action == 'complete' ? 'Return confirmed - Booking completed!' : 'Dispute opened for review',
            ),
            backgroundColor: _action == 'complete' ? Colors.green : Colors.orange,
          ),
        );
        Navigator.pop(context, {'success': true});
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Failed to submit: $e'), backgroundColor: Colors.red));
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppStyles.background(context),
      appBar: AppBar(title: const Text('Confirm Return'), centerTitle: true),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Booking', style: AppStyles.h3(context)),
                    const SizedBox(height: 8),
                    Text('ID: ${widget.booking.id.substring(0, 8)}...'),
                    Text('Vehicle: ${widget.booking.vehicle['name'] ?? 'Unknown'}'),
                    Text('Period: ${_formatDate(widget.booking.startDate)} – ${_formatDate(widget.booking.endDate)}'),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 24),

            Text('Photos (${_photos.length}/3+)', style: AppStyles.h3(context)),
            const SizedBox(height: 12),

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
                    fit: StackFit.expand,
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Image.file(_photos[index], fit: BoxFit.cover),
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

            const SizedBox(height: 16),

            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: _showImageSourceDialog,
                icon: const Icon(Icons.add_a_photo),
                label: const Text('Add Photo'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppStyles.primary,
                  side: BorderSide(color: AppStyles.primary),
                ),
              ),
            ),

            const SizedBox(height: 32),

            Text('Odometer Reading *', style: AppStyles.h3(context)),
            const SizedBox(height: 8),
            TextField(
              controller: _odometerController,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                hintText: 'Enter current reading (km)',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),

            const SizedBox(height: 24),

            CheckboxListTile(
              value: _damagesReported,
              onChanged: (v) {
                setState(() {
                  _damagesReported = v ?? false;
                  if (_damagesReported) _action = 'dispute';
                });
              },
              title: const Text('Report damages'),
              subtitle: const Text('Check if there are damages or issues'),
              activeColor: Colors.orange,
              contentPadding: EdgeInsets.zero,
            ),

            const SizedBox(height: 16),

            Text('Notes', style: AppStyles.h3(context)),
            const SizedBox(height: 8),
            TextField(
              controller: _notesController,
              maxLines: 4,
              decoration: InputDecoration(
                hintText: _damagesReported ? 'Describe damages...' : 'Any observations?',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),

            const SizedBox(height: 32),

            SizedBox(
              width: double.infinity,
              height: 54,
              child: ElevatedButton(
                onPressed: _isSubmitting ? null : _submitConfirmation,
                style: ElevatedButton.styleFrom(
                  backgroundColor: _action == 'complete' ? Colors.green : Colors.orange,
                  foregroundColor: Colors.white,
                ),
                child: _isSubmitting
                    ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(color: Colors.white))
                    : Text(_action == 'complete' ? 'Complete Booking' : 'Submit Dispute'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}
