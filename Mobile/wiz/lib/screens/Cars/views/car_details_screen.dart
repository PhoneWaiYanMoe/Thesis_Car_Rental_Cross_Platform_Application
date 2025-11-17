// screens/Cars/views/car_details_screen.dart
import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';

class CarDetailsScreen extends StatefulWidget {
  final Map<String, dynamic> car;
  final Map<String, dynamic> tripData;

  const CarDetailsScreen({super.key, required this.car, required this.tripData});

  @override
  State<CarDetailsScreen> createState() => _CarDetailsScreenState();
}

class _CarDetailsScreenState extends State<CarDetailsScreen> {
  bool _withDriver = false;
  String _travelScope = 'inner';
  String _insurance = '70%';
  String _paymentMethod = 'Choose Payment Method';

  @override
  Widget build(BuildContext context) {
    final car = widget.car;
    final trip = widget.tripData;

    return Scaffold(
      backgroundColor: AppStyles.background(context),
      appBar: AppBar(
        leading: IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
        actions: [
          IconButton(icon: const Icon(Icons.share), onPressed: () {}),
          IconButton(icon: const Icon(Icons.favorite_border), onPressed: () {}),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildCarImage(car['image'] as String),
            const SizedBox(height: 16),
            _buildCarHeader(car),
            const SizedBox(height: 16),
            _buildTripSummary(trip),
            const SizedBox(height: 24),
            _buildDriverToggle(),
            const SizedBox(height: 16),
            _buildTravelScope(),
            const SizedBox(height: 24),
            _buildOwnerInfo(car),
            const SizedBox(height: 24),
            _buildRules(),
            const SizedBox(height: 24),
            _buildLimitsAndFees(),
            const SizedBox(height: 24),
            _buildFeatures(),
            const SizedBox(height: 24),
            _buildInsurance(),
            const SizedBox(height: 24),
            _buildPaymentMethod(),
            const SizedBox(height: 24),
            _buildReviews(),
            const SizedBox(height: 24),
            _buildBottomBar(car['price'] as int),
          ],
        ),
      ),
    );
  }

  Widget _buildCarImage(String image) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: Stack(
        children: [
          Image.asset(image, height: 220, width: double.infinity, fit: BoxFit.cover),
          Positioned(
            top: 12,
            right: 12,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(color: AppStyles.primary, borderRadius: BorderRadius.circular(8)),
              child: Text('1/6', style: AppStyles.caption(context).copyWith(color: Colors.white)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCarHeader(Map car) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Deliver to your location', style: AppStyles.caption(context)),
              const SizedBox(height: 4),
              Text(car['name'] as String, style: AppStyles.h2(context)),
              Text('Automatic', style: AppStyles.body(context)),
              _specRow('Brand', 'BMW'),
              _specRow('Manufacture Year', '2020'),
              _specRow('Mileage Driven', '100,000 km'),
              _specRow('Color', 'Brown'),
            ],
          ),
        ),
        Column(
          children: [
            Row(
              children: [
                const Icon(Icons.star, color: Colors.amber, size: 20),
                const SizedBox(width: 4),
                Text('4.5/5', style: AppStyles.body(context)),
              ],
            ),
            const SizedBox(height: 4),
            Text('BMW', style: AppStyles.caption(context)),
          ],
        ),
      ],
    );
  }

  Widget _specRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: RichText(
        text: TextSpan(
          style: AppStyles.caption(context),
          children: [
            TextSpan(text: '$label: '),
            TextSpan(
              text: value,
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTripSummary(Map trip) {
    return Card(
      color: AppStyles.surface(context),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Location', style: AppStyles.caption(context)),
            const SizedBox(height: 4),
            Text('Nha Be, HCMC', style: AppStyles.body(context)),
            const Divider(height: 24),
            _tripRow(Icons.location_on, 'Pick-up location (fee will be charged)', 'Ton Duc Thang University, Gate 7'),
            const SizedBox(height: 12),
            _tripRow(Icons.calendar_today, 'Date and Time', '9:00 AM, 26/10 – 3:00 PM, 27/10'),
          ],
        ),
      ),
    );
  }

  Widget _tripRow(IconData icon, String title, String subtitle) {
    return Row(
      children: [
        Icon(icon, size: 20, color: AppStyles.textSecondary(context)),
        const SizedBox(width: 8),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: AppStyles.caption(context)),
              Text(subtitle, style: AppStyles.body(context)),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildDriverToggle() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text('Rent with Driver?', style: AppStyles.h3(context)),
        ToggleButtons(
          isSelected: [!_withDriver, _withDriver],
          onPressed: (i) => setState(() => _withDriver = i == 1),
          borderRadius: BorderRadius.circular(8),
          selectedColor: Colors.white,
          fillColor: AppStyles.primary,
          children: const [Text('No'), Text('Yes')],
        ),
      ],
    );
  }

  Widget _buildTravelScope() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Inner City', style: AppStyles.h3(context)),
        const SizedBox(height: 8),
        ToggleButtons(
          isSelected: [_travelScope == 'inner', _travelScope == 'inter', _travelScope == 'interprovincial'],
          onPressed: (i) {
            setState(() {
              _travelScope = ['inner', 'inter', 'interprovincial'][i];
            });
          },
          borderRadius: BorderRadius.circular(8),
          selectedColor: Colors.white,
          fillColor: AppStyles.primary,
          children: const [
            Padding(padding: EdgeInsets.symmetric(horizontal: 16), child: Text('Inner City')),
            Padding(padding: EdgeInsets.symmetric(horizontal: 16), child: Text('In the province')),
            Padding(padding: EdgeInsets.symmetric(horizontal: 16), child: Text('Interprovincial')),
          ],
        ),
      ],
    );
  }

  Widget _buildOwnerInfo(Map car) {
    return Card(
      color: AppStyles.surface(context),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            CircleAvatar(radius: 24, backgroundImage: AssetImage(car['ownerAvatar'] as String)),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(car['owner'] as String, style: AppStyles.h3(context)),
                  Text('Joined on 15/May/2025', style: AppStyles.caption(context)),
                ],
              ),
            ),
            ElevatedButton(onPressed: () {}, child: const Text('View cars')),
          ],
        ),
      ),
    );
  }

  Widget _buildRules() {
    return _sectionCard('Rules By Owner', [
      'Please drive safely and follow traffic rules.',
      'No smoking or pets inside the car.',
      'Return the car clean and with the same fuel level.',
      'Use only A95 petrol when refueling.',
      'Avoid off-road or rough driving.',
    ]);
  }

  Widget _buildLimitsAndFees() {
    return _sectionCard('Additional Fees and Limits', [
      'Daily Mileage Limit: 200 km',
      'Overuse Fee: 3,000 đ/km',
      'Late Return Fee: 50,000 đ/hour',
      'Water → If the car is returned more than 30 minutes late, a 1-hour rate fee will apply.',
    ]);
  }

  Widget _sectionCard(String title, List<String> items) {
    return Card(
      color: AppStyles.surface(context),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: AppStyles.h3(context)),
            const SizedBox(height: 8),
            ...items.map(
              (item) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 2),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('• ', style: TextStyle(fontSize: 16)),
                    Expanded(child: Text(item, style: AppStyles.body(context))),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFeatures() {
    final features = [
      'Screen',
      'Air Conditioning',
      'Leather seats',
      'Sunroof',
      'Airbags',
      'Reverse camera',
      '360 camera',
      'GPS',
      'ABS brakes',
      'Bluetooth',
      'USB port',
      'Phone holder',
      'Child seat',
      'Spare tire',
    ];
    return Card(
      color: AppStyles.surface(context),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.directions_car, size: 20),
                const SizedBox(width: 8),
                Text('Automatic', style: AppStyles.body(context)),
                const Spacer(),
                const Icon(Icons.event_seat, size: 20),
                const SizedBox(width: 8),
                Text('7-seater', style: AppStyles.body(context)),
                const Spacer(),
                const Icon(Icons.local_gas_station, size: 20),
                const SizedBox(width: 8),
                Text('Gasoline', style: AppStyles.body(context)),
              ],
            ),
            const SizedBox(height: 16),
            Text('Additional Features', style: AppStyles.h3(context)),
            const SizedBox(height: 8),
            Wrap(
              spacing: 12,
              runSpacing: 8,
              children: features
                  .map(
                    (f) => Chip(
                      label: Text(f, style: AppStyles.caption(context)),
                      backgroundColor: AppStyles.surface(context),
                    ),
                  )
                  .toList(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInsurance() {
    return Card(
      color: AppStyles.surface(context),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Choose Insurance Type', style: AppStyles.h3(context)),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: ['30%', '50%', '70%', '100%', 'None']
                  .map(
                    (p) => FilterChip(
                      label: Text(p),
                      selected: _insurance == p,
                      onSelected: (_) => setState(() => _insurance = p),
                      selectedColor: AppStyles.primary,
                      checkmarkColor: Colors.white,
                    ),
                  )
                  .toList(),
            ),
            const SizedBox(height: 16),
            Text('Insurance Policy', style: AppStyles.h3(context)),
            const SizedBox(height: 8),
            Text(
              'You may choose to pay 30%, 50%, 70%, or 100% of the rental cost as an insurance fee. In return, the insurance will cover the same percentage of any repair cost that may occur.\n\n'
              '• Insurance is optional and covers only accidental damage.\n'
              '• You must report any accident immediately with clear photos or video.\n'
              '• Violations of traffic laws or intentional damage are not covered.\n'
              '• If you do not select insurance, you will be responsible for all repair costs.',
              style: AppStyles.caption(context),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPaymentMethod() {
    return Card(
      color: AppStyles.surface(context),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            DropdownButtonFormField<String>(
              value: _paymentMethod,
              items: [
                'Choose Payment Method',
                'Momo',
                'ZaloPay',
                'Bank Transfer',
              ].map((m) => DropdownMenuItem(value: m, child: Text(m))).toList(),
              onChanged: (v) => setState(() => _paymentMethod = v!),
              decoration: AppStyles.inputDecoration(hint: '', context: context, icon: Icons.payment),
            ),
            const SizedBox(height: 16),
            Text('Payment Policy', style: AppStyles.h3(context)),
            const SizedBox(height: 8),
            Text(
              '• To start your booking, please pay a 30% deposit of the total rental cost.\n'
              '• The remaining balance will be paid when you receive the car.\n'
              '• After your deposit is made, your booking will be pending owner confirmation.\n'
              '• If the owner accepts, your booking will be confirmed.\n'
              '• If the owner declines, your deposit will be fully refunded within 3 working days.',
              style: AppStyles.caption(context),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildReviews() {
    final reviews = [
      {'name': 'Nguyen Thi A', 'date': '15/May/2025', 'rating': 4.5},
      {'name': 'Nguyen Van A', 'date': '15/May/2025', 'rating': 4.5},
      {'name': 'Pham Thi B', 'date': '15/May/2025', 'rating': 4.5, 'comment': 'Very good car and service!'},
    ];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Rates and Reviews', style: AppStyles.h3(context)),
        const SizedBox(height: 12),
        ...reviews.map(
          (r) => Card(
            color: AppStyles.surface(context),
            margin: const EdgeInsets.only(bottom: 12),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  const CircleAvatar(radius: 20),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(r['name'] as String, style: AppStyles.body(context)),
                        Text(r['date'] as String, style: AppStyles.caption(context)),
                        if (r['comment'] != null) Text(r['comment'] as String, style: AppStyles.caption(context)),
                      ],
                    ),
                  ),
                  Row(
                    children: [
                      const Icon(Icons.star, color: Colors.amber, size: 16),
                      Text('${r['rating']}/5', style: AppStyles.caption(context)),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
        Center(
          child: OutlinedButton(onPressed: () {}, child: const Text('See more')),
        ),
      ],
    );
  }

  Widget _buildBottomBar(int price) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppStyles.surface(context),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
        boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 10)],
      ),
      child: Row(
        children: [
          Text(
            '${price.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},')} đ/day',
            style: AppStyles.h3(context).copyWith(color: AppStyles.primary),
          ),
          const Spacer(),
          SizedBox(
            width: 140,
            child: ElevatedButton(
              style: AppStyles.primaryButtonStyle(context),
              onPressed: () {},
              child: const Text('Continue'),
            ),
          ),
        ],
      ),
    );
  }
}
