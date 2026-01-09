// Mobile/wiz/lib/screens/Cars/views/widgets/_buildCarCard.dart
import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/screens/Cars/models/car.dart';
import 'package:wiz/screens/Cars/services/favorites_api_service.dart';
import 'package:wiz/utils/app_routes.dart';

class BuildCarCard extends StatefulWidget {
  final Car car;
  final Map<String, dynamic> tripData;

  const BuildCarCard({super.key, required this.car, required this.tripData});

  @override
  State<BuildCarCard> createState() => _BuildCarCardState();
}

class _BuildCarCardState extends State<BuildCarCard> {
  final FavoritesApiService _favoritesApi = FavoritesApiService();
  bool _isFavorited = false;
  bool _isCheckingFavorite = true;
  bool _isTogglingFavorite = false;

  @override
  void initState() {
    super.initState();
    _checkFavoriteStatus();
  }

  Future<void> _checkFavoriteStatus() async {
    try {
      final isFavorited = await _favoritesApi.checkFavorite(widget.car.id);
      if (mounted) {
        setState(() {
          _isFavorited = isFavorited;
          _isCheckingFavorite = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isCheckingFavorite = false);
      }
    }
  }

  Future<void> _toggleFavorite() async {
    if (_isTogglingFavorite) return;

    setState(() => _isTogglingFavorite = true);

    try {
      if (_isFavorited) {
        await _favoritesApi.removeFavorite(widget.car.id);
        if (mounted) {
          setState(() => _isFavorited = false);
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(const SnackBar(content: Text('Removed from favorites'), duration: Duration(seconds: 1)));
        }
      } else {
        await _favoritesApi.addFavorite(widget.car.id);
        if (mounted) {
          setState(() => _isFavorited = true);
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(const SnackBar(content: Text('Added to favorites'), duration: Duration(seconds: 1)));
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

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      elevation: 2,
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () {
          final arguments = Map<String, dynamic>.from(widget.tripData);
          arguments['car'] = widget.car;
          AppRoutes.navigateTo(context, AppRoutes.carDetails, arguments: arguments);
        },
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
              child: Stack(
                children: [
                  Image.asset(widget.car.image, height: 180, width: double.infinity, fit: BoxFit.cover),
                  // Favorite Button
                  Positioned(
                    top: 12,
                    right: 12,
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.9),
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 8, offset: const Offset(0, 2)),
                        ],
                      ),
                      child: _isCheckingFavorite
                          ? Padding(
                              padding: const EdgeInsets.all(10),
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
                                color: _isFavorited ? Colors.red : Colors.grey[700],
                              ),
                              onPressed: _isTogglingFavorite ? null : _toggleFavorite,
                            ),
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      _buildOwnerAvatar(widget.car.ownerAvatar),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          widget.car.owner,
                          style: AppStyles.caption(context),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Row(
                        children: [
                          const Icon(Icons.star, color: Colors.amber, size: 16),
                          const SizedBox(width: 4),
                          Text('${widget.car.rating} (${widget.car.reviews})', style: AppStyles.caption(context)),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(widget.car.name, style: AppStyles.h3(context)),
                  Row(
                    children: [
                      Icon(Icons.location_on, size: 16, color: AppStyles.textSecondary(context)),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          widget.car.location,
                          style: AppStyles.caption(context),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '${_formatPrice(widget.car.price)}₫/day',
                        style: AppStyles.h3(context).copyWith(color: AppStyles.primary),
                      ),
                      ElevatedButton(
                        style: AppStyles.primaryButtonStyle(context).copyWith(
                          padding: WidgetStateProperty.all(const EdgeInsets.symmetric(horizontal: 24, vertical: 12)),
                        ),
                        onPressed: () {
                          final arguments = Map<String, dynamic>.from(widget.tripData);
                          arguments['car'] = widget.car;
                          AppRoutes.navigateTo(context, AppRoutes.carDetails, arguments: arguments);
                        },
                        child: Text('See details', style: AppStyles.button),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOwnerAvatar(String avatarPath) {
    if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
      return CircleAvatar(
        radius: 16,
        backgroundColor: Colors.grey[300],
        child: ClipOval(
          child: Image.network(
            avatarPath,
            width: 32,
            height: 32,
            fit: BoxFit.cover,
            errorBuilder: (context, error, stackTrace) {
              return Icon(Icons.person, size: 20, color: Colors.grey[600]);
            },
            loadingBuilder: (context, child, loadingProgress) {
              if (loadingProgress == null) return child;
              return Center(
                child: SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    value: loadingProgress.expectedTotalBytes != null
                        ? loadingProgress.cumulativeBytesLoaded / loadingProgress.expectedTotalBytes!
                        : null,
                  ),
                ),
              );
            },
          ),
        ),
      );
    } else {
      return CircleAvatar(
        radius: 16,
        backgroundColor: Colors.grey[300],
        child: ClipOval(
          child: Image.asset(
            avatarPath,
            width: 32,
            height: 32,
            fit: BoxFit.cover,
            errorBuilder: (context, error, stackTrace) {
              return Icon(Icons.person, size: 20, color: Colors.grey[600]);
            },
          ),
        ),
      );
    }
  }

  String _formatPrice(int price) {
    return price.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},');
  }
}
