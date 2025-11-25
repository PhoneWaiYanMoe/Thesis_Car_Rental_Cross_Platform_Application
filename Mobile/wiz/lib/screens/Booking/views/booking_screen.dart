import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/screens/Booking/views/widgets/_buildCarHeader.dart';
import 'package:wiz/screens/Booking/views/widgets/_buildRenterInfo.dart';
import 'package:wiz/screens/Auth/services/auth_service.dart';
import 'package:wiz/screens/Cars/views/widgets/_buildCarOwnerInfo.dart';
import 'package:wiz/screens/Cars/views/widgets/_buildTripSummary.dart';
import 'package:wiz/screens/Booking/models/booking_data.dart';
class BookingScreen extends StatefulWidget {
  final Map<String, dynamic> arguments;

  const BookingScreen({super.key, required this.arguments});

  @override
  State<BookingScreen> createState() => _BookingScreenState();
}

class _BookingScreenState extends State<BookingScreen> {
  bool _agreedToTerms = false;
  final TextEditingController _messageController = TextEditingController();
  final _authService = AuthService();
  String _userName = '';
  String _licenseNumber = '';

  late BookingData _bookingData;

  @override
  void initState() {
    super.initState();
    _bookingData = BookingData.fromMap(widget.arguments);
    _loadUserInfo();
  }

  Future<void> _loadUserInfo() async {
    final userInfo = await _authService.getUserInfo();
    setState(() {
      _userName = userInfo['userName'] ?? 'Guest';
      _licenseNumber = userInfo['licenseNumber'] ?? '****00';
    });
  }

