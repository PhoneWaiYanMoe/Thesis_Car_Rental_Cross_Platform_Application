// Mobile/wiz/lib/screens/Booking/views/rate_review_screen.dart
// ✅ UPDATED: Integrate with review API

import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/screens/Booking/services/review_api_service.dart';

class RateReviewScreen extends StatefulWidget {
  final String bookingId;
  final String vehicleId;
  final String vehicleName;
  final String? ownerId;

  const RateReviewScreen({
    super.key,
    required this.bookingId,
    required this.vehicleId,
    required this.vehicleName,
    this.ownerId,
  });

  @override
  State<RateReviewScreen> createState() => _RateReviewScreenState();
}

class _RateReviewScreenState extends State<RateReviewScreen> {
  final ReviewApiService _reviewApi = ReviewApiService();

  // Vehicle review
  int _vehicleRating = 0;
  final TextEditingController _vehicleReviewController = TextEditingController();
  bool _vehicleReviewSubmitted = false;

  // Owner review
  int _ownerRating = 0;
  final TextEditingController _ownerReviewController = TextEditingController();
  int _communicationRating = 0;
  int _reliabilityRating = 0;
  int _carConditionRating = 0;
  bool _ownerReviewSubmitted = false;

  bool _isSubmitting = false;
  int _currentTab = 0; // 0 = Vehicle, 1 = Owner

  @override
  void dispose() {
    _vehicleReviewController.dispose();
    _ownerReviewController.dispose();
    super.dispose();
  }

