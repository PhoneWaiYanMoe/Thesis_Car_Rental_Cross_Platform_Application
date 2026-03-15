// lib/screens/Analytics/views/analytics_home_screen.dart
import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:wiz/utils/app_routes.dart';
import 'package:wiz/screens/Analytics/services/analytics_api_services.dart';

class AnalyticsHomeScreen extends StatefulWidget {
  const AnalyticsHomeScreen({super.key});

  @override
  State<AnalyticsHomeScreen> createState() => _AnalyticsHomeScreenState();
}

class _AnalyticsHomeScreenState extends State<AnalyticsHomeScreen> {
  final AnalyticsApiService _analyticsApi = AnalyticsApiService();

  String _selectedPeriod = '30d';
  DateTime? _customStartDate;
  DateTime? _customEndDate;

  bool _isLoading = false;
  String? _errorMessage;
  AnalyticsDashboard? _dashboardData;

  @override
  void initState() {
    super.initState();
    _loadAnalytics();
  }

  Future<void> _loadAnalytics() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final result = await _analyticsApi.getOwnerDashboard(
      timeRange: _selectedPeriod,
      startDate: _customStartDate,
      endDate: _customEndDate,
    );

    if (mounted) {
      if (result['success']) {
        setState(() {
          _dashboardData = AnalyticsDashboard.fromJson(result['data']);
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage = result['error'];
          _isLoading = false;
        });

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(_errorMessage ?? 'Failed to load analytics'), backgroundColor: Colors.red),
        );
      }
    }
  }

  Map<String, dynamic> get _currentData {
    if (_dashboardData == null) {
      return {
        'totalRevenue': 0.0,
        'numberOfVehicles': 0,
        'totalBookingsAsOwner': 0,
        'totalBookingsAsCustomer': 0,
        'activeBookings': 0,
        'bookingsToAccept': 0,
        'canceledBookings': 0,
        'chartData': [],
      };
    }

    return {
      'totalRevenue': _dashboardData!.revenue.totalRevenue, // double
      'numberOfVehicles': _dashboardData!.vehicles.totalVehicles,
      'totalBookingsAsOwner': _dashboardData!.bookings.completedBookings,
      'totalBookingsAsCustomer': 0,
      'activeBookings': _dashboardData!.bookings.activeBookings,
      'bookingsToAccept':
          _dashboardData!.bookings.totalBookings -
          _dashboardData!.bookings.activeBookings -
          _dashboardData!.bookings.completedBookings -
          _dashboardData!.bookings.cancelledBookings,
      'canceledBookings': _dashboardData!.bookings.cancelledBookings,
      'chartData': _dashboardData!.revenue.trend
          .map((t) => {'date': _formatPeriodLabel(t.period), 'amount': t.value}) // double
          .toList(),
    };
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppStyles.background(context),
      appBar: AppBar(
        title: Text('Analytics Dashboard', style: AppStyles.h2(context)),
        centerTitle: true,
        backgroundColor: AppStyles.background(context),
        elevation: 0,
        automaticallyImplyLeading: false,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _errorMessage != null && _dashboardData == null
          ? _buildErrorState()
          : RefreshIndicator(
              onRefresh: _refreshData,
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                physics: const AlwaysScrollableScrollPhysics(),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildPeriodSelector(),
                    const SizedBox(height: 24),
                    Text('Overview', style: AppStyles.h3(context)),
                    const SizedBox(height: 12),
                    _buildSummaryCards(),
                    const SizedBox(height: 24),
                    Text('Booking Status', style: AppStyles.h3(context)),
                    const SizedBox(height: 12),
                    _buildBookingStatus(),
                    const SizedBox(height: 24),
                    Text('Revenue Trend', style: AppStyles.h3(context)),
                    const SizedBox(height: 12),
                    _buildRevenueChart(),
                    const SizedBox(height: 24),
                    Text('Quick Actions', style: AppStyles.h3(context)),
                    const SizedBox(height: 12),
                    _buildQuickActions(),
                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ),
      bottomNavigationBar: _buildBottomNavBar(),
    );
  }

  Widget _buildPeriodSelector() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          _periodChip('All Time', 'all'),
          const SizedBox(width: 8),
          _periodChip('1 Day', '1d'),
          const SizedBox(width: 8),
          _periodChip('7 Days', '7d'),
          const SizedBox(width: 8),
          _periodChip('30 Days', '30d'),
          const SizedBox(width: 8),
          _periodChip('90 Days', '90d'),
          const SizedBox(width: 8),
          _periodChip('1 Year', '365d'),
          const SizedBox(width: 8),
          _periodChip('Custom', 'custom'),
        ],
      ),
    );
  }

  Widget _periodChip(String label, String value) {
    final isSelected = _selectedPeriod == value;
    return FilterChip(
      label: Text(label),
      selected: isSelected,
      selectedColor: AppStyles.primary,
      checkmarkColor: Colors.white,
      labelStyle: TextStyle(
        color: isSelected ? Colors.white : AppStyles.textSecondary(context),
        fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
      ),
      onSelected: (selected) {
        if (value == 'custom') {
          _showCustomDatePicker();
        } else {
          setState(() => _selectedPeriod = value);
          _loadAnalytics();
        }
      },
    );
  }

  Widget _buildSummaryCards() {
    // FIX: safely read totalRevenue as num, then format
    final totalRevenue = (_currentData['totalRevenue'] as num).toDouble();

    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _summaryCard('Total Revenue', _formatCurrency(totalRevenue), Icons.attach_money, Colors.green),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _summaryCard(
                'My Vehicles',
                '${_currentData['numberOfVehicles']}',
                Icons.directions_car,
                Colors.blue,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _summaryCard(
                'As Owner',
                '${_currentData['totalBookingsAsOwner']} trips',
                Icons.business_center,
                Colors.purple,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _summaryCard(
                'As Customer',
                '${_currentData['totalBookingsAsCustomer']} trips',
                Icons.person,
                Colors.orange,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _summaryCard(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppStyles.surface(context),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
                child: Icon(icon, color: color, size: 20),
              ),
              const Spacer(),
            ],
          ),
          const SizedBox(height: 12),
          Text(title, style: AppStyles.caption(context)),
          const SizedBox(height: 4),
          Text(
            value,
            style: AppStyles.h3(context).copyWith(color: color),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildBookingStatus() {
    return Row(
      children: [
        Expanded(child: _statusCard('Active', _currentData['activeBookings'] as int, Colors.blue)),
        const SizedBox(width: 12),
        Expanded(child: _statusCard('To Accept', _currentData['bookingsToAccept'] as int, Colors.orange)),
        const SizedBox(width: 12),
        Expanded(child: _statusCard('Canceled', _currentData['canceledBookings'] as int, Colors.red)),
      ],
    );
  }

  Widget _statusCard(String label, int count, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 12),
      decoration: BoxDecoration(color: AppStyles.surface(context), borderRadius: BorderRadius.circular(12)),
      child: Column(
        children: [
          Text('$count', style: AppStyles.h2(context).copyWith(color: color)),
          const SizedBox(height: 8),
          Text(label, style: AppStyles.caption(context), textAlign: TextAlign.center),
        ],
      ),
    );
  }

  Widget _buildRevenueChart() {
    final chartData = _currentData['chartData'] as List;
    final totalRevenue = (_currentData['totalRevenue'] as num).toDouble();

    return Container(
      height: 280,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: AppStyles.surface(context), borderRadius: BorderRadius.circular(12)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Total: ${_formatCurrency(totalRevenue)}',
            style: AppStyles.body(context).copyWith(fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 16),
          Expanded(
            child: LineChart(
              LineChartData(
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  horizontalInterval: 5000000,
                  getDrawingHorizontalLine: (value) {
                    return FlLine(color: AppStyles.textSecondary(context).withOpacity(0.1), strokeWidth: 1);
                  },
                ),
                titlesData: FlTitlesData(
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 50,
                      getTitlesWidget: (value, meta) {
                        return Text(_formatChartValue(value), style: AppStyles.caption(context).copyWith(fontSize: 10));
                      },
                    ),
                  ),
                  rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 30,
                      getTitlesWidget: (value, meta) {
                        final index = value.toInt();
                        if (index >= 0 && index < chartData.length) {
                          return Padding(
                            padding: const EdgeInsets.only(top: 8),
                            child: Text(
                              chartData[index]['date'],
                              style: AppStyles.caption(context).copyWith(fontSize: 10),
                            ),
                          );
                        }
                        return const Text('');
                      },
                    ),
                  ),
                ),
                borderData: FlBorderData(show: false),
                lineBarsData: [
                  LineChartBarData(
                    // FIX: amount is already double, no cast needed
                    spots: chartData
                        .asMap()
                        .entries
                        .map((e) => FlSpot(e.key.toDouble(), (e.value['amount'] as num).toDouble()))
                        .toList(),
                    isCurved: true,
                    color: AppStyles.primary,
                    barWidth: 3,
                    isStrokeCapRound: true,
                    dotData: FlDotData(
                      show: true,
                      getDotPainter: (spot, percent, barData, index) {
                        return FlDotCirclePainter(
                          radius: 4,
                          color: Colors.white,
                          strokeWidth: 2,
                          strokeColor: AppStyles.primary,
                        );
                      },
                    ),
                    belowBarData: BarAreaData(show: true, color: AppStyles.primary.withOpacity(0.1)),
                  ),
                ],
                lineTouchData: LineTouchData(
                  touchTooltipData: LineTouchTooltipData(
                    getTooltipItems: (touchedSpots) {
                      return touchedSpots.map((spot) {
                        // FIX: spot.y is already a double
                        return LineTooltipItem(
                          _formatCurrency(spot.y),
                          const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                        );
                      }).toList();
                    },
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActions() {
    return Row(
      children: [
        Expanded(
          child: _actionButton('View Bookings', Icons.list_alt, Colors.blue, () {
            Navigator.pushNamed(context, '/owner/bookings');
          }),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _actionButton('My Vehicles', Icons.directions_car, Colors.green, () {
            Navigator.pushNamed(context, '/owner/vehicles');
          }),
        ),
      ],
    );
  }

  Widget _actionButton(String label, IconData icon, Color color, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: color, size: 20),
            const SizedBox(width: 8),
            Text(
              label,
              style: AppStyles.body(context).copyWith(color: color, fontWeight: FontWeight.w600),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _showCustomDatePicker() async {
    final DateTimeRange? picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
      initialDateRange: _customStartDate != null && _customEndDate != null
          ? DateTimeRange(start: _customStartDate!, end: _customEndDate!)
          : null,
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(primary: AppStyles.primary, onPrimary: Colors.white),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      setState(() {
        _customStartDate = picked.start;
        _customEndDate = picked.end;
        _selectedPeriod = 'custom';
      });
      _loadAnalytics();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Custom range: ${_formatDate(_customStartDate!)} - ${_formatDate(_customEndDate!)}'),
            backgroundColor: AppStyles.primary,
          ),
        );
      }
    }
  }

  Future<void> _refreshData() async {
    await _loadAnalytics();
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Analytics refreshed'),
          duration: Duration(seconds: 1),
          backgroundColor: Colors.green,
        ),
      );
    }
  }

  // FIX: changed parameter from int to double
  String _formatCurrency(double amount) {
    final formatted = amount.toInt().toString().replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (m) => '${m[1]},',
    );
    return '₫$formatted';
  }

  String _formatChartValue(double value) {
    if (value >= 1000000) {
      return '${(value / 1000000).toStringAsFixed(0)}M';
    } else if (value >= 1000) {
      return '${(value / 1000).toStringAsFixed(0)}K';
    }
    return value.toStringAsFixed(0);
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }

  String _formatPeriodLabel(String period) {
    try {
      final date = DateTime.parse(period);
      return '${date.day}/${date.month}';
    } catch (e) {
      return period;
    }
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: AppStyles.textSecondary(context)),
            const SizedBox(height: 16),
            Text('Failed to Load Analytics', style: AppStyles.h2(context), textAlign: TextAlign.center),
            const SizedBox(height: 8),
            Text(_errorMessage ?? 'Please try again', style: AppStyles.body(context), textAlign: TextAlign.center),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: _loadAnalytics,
              style: AppStyles.primaryButtonStyle(context),
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBottomNavBar() {
    return Container(
      decoration: BoxDecoration(
        color: AppStyles.surface(context),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)],
      ),
      child: BottomNavigationBar(
        currentIndex: 0,
        type: BottomNavigationBarType.fixed,
        backgroundColor: AppStyles.surface(context),
        selectedItemColor: AppStyles.primary,
        unselectedItemColor: AppStyles.textSecondary(context),
        onTap: (index) {
          if (index == 0) {
            Navigator.pushReplacementNamed(context, AppRoutes.home);
          } else if (index == 1) {
            Navigator.pushNamed(context, AppRoutes.rentalHistory);
          } else if (index == 2) {
            Navigator.pushNamed(context, AppRoutes.chatList);
          } else if (index == 3) {
            Navigator.pushNamed(context, AppRoutes.profile);
          }
        },
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.directions_car), label: 'Trips'),
          BottomNavigationBarItem(icon: Icon(Icons.chat_bubble_outline), label: 'Chat'),
          BottomNavigationBarItem(icon: Icon(Icons.person_outline), label: 'Profile'),
        ],
      ),
    );
  }
}
