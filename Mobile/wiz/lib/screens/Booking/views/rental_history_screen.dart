import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/screens/Booking/services/booking_api_service.dart';
import 'package:wiz/utils/app_routes.dart';

class RentalHistoryScreen extends StatefulWidget {
  const RentalHistoryScreen({super.key});

  @override
  State<RentalHistoryScreen> createState() => _RentalHistoryScreenState();
}

class _RentalHistoryScreenState extends State<RentalHistoryScreen> {
  final TextEditingController _searchController = TextEditingController();
  final BookingApiService _bookingApi = BookingApiService();
  final ScrollController _scrollController = ScrollController();

  List<CustomerBooking> _bookings = [];
  bool _isLoading = true;
  bool _isLoadingMore = false;
  String? _error;
  String _selectedStatus = 'all';

  // Pagination state
  int _currentPage = 1;
  int _totalPages = 1;
  int _totalBookings = 0;
  final int _limit = 10;

  @override
  void initState() {
    super.initState();
    _loadBookings();
    _scrollController.addListener(_onScroll);
  }

  void _onScroll() {
    // Optional: Keep scroll listener for future enhancements
  }

  Future<void> _goToPage(int page) async {
    if (page < 1 || page > _totalPages || _isLoadingMore) return;

    setState(() {
      _isLoadingMore = true;
      _currentPage = page;
    });

    try {
      final response = await _bookingApi.getMyBookings(
        status: _selectedStatus == 'all' ? null : _selectedStatus,
        page: page,
        limit: _limit,
      );

      setState(() {
        _bookings = response.bookings;
        _isLoadingMore = false;
      });

      // Scroll to top when changing pages
      if (_scrollController.hasClients) {
        _scrollController.animateTo(0, duration: const Duration(milliseconds: 300), curve: Curves.easeOut);
      }

      print('📋 Loaded page $page/$_totalPages (${_bookings.length} bookings)');
    } catch (e) {
      print('❌ Error loading page: $e');
      setState(() {
        _isLoadingMore = false;
      });

      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to load page: $e')));
    }
  }

