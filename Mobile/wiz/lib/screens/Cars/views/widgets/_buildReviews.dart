import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';

class Review {
  final String name;
  final String date;
  final double rating;
  final String? comment;

  const Review({
    required this.name,
    required this.date,
    required this.rating,
    this.comment,
  });
}

class ReviewsSection extends StatelessWidget {
  final List<Review> reviews;
  final VoidCallback? onSeeMorePressed;
  final int maxDisplayed; 

  const ReviewsSection({
    Key? key,
    required this.reviews,
    this.onSeeMorePressed,
    this.maxDisplayed = 3,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final displayedReviews = reviews.take(maxDisplayed).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Rates and Reviews', style: AppStyles.h3(context)),
        const SizedBox(height: 12),

        // Review Cards
        ...displayedReviews.map((review) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: ReviewCard(review: review),
            )),

        // "See more" button
        if (reviews.length > maxDisplayed)
          Center(
            child: OutlinedButton(
              onPressed: onSeeMorePressed,
              style: OutlinedButton.styleFrom(
                foregroundColor: AppStyles.primary,
                side: BorderSide(color: AppStyles.primary),
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                ),
              ),
              child: const Text('See more reviews'),
            ),
          )
        else if (reviews.isEmpty)
          Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 20),
              child: Text(
                'No reviews yet',
                style: AppStyles.caption(context).copyWith(color: Colors.grey),
              ),
            ),
          ),
      ],
    );
  }
}

// Reusable Review Card
class ReviewCard extends StatelessWidget {
  final Review review;

  const ReviewCard({Key? key, required this.review}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      color: AppStyles.surface(context),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      elevation: 0,
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Avatar
            CircleAvatar(
              radius: 22,
              backgroundColor: Colors.grey.shade200,
              child: Text(
                review.name.split(' ').map((e) => e[0]).take(2).join(),
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
            const SizedBox(width: 12),

            // Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    review.name,
                    style: AppStyles.body(context).copyWith(fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    review.date,
                    style: AppStyles.caption(context).copyWith(color: Colors.grey.shade600),
                  ),
                  if (review.comment != null) ...[
                    const SizedBox(height: 6),
                    Text(
                      review.comment!,
                      style: AppStyles.caption(context).copyWith(height: 1.5),
                    ),
                  ],
                ],
              ),
            ),

            // Rating
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.star, color: Colors.amber, size: 18),
                const SizedBox(width: 4),
                Text(
                  '${review.rating.toStringAsFixed(1)}',
                  style: AppStyles.caption(context).copyWith(
                    fontWeight: FontWeight.bold,
                    color: Colors.grey.shade700,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}