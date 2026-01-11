// lib/screens/Cars/views/fav_cars_screen.dart
import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/screens/Cars/services/favorites_api_service.dart';
import 'package:wiz/screens/Cars/services/vehicle_api_service.dart';
import 'package:wiz/screens/Cars/models/car.dart';
import 'package:wiz/utils/app_routes.dart';

class FavoriteCarsScreen extends StatefulWidget {
  const FavoriteCarsScreen({super.key});

  @override
  State<FavoriteCarsScreen> createState() => _FavoriteCarsScreenState();
}

class _FavoriteCarsScreenState extends State<FavoriteCarsScreen> {
  final FavoritesApiService _favoritesApi = FavoritesApiService();
  final VehicleApiService _vehicleApi = VehicleApiService();

  List<FavoriteVehicle> _favorites = [];
  bool _isLoading = true;
  bool _isRefreshing = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadFavorites();
  }

  Future<void> _loadFavorites() async {
    if (!_isRefreshing) {
      setState(() {
        _isLoading = true;
        _error = null;
      });
    }

    try {
      print('🔄 Loading favorites...');
      final response = await _favoritesApi.getFavorites(limit: 50);

      setState(() {
        _favorites = response.favorites;
        _isLoading = false;
        _isRefreshing = false;
      });

      print('✅ Loaded ${_favorites.length} favorite vehicles');
    } catch (e) {
      print('❌ Error loading favorites: $e');
      setState(() {
        _error = e.toString();
        _isLoading = false;
        _isRefreshing = false;
      });
    }
  }

  Future<void> _handleRefresh() async {
    setState(() => _isRefreshing = true);
    await _loadFavorites();
  }

  Future<void> _removeFavorite(String vehicleId, int index) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Remove Favorite'),
        content: const Text('Remove this vehicle from your favorites?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Remove'),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    try {
      setState(() {
        _favorites.removeAt(index);
      });

      await _favoritesApi.removeFavorite(vehicleId);

      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Removed from favorites'), backgroundColor: Colors.green));
      }
    } catch (e) {
      print('❌ Error removing favorite: $e');
      _loadFavorites();

      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Failed to remove: $e'), backgroundColor: Colors.red));
      }
    }
  }

  Future<void> _viewVehicleDetails(FavoriteVehicle favorite) async {
    try {
      // Fetch full vehicle details
      final vehicleDetails = await _vehicleApi.getVehicleDetails(favorite.vehicleId);
      final car = vehicleDetails.toCar();

      if (mounted) {
        // ✅ UPDATED: Only pass the car object, no trip data
        AppRoutes.navigateTo(
          context,
          AppRoutes.carDetails,
          arguments: {
            'car': car,
            // ✅ Don't pass location, datetime, withDriver - let user set these in car details
          },
        );
      }
    } catch (e) {
      print('❌ Error loading vehicle details: $e');
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Failed to load vehicle: $e'), backgroundColor: Colors.red));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppStyles.background(context),
      appBar: AppBar(
        leading: IconButton(icon: const Icon(Icons.arrow_back), onPressed: () => Navigator.pop(context)),
        title: Text('Favorite Vehicles', style: AppStyles.h2(context)),
        centerTitle: true,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
          ? _buildErrorState()
          : _favorites.isEmpty
          ? _buildEmptyState()
          : RefreshIndicator(
              onRefresh: _handleRefresh,
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: _favorites.length,
                itemBuilder: (context, index) {
                  return _buildFavoriteCard(_favorites[index], index);
                },
              ),
            ),
    );
  }

  Widget _buildFavoriteCard(FavoriteVehicle favorite, int index) {
    final details = favorite.vehicleDetails;

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      elevation: 2,
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => _viewVehicleDetails(favorite),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Vehicle Icon/Image Placeholder
              Container(
                width: 90,
                height: 90,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [AppStyles.primary.withOpacity(0.2), AppStyles.primaryLight.withOpacity(0.1)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppStyles.primary.withOpacity(0.3)),
                ),
                child: Icon(Icons.directions_car_rounded, size: 45, color: AppStyles.primary),
              ),
              const SizedBox(width: 16),

              // Vehicle Info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (details != null) ...[
                      Text(details.name, style: AppStyles.h3(context), maxLines: 2, overflow: TextOverflow.ellipsis),
                      const SizedBox(height: 4),
                      Text(_capitalize(details.vehicleType), style: AppStyles.caption(context)),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          const Icon(Icons.star, color: Colors.amber, size: 16),
                          const SizedBox(width: 4),
                          Text(
                            '${details.averageRating.toStringAsFixed(1)} (${details.totalRentals})',
                            style: AppStyles.caption(context),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${_formatPrice(details.pricePerDay)}₫/day',
                        style: AppStyles.body(context).copyWith(color: AppStyles.primary, fontWeight: FontWeight.bold),
                      ),
                    ] else ...[
                      Text('Vehicle ${favorite.vehicleId.substring(0, 8)}...', style: AppStyles.h3(context)),
                      const SizedBox(height: 4),
                      Text('Loading details...', style: AppStyles.caption(context)),
                    ],
                    const SizedBox(height: 4),
                    Text(
                      'Added ${_formatDate(favorite.addedAt)}',
                      style: AppStyles.caption(context).copyWith(fontSize: 12, color: Colors.grey),
                    ),
                  ],
                ),
              ),

              // Remove Button
              IconButton(
                icon: const Icon(Icons.favorite, color: Colors.red),
                onPressed: () => _removeFavorite(favorite.vehicleId, index),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.favorite_border, size: 80, color: AppStyles.textSecondary(context).withOpacity(0.5)),
            const SizedBox(height: 20),
            Text('No Favorite Vehicles', style: AppStyles.h3(context)),
            const SizedBox(height: 8),
            Text(
              'Browse vehicles and tap the heart icon to add them to your favorites',
              style: AppStyles.caption(context),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () {
                Navigator.pop(context);
                AppRoutes.navigateTo(context, AppRoutes.home);
              },
              style: AppStyles.primaryButtonStyle(context),
              icon: const Icon(Icons.search),
              label: const Text('Browse Vehicles'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 80, color: Colors.red.withOpacity(0.5)),
            const SizedBox(height: 20),
            Text('Failed to Load Favorites', style: AppStyles.h3(context)),
            const SizedBox(height: 8),
            Text(_error ?? 'Unknown error', style: AppStyles.caption(context), textAlign: TextAlign.center),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                OutlinedButton.icon(
                  onPressed: () => Navigator.pop(context),
                  style: OutlinedButton.styleFrom(foregroundColor: AppStyles.primary),
                  icon: const Icon(Icons.arrow_back),
                  label: const Text('Go Back'),
                ),
                const SizedBox(width: 12),
                ElevatedButton.icon(
                  onPressed: _loadFavorites,
                  style: AppStyles.primaryButtonStyle(context),
                  icon: const Icon(Icons.refresh),
                  label: const Text('Retry'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _capitalize(String s) {
    if (s.isEmpty) return s;
    return s[0].toUpperCase() + s.substring(1).toLowerCase();
  }

  String _formatPrice(int price) {
    return price.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},');
  }

  String _formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      final now = DateTime.now();
      final difference = now.difference(date);

      if (difference.inDays == 0) {
        if (difference.inHours == 0) {
          return '${difference.inMinutes}m ago';
        }
        return '${difference.inHours}h ago';
      } else if (difference.inDays < 7) {
        return '${difference.inDays}d ago';
      } else if (difference.inDays < 30) {
        return '${(difference.inDays / 7).floor()}w ago';
      } else {
        final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return '${date.day} ${months[date.month - 1]} ${date.year}';
      }
    } catch (e) {
      return dateStr;
    }
  }
}