  Future<void> _loadBookings() async {
    setState(() {
      _isLoading = true;
      _error = null;
      _currentPage = 1;
      _bookings = [];
    });

    try {
      final response = await _bookingApi.getMyBookings(
        status: _selectedStatus == 'all' ? null : _selectedStatus,
        page: _currentPage,
        limit: _limit,
      );

      setState(() {
        _bookings = response.bookings;
        _totalBookings = response.pagination.total;
        _totalPages = (response.pagination.total / _limit).ceil();
        _isLoading = false;
      });

      print('📋 Loaded ${_bookings.length} customer bookings from backend');
      print('📊 Total: $_totalBookings, Page: $_currentPage/$_totalPages');
    } catch (e) {
      print('❌ Error loading bookings: $e');
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  void _showFilterSheet() {
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Filter by Status', style: AppStyles.h2(context)),
            const SizedBox(height: 20),
            Wrap(
              spacing: 8,
              children: ['all', 'pending', 'booking', 'picked_up', 'return_submitted', 'completed', 'cancelled'].map((
                status,
              ) {
                final isSelected = _selectedStatus == status;
                return FilterChip(
                  label: Text(status.toUpperCase().replaceAll('_', ' ')),
                  selected: isSelected,
                  selectedColor: AppStyles.primary,
                  checkmarkColor: Colors.white,
                  onSelected: (_) {
                    setState(() => _selectedStatus = status);
                    Navigator.pop(context);
                    _loadBookings();
                  },
                );
              }).toList(),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppStyles.background(context),
      appBar: AppBar(
        title: Text('Rental History', style: AppStyles.h2(context)),
        centerTitle: true,
        backgroundColor: AppStyles.background(context),
        elevation: 0,
        actions: [IconButton(icon: const Icon(Icons.tune), onPressed: _showFilterSheet)],
      ),
      body: Column(
        children: [
          // Pagination info header
          if (!_isLoading && _bookings.isNotEmpty)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Showing ${_bookings.length} of $_totalBookings bookings', style: AppStyles.caption(context)),
                  if (_totalPages > 1) Text('Page $_currentPage of $_totalPages', style: AppStyles.caption(context)),
                ],
              ),
            ),

          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                ? _buildErrorState()
                : _bookings.isEmpty
                ? _buildEmptyState()
                : RefreshIndicator(onRefresh: _loadBookings, child: _buildBookingsList()),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.history, size: 64, color: AppStyles.textSecondary(context).withOpacity(0.5)),
          const SizedBox(height: 16),
          Text('No bookings yet', style: AppStyles.h3(context)),
          const SizedBox(height: 8),
          Text('Your rental history will appear here', style: AppStyles.caption(context)),
          const SizedBox(height: 24),
          ElevatedButton(
            style: AppStyles.primaryButtonStyle(context),
            onPressed: () {
              Navigator.pop(context);
            },
            child: const Text('Browse Cars'),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error_outline, size: 64, color: Colors.red.withOpacity(0.5)),
          const SizedBox(height: 16),
          Text('Failed to load bookings', style: AppStyles.body(context)),
          Text(_error ?? 'Unknown error', style: AppStyles.caption(context)),
          const SizedBox(height: 24),
          ElevatedButton(
            style: AppStyles.primaryButtonStyle(context),
            onPressed: _loadBookings,
            child: const Text('Retry'),
          ),
        ],
      ),
    );
  }

  Widget _buildBookingsList() {
    return Column(
      children: [
        Expanded(
          child: ListView.builder(
            controller: _scrollController,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: _bookings.length,
            itemBuilder: (context, index) {
              final booking = _bookings[index];
              return GestureDetector(
                onTap: () async {
                  final result = await Navigator.pushNamed(
                    context,
                    AppRoutes.rentalDetails,
                    arguments: {'bookingId': booking.id},
                  );

                  if (result == true) {
                    _loadBookings();
                  }
                },
                child: Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(color: AppStyles.surface(context), borderRadius: BorderRadius.circular(16)),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Status badge
                      Row(
                        children: [
                          _buildStatusBadge(booking.status),
                          const Spacer(),
                          if (booking.canCancel)
                            const Icon(Icons.cancel_outlined, size: 16, color: Colors.orange)
                          else if (booking.canReview)
                            const Icon(Icons.star_border, size: 16, color: Colors.amber),
                        ],
                      ),
                      const SizedBox(height: 12),

                      // Vehicle info
                      Text(booking.vehicle['name'] ?? 'Unknown Vehicle', style: AppStyles.h3(context)),
                      const SizedBox(height: 4),
                      Text('Booking ID: ${booking.id.substring(0, 8)}...', style: AppStyles.caption(context)),
                      const SizedBox(height: 8),

                      // Dates
                      Row(
                        children: [
                          const Icon(Icons.calendar_today, size: 14, color: Colors.grey),
                          const SizedBox(width: 4),
                          Text(
                            '${_formatDate(booking.startDate)} - ${_formatDate(booking.endDate)}',
                            style: AppStyles.caption(context),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),

                      // Price and duration
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            '${_formatPrice(booking.pricing['total'] ?? 0)} ₫',
                            style: AppStyles.body(
                              context,
                            ).copyWith(color: AppStyles.primary, fontWeight: FontWeight.bold),
                          ),
                          Text(booking.duration, style: AppStyles.caption(context)),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),

        // Pagination controls
        if (_totalPages > 1)
          Container(
            padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
            decoration: BoxDecoration(
              color: AppStyles.background(context),
              border: Border(top: BorderSide(color: Colors.grey.withOpacity(0.15), width: 1)),
            ),
            child: Column(
              children: [
                // Page info text
                Text(
                  'Showing ${(_currentPage - 1) * _limit + 1}-${(_currentPage * _limit > _totalBookings) ? _totalBookings : _currentPage * _limit} of $_totalBookings results',
                  style: AppStyles.caption(context).copyWith(color: Colors.grey, fontSize: 13),
                ),
                const SizedBox(height: 16),

                // Pagination controls
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // Previous button
                    _buildNavButton(
                      icon: Icons.chevron_left,
                      onPressed: _currentPage > 1 && !_isLoadingMore ? () => _goToPage(_currentPage - 1) : null,
                      enabled: _currentPage > 1 && !_isLoadingMore,
                    ),

                    const SizedBox(width: 8),

                    // Page numbers
                    if (_isLoadingMore)
                      Container(
                        width: 160,
                        height: 44,
                        alignment: Alignment.center,
                        child: SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(AppStyles.primary),
                          ),
                        ),
                      )
                    else
                      Container(
                        height: 44,
                        padding: const EdgeInsets.symmetric(horizontal: 4),
                        child: Row(mainAxisSize: MainAxisSize.min, children: _buildPageNumbers()),
                      ),

                    const SizedBox(width: 8),

                    // Next button
                    _buildNavButton(
                      icon: Icons.chevron_right,
                      onPressed: _currentPage < _totalPages && !_isLoadingMore
                          ? () => _goToPage(_currentPage + 1)
                          : null,
                      enabled: _currentPage < _totalPages && !_isLoadingMore,
                    ),
                  ],
                ),
              ],
            ),
          ),
      ],
    );
  }

  Widget _buildNavButton({required IconData icon, required VoidCallback? onPressed, required bool enabled}) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(8),
        child: Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: enabled ? AppStyles.surface(context) : AppStyles.surface(context).withOpacity(0.5),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: enabled ? Colors.grey.withOpacity(0.25) : Colors.grey.withOpacity(0.15),
              width: 1,
            ),
          ),
          child: Icon(icon, color: enabled ? AppStyles.textPrimary(context) : Colors.grey.withOpacity(0.5), size: 20),
        ),
      ),
    );
  }

  List<Widget> _buildPageNumbers() {
    List<Widget> pageWidgets = [];

    // Calculate which pages to show
    int startPage = 1;
    int endPage = _totalPages;

    // Show max 5 page numbers at a time
    if (_totalPages > 5) {
      if (_currentPage <= 3) {
        endPage = 5;
      } else if (_currentPage >= _totalPages - 2) {
        startPage = _totalPages - 4;
      } else {
        startPage = _currentPage - 2;
        endPage = _currentPage + 2;
      }
    }

    for (int i = startPage; i <= endPage; i++) {
      final isCurrentPage = i == _currentPage;

      pageWidgets.add(
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 3),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: !isCurrentPage ? () => _goToPage(i) : null,
              borderRadius: BorderRadius.circular(8),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: isCurrentPage ? AppStyles.primary : Colors.transparent,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: isCurrentPage ? AppStyles.primary : Colors.grey.withOpacity(0.25),
                    width: 1,
                  ),
                ),
                child: Center(
                  child: Text(
                    i.toString(),
                    style: TextStyle(
                      color: isCurrentPage ? Colors.white : AppStyles.textPrimary(context),
                      fontWeight: isCurrentPage ? FontWeight.w600 : FontWeight.w500,
                      fontSize: 15,
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      );
    }

    return pageWidgets;
  }

  Widget _buildStatusBadge(String status) {
    Color color;
    String label;

    switch (status) {
      case 'pending':
        color = Colors.orange;
        label = 'PENDING';
        break;
      case 'booking':
        color = Colors.blue;
        label = 'CONFIRMED';
        break;
      case 'picked_up':
        color = Colors.purple;
        label = 'ON JOURNEY';
        break;
      case 'return_submitted':
        color = Colors.indigo;
        label = 'RETURN SUBMITTED';
        break;
      case 'completed':
        color = Colors.green;
        label = 'COMPLETED';
        break;
      case 'cancelled':
        color = Colors.red;
        label = 'CANCELLED';
        break;
      default:
        color = Colors.grey;
        label = status.toUpperCase();
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color),
      ),
      child: Text(
        label,
        style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.bold),
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }

  String _formatPrice(int price) {
    return price.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},');
  }

  @override
  void dispose() {
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }
}