  Future<void> _submitVehicleReview() async {
    if (_vehicleRating == 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a rating for the vehicle'), backgroundColor: Colors.red),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      await _reviewApi.submitVehicleReview(
        bookingId: widget.bookingId,
        vehicleId: widget.vehicleId,
        rating: _vehicleRating,
        comment: _vehicleReviewController.text,
      );

      setState(() {
        _vehicleReviewSubmitted = true;
        _isSubmitting = false;
      });

      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Vehicle review submitted!'), backgroundColor: Colors.green));

        // ✅ If owner review not needed, go back
        if (widget.ownerId == null || widget.ownerId!.isEmpty) {
          Navigator.pop(context, true);
        } else {
          // Switch to owner review tab
          setState(() => _currentTab = 1);
        }
      }
    } catch (e) {
      setState(() => _isSubmitting = false);

      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Failed to submit review: $e'), backgroundColor: Colors.red));
      }
    }
  }

  Future<void> _submitOwnerReview() async {
    if (_ownerRating == 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a rating for the owner'), backgroundColor: Colors.red),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      await _reviewApi.submitOwnerReview(
        bookingId: widget.bookingId,
        ownerId: widget.ownerId!,
        rating: _ownerRating,
        comment: _ownerReviewController.text,
        communicationRating: _communicationRating > 0 ? _communicationRating : null,
        reliabilityRating: _reliabilityRating > 0 ? _reliabilityRating : null,
        carConditionRating: _carConditionRating > 0 ? _carConditionRating : null,
      );

      setState(() {
        _ownerReviewSubmitted = true;
        _isSubmitting = false;
      });

      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Owner review submitted!'), backgroundColor: Colors.green));

        // Go back to booking details
        await Future.delayed(const Duration(seconds: 1));
        if (mounted) {
          Navigator.pop(context, true);
        }
      }
    } catch (e) {
      setState(() => _isSubmitting = false);

      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Failed to submit review: $e'), backgroundColor: Colors.red));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppStyles.background(context),
      appBar: AppBar(
        leading: IconButton(icon: const Icon(Icons.arrow_back), onPressed: () => Navigator.pop(context)),
        title: Text('Rate & Review', style: AppStyles.h2(context)),
        centerTitle: true,
        backgroundColor: AppStyles.background(context),
        elevation: 0,
      ),
      body: Column(
        children: [
          // ✅ Tab selector (if owner exists)
          if (widget.ownerId != null && widget.ownerId!.isNotEmpty)
            Container(
              margin: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: AppStyles.surface(context), borderRadius: BorderRadius.circular(12)),
              child: Row(
                children: [
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _currentTab = 0),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: BoxDecoration(
                          color: _currentTab == 0 ? AppStyles.primary : Colors.transparent,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.directions_car,
                              color: _currentTab == 0 ? Colors.white : AppStyles.textSecondary(context),
                              size: 20,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'Vehicle',
                              style: TextStyle(
                                color: _currentTab == 0 ? Colors.white : AppStyles.textSecondary(context),
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            if (_vehicleReviewSubmitted)
                              const Padding(
                                padding: EdgeInsets.only(left: 4),
                                child: Icon(Icons.check_circle, color: Colors.white, size: 16),
                              ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _currentTab = 1),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: BoxDecoration(
                          color: _currentTab == 1 ? AppStyles.primary : Colors.transparent,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.person,
                              color: _currentTab == 1 ? Colors.white : AppStyles.textSecondary(context),
                              size: 20,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'Owner',
                              style: TextStyle(
                                color: _currentTab == 1 ? Colors.white : AppStyles.textSecondary(context),
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            if (_ownerReviewSubmitted)
                              const Padding(
                                padding: EdgeInsets.only(left: 4),
                                child: Icon(Icons.check_circle, color: Colors.white, size: 16),
                              ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),

          Expanded(child: _currentTab == 0 ? _buildVehicleReviewTab() : _buildOwnerReviewTab()),
        ],
      ),
    );
  }

  Widget _buildVehicleReviewTab() {
    return Column(
      children: [
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'How was your experience with ${widget.vehicleName}?',
                  style: AppStyles.h3(context),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 32),

                // Star rating
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(5, (index) {
                    return GestureDetector(
                      onTap: _vehicleReviewSubmitted ? null : () => setState(() => _vehicleRating = index + 1),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 8),
                        child: Icon(
                          index < _vehicleRating ? Icons.star : Icons.star_border,
                          size: 48,
                          color: Colors.amber,
                        ),
                      ),
                    );
                  }),
                ),

                const SizedBox(height: 48),

                // Comment
                Text('Your Review (Optional)', style: AppStyles.h3(context)),
                const SizedBox(height: 12),
                TextField(
                  controller: _vehicleReviewController,
                  enabled: !_vehicleReviewSubmitted,
                  maxLines: 8,
                  maxLength: 1000,
                  decoration: InputDecoration(
                    hintText: 'Share your experience with this vehicle...',
                    filled: true,
                    fillColor: AppStyles.surface(context),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                  ),
                  style: AppStyles.body(context),
                ),

                if (_vehicleReviewSubmitted)
                  Container(
                    margin: const EdgeInsets.only(top: 16),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.green.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.green),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.check_circle, color: Colors.green),
                        const SizedBox(width: 12),
                        Text(
                          'Vehicle review submitted!',
                          style: TextStyle(color: Colors.green, fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ),
        ),

        if (!_vehicleReviewSubmitted)
          Container(
            padding: const EdgeInsets.all(16),
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: AppStyles.primaryButtonStyle(context),
                onPressed: _isSubmitting ? null : _submitVehicleReview,
                child: _isSubmitting
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : Text('Submit Vehicle Review', style: AppStyles.button),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildOwnerReviewTab() {
    if (widget.ownerId == null || widget.ownerId!.isEmpty) {
      return Center(child: Text('No owner information available', style: AppStyles.caption(context)));
    }

    return Column(
      children: [
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'How was your experience with the owner?',
                  style: AppStyles.h3(context),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 32),

                // Overall star rating
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(5, (index) {
                    return GestureDetector(
                      onTap: _ownerReviewSubmitted ? null : () => setState(() => _ownerRating = index + 1),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 8),
                        child: Icon(
                          index < _ownerRating ? Icons.star : Icons.star_border,
                          size: 48,
                          color: Colors.amber,
                        ),
                      ),
                    );
                  }),
                ),

                const SizedBox(height: 48),

                // Aspect ratings (optional)
                Text('Detailed Ratings (Optional)', style: AppStyles.h3(context)),
                const SizedBox(height: 16),

                _buildAspectRating(
                  'Communication',
                  _communicationRating,
                  (rating) => setState(() => _communicationRating = rating),
                ),
                const SizedBox(height: 12),

                _buildAspectRating(
                  'Reliability',
                  _reliabilityRating,
                  (rating) => setState(() => _reliabilityRating = rating),
                ),
                const SizedBox(height: 12),

                _buildAspectRating(
                  'Car Condition',
                  _carConditionRating,
                  (rating) => setState(() => _carConditionRating = rating),
                ),

                const SizedBox(height: 32),

                // Comment
                Text('Your Review (Optional)', style: AppStyles.h3(context)),
                const SizedBox(height: 12),
                TextField(
                  controller: _ownerReviewController,
                  enabled: !_ownerReviewSubmitted,
                  maxLines: 8,
                  maxLength: 1000,
                  decoration: InputDecoration(
                    hintText: 'Share your experience with the owner...',
                    filled: true,
                    fillColor: AppStyles.surface(context),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                  ),
                  style: AppStyles.body(context),
                ),

                if (_ownerReviewSubmitted)
                  Container(
                    margin: const EdgeInsets.only(top: 16),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.green.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.green),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.check_circle, color: Colors.green),
                        const SizedBox(width: 12),
                        Text(
                          'Owner review submitted!',
                          style: TextStyle(color: Colors.green, fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ),
        ),

        if (!_ownerReviewSubmitted)
          Container(
            padding: const EdgeInsets.all(16),
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: AppStyles.primaryButtonStyle(context),
                onPressed: _isSubmitting ? null : _submitOwnerReview,
                child: _isSubmitting
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : Text('Submit Owner Review', style: AppStyles.button),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildAspectRating(String label, int rating, Function(int) onRatingChanged) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: AppStyles.surface(context), borderRadius: BorderRadius.circular(12)),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: AppStyles.body(context)),
          Row(
            children: List.generate(5, (index) {
              return GestureDetector(
                onTap: _ownerReviewSubmitted ? null : () => onRatingChanged(index + 1),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: Icon(index < rating ? Icons.star : Icons.star_border, size: 24, color: Colors.amber),
                ),
              );
            }),
          ),
        ],
      ),
    );
  }
}