  @override
  void dispose() {
    _messageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final car = _bookingData.car;
    final rentalPrice = _bookingData.rentalPrice;
    final insuranceFee = _bookingData.insuranceFee;
    final total = _bookingData.totalPrice;
    final depositPayment = _bookingData.depositAmount;
    final remainingPayment = _bookingData.remainingAmount;

    return Scaffold(
      backgroundColor: AppStyles.background(context),
      appBar: AppBar(
        leading: IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
        title: Text('Booking Details', style: AppStyles.h2(context)),
        centerTitle: true,
        backgroundColor: AppStyles.background(context),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            CarHeader(car: car),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  RenterInfo(licenseNumber: _licenseNumber, userName: _userName),
                  const SizedBox(height: 16),
                  _buildDriveMode(),
                  const SizedBox(height: 16),
                  BuildTripSummary(bookingData: _bookingData),
                  const SizedBox(height: 16),
                  _buildLocationSection(),
                  const SizedBox(height: 16),
                  OwnerInfoCard(
                    ownerName: car.owner,
                    ownerAvatarAsset: car.ownerAvatar,
                    joinedDate: car.ownerJoinedDate,
                    onViewCarsPressed: () {},
                  ),
                  const SizedBox(height: 16),
                  _buildMessageSection(),
                  const SizedBox(height: 24),
                  _buildBillingDetails(rentalPrice, insuranceFee, total, depositPayment, remainingPayment),
                  const SizedBox(height: 24),
                  _buildRentalGuidelines(),
                  const SizedBox(height: 16),
                  _buildTermsCheckbox(),
                  const SizedBox(height: 24),
                  _buildBookButton(),
                  const SizedBox(height: 32),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDriveMode() {
    return Card(
      color: AppStyles.surface(context),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Icon(_bookingData.withDriver ? Icons.person : Icons.directions_car, color: AppStyles.primary),
            const SizedBox(width: 12),
            Text(_bookingData.mode, style: AppStyles.body(context).copyWith(fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }

  Widget _buildLocationSection() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Card(
        color: AppStyles.surface(context),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (_bookingData.withDriver) ...[
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Pick-up location (drive):', style: AppStyles.caption(context)),
                    SizedBox(width: 16),
                    Text(
                      _bookingData.pickup ?? 'No pickup location selected',
                      style: AppStyles.body(context).copyWith(fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Drop-off location:', style: AppStyles.caption(context)),
                    SizedBox(width: 16),
                    Text(
                      _bookingData.destination ?? 'No destination selected',
                      style: AppStyles.body(context).copyWith(fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
              ] else ...[
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Self Pick-up location:', style: AppStyles.caption(context)),
                    Text(
                      _bookingData.location ?? 'No location selected',
                      style: AppStyles.body(context).copyWith(fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMessageSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Additional Message to Owner', style: AppStyles.h3(context)),
        const SizedBox(height: 12),
        TextField(
          controller: _messageController,
          maxLines: 5,
          decoration: InputDecoration(
            hintText: 'Write message here',
            hintStyle: AppStyles.caption(context).copyWith(color: Colors.grey),
            filled: true,
            fillColor: AppStyles.surface(context),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
          ),
        ),
      ],
    );
  }

  Widget _buildBillingDetails(int rentalPrice, int insuranceFee, int total, int deposit, int remaining) {
    return Card(
      color: AppStyles.surface(context),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Billing Details', style: AppStyles.h3(context)),
            const SizedBox(height: 16),
            _buildBillingRow('Rental Price (${_bookingData.days} days)', '${_formatPrice(rentalPrice)} ₫'),
            const SizedBox(height: 8),
            _buildBillingRow('Insurance Fee', '${_formatPrice(insuranceFee)} ₫'),
            const Divider(height: 24),
            _buildBillingRow('Total', '${_formatPrice(total)} ₫', isTotal: true),
            const SizedBox(height: 16),
            _buildBillingRow('Deposit Payment (30%)', '${_formatPrice(deposit)} ₫'),
            const SizedBox(height: 8),
            _buildBillingRow('Payment after receiving Car', '${_formatPrice(remaining)} ₫'),
          ],
        ),
      ),
    );
  }

  Widget _buildBillingRow(String label, String value, {bool isTotal = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: isTotal ? AppStyles.body(context).copyWith(fontWeight: FontWeight.bold) : AppStyles.caption(context),
        ),
        Text(
          value,
          style: isTotal
              ? AppStyles.h3(context).copyWith(color: AppStyles.primary)
              : AppStyles.body(context).copyWith(fontWeight: FontWeight.w600),
        ),
      ],
    );
  }

  Widget _buildRentalGuidelines() {
    final guidelines = [
      'Inspect the car carefully before driving.',
      'Take photos of the car\'s condition.',
      'Refill fuel before returning.',
      'Return the car on time.',
      'Follow all traffic rules.',
      'Report any damage or issue immediately.',
      'Don\'t smoke inside the car.',
      'Don\'t let unauthorized people drive.',
      'Don\'t use the car for racing or off-road.',
      'Don\'t ignore warning lights.',
    ];

    return Card(
      color: AppStyles.surface(context),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Rental Guidelines', style: AppStyles.h3(context)),
            const SizedBox(height: 12),
            ...guidelines.map(
              (guideline) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('• ', style: TextStyle(fontSize: 16)),
                    Expanded(child: Text(guideline, style: AppStyles.caption(context))),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTermsCheckbox() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Checkbox(
              value: _agreedToTerms,
              onChanged: (value) => setState(() => _agreedToTerms = value ?? false),
              activeColor: AppStyles.primary,
            ),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 12),
                  GestureDetector(
                    onTap: () {},
                    child: RichText(
                      text: TextSpan(
                        style: AppStyles.caption(context),
                        children: [
                          const TextSpan(text: 'Read '),
                          TextSpan(
                            text: 'the cancellation policy',
                            style: TextStyle(color: AppStyles.primary, fontWeight: FontWeight.w600),
                          ),
                          const TextSpan(text: '.'),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  GestureDetector(
                    onTap: () {},
                    child: RichText(
                      text: TextSpan(
                        style: AppStyles.caption(context),
                        children: [
                          const TextSpan(text: 'I have read and agreed to '),
                          TextSpan(
                            text: 'terms and conditions',
                            style: TextStyle(color: AppStyles.primary, fontWeight: FontWeight.w600),
                          ),
                          const TextSpan(text: '.'),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildBookButton() {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        style: AppStyles.primaryButtonStyle(context),
        onPressed: _agreedToTerms ? () => _showBookingConfirmation() : null,
        child: Text('Book', style: AppStyles.button),
      ),
    );
  }

  void _showBookingConfirmation() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppStyles.surface(context),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text('Booking Confirmed!', style: AppStyles.h2(context)),
        content: Text(
          'Your booking has been submitted. The owner will review and respond shortly.',
          style: AppStyles.body(context),
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              Navigator.pop(context);
            },
            child: Text('OK', style: TextStyle(color: AppStyles.primary)),
          ),
        ],
      ),
    );
  }

  String _formatPrice(int price) {
    return price.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (match) => '${match[1]},');
  }
}
