import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/screens/Home/views/dateTime_screen.dart';
import 'package:wiz/screens/Home/views/location_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedTab = 0; // 0 = Self Drive, 1 = With Driver
  int _currentArticleIndex = 0;

  // Form data
  String? _location;
  String? _pickup;
  String? _destination;
  Map<String, String>? _dateTime;

  final List<Map<String, String>> _articles = [
    {'title': 'Terms and\nConditions', 'image': 'assets/images/article.png'},
    {'title': 'Cancellation\nrules', 'image': 'assets/images/article_2.png'},
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppStyles.background(context),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildHeader(),
              const SizedBox(height: 24),
              _buildDriveToggle(),
              const SizedBox(height: 24),

              // DYNAMIC FIELDS
              if (_selectedTab == 0) ...[
                _buildLocationField(),
                const SizedBox(height: 16),
                _buildDateTimeField(),
              ] else ...[
                _buildPickupField(),
                const SizedBox(height: 16),
                _buildDestinationField(),
                const SizedBox(height: 16),
                _buildDateTimeField(),
              ],

              const SizedBox(height: 24),
              _buildSearchButton(),
              const SizedBox(height: 32),
              _buildArticlesSection(),
              const SizedBox(height: 32),
              _buildRegisterCTA(),
              const SizedBox(height: 80),
            ],
          ),
        ),
      ),
      bottomNavigationBar: _buildBottomNav(),
    );
  }

  // HEADER
  Widget _buildHeader() {
    return Row(
      children: [
        CircleAvatar(radius: 24, backgroundImage: const AssetImage('assets/images/article_2.png')),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Welcome!', style: AppStyles.caption(context)),
              Text('Jass Myatt', style: AppStyles.h3(context)),
            ],
          ),
        ),
        IconButton(
          icon: Icon(Icons.favorite_border, color: AppStyles.textPrimary(context)),
          onPressed: () {},
        ),
      ],
    );
  }

  // TOGGLE: Self Drive / With Driver
  Widget _buildDriveToggle() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
      decoration: BoxDecoration(color: AppStyles.surface(context), borderRadius: BorderRadius.circular(12)),
      child: Row(
        children: [_tabButton('Self Drive', 0, Icons.directions_car), _tabButton('With Driver', 1, Icons.person)],
      ),
    );
  }

  Widget _tabButton(String text, int index, IconData icon) {
    final isSelected = _selectedTab == index;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() {
          _selectedTab = index;
          // Reset fields on switch
          _location = _pickup = _destination = null;
          _dateTime = null;
        }),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: isSelected ? AppStyles.primary : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 18, color: isSelected ? Colors.white : AppStyles.textSecondary(context)),
              const SizedBox(width: 6),
              Text(
                text,
                style: GoogleFonts.poppins(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: isSelected ? Colors.white : AppStyles.textSecondary(context),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // CLICKABLE FIELDS
  Widget _buildLocationField() {
    return _clickableField(
      icon: Icons.location_on_outlined,
      hint: _location ?? 'Select Location',
      onTap: () => _navigateToLocation('Select Location', (v) => _location = v),
    );
  }

  Widget _buildPickupField() {
    return _clickableField(
      icon: Icons.pin_drop_outlined,
      hint: _pickup ?? 'Pickup Location',
      onTap: () => _navigateToLocation('Pickup Location', (v) => _pickup = v),
    );
  }

  Widget _buildDestinationField() {
    return _clickableField(
      icon: Icons.flag_outlined,
      hint: _destination ?? 'Destination',
      onTap: () => _navigateToLocation('Destination', (v) => _destination = v),
    );
  }

  Widget _buildDateTimeField() {
    final text = _dateTime != null ? '${_dateTime!['start']} - ${_dateTime!['end']}' : 'Select Date & Time';
    return _clickableField(
      icon: Icons.calendar_today,
      hint: text,
      onTap: () async {
        final result = await Navigator.push(context, MaterialPageRoute(builder: (_) => const DateTimeScreen()));
        if (result != null) setState(() => _dateTime = result);
      },
    );
  }

  Future<void> _navigateToLocation(String title, Function(String) onSelect) async {
    final result = await Navigator.push(context, MaterialPageRoute(builder: (_) => LocationScreen(title: title)));
    if (result != null) {
      setState(() => onSelect(result));
    }
  }

  Widget _clickableField({required IconData icon, required String hint, required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        decoration: BoxDecoration(color: AppStyles.surface(context), borderRadius: BorderRadius.circular(12)),
        child: Row(
          children: [
            Icon(icon, color: AppStyles.textSecondary(context), size: 20),
            const SizedBox(width: 12),
            Expanded(child: Text(hint, style: AppStyles.body(context))),
            const Icon(Icons.keyboard_arrow_right, color: Colors.grey),
          ],
        ),
      ),
    );
  }

  // SEARCH BUTTON
  Widget _buildSearchButton() {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        style: AppStyles.primaryButtonStyle(context),
        onPressed: () {
          // TODO: Validate & search
          print('Search: $_selectedTab, Loc: $_location, Pickup: $_pickup, Dest: $_destination, Time: $_dateTime');
        },
        child: Text('Search Car', style: AppStyles.button),
      ),
    );
  }

  // ARTICLES SLIDER
  Widget _buildArticlesSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Articles of Wiz', style: AppStyles.h3(context)),
        const SizedBox(height: 16),
        SizedBox(
          height: 180,
          child: PageView.builder(
            itemCount: _articles.length,
            onPageChanged: (i) => setState(() => _currentArticleIndex = i),
            itemBuilder: (context, index) {
              final article = _articles[index];
              return Container(
                margin: const EdgeInsets.symmetric(horizontal: 8),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  image: DecorationImage(image: AssetImage(article['image']!), fit: BoxFit.cover),
                ),
                child: Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16),
                    gradient: LinearGradient(
                      begin: Alignment.bottomCenter,
                      end: Alignment.topCenter,
                      colors: [Colors.black.withOpacity(0.7), Colors.transparent],
                    ),
                  ),
                  padding: const EdgeInsets.all(16),
                  child: Align(
                    alignment: Alignment.bottomLeft,
                    child: Text(
                      article['title']!,
                      style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                  ),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(
            _articles.length,
            (i) => Container(
              margin: const EdgeInsets.symmetric(horizontal: 4),
              width: 8,
              height: 8,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: _currentArticleIndex == i
                    ? AppStyles.primary
                    : AppStyles.textSecondary(context).withOpacity(0.3),
              ),
            ),
          ),
        ),
      ],
    );
  }

  // REGISTER CTA
  Widget _buildRegisterCTA() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppStyles.surface(context),
        borderRadius: BorderRadius.circular(16),
        image: const DecorationImage(
          image: AssetImage('assets/images/article.png'),
          fit: BoxFit.cover,
          opacity: 0.3,
        ),
      ),
      child: Column(
        children: [
          Text(
            'Do you want to become one of the\npartners of Wiz?',
            textAlign: TextAlign.center,
            style: AppStyles.body(context),
          ),
          const SizedBox(height: 8),
          Text(
            'Many car owners join with Wiz to increase\ntheir monthly income. You can be a part of us.',
            textAlign: TextAlign.center,
            style: AppStyles.caption(context),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            style: AppStyles.primaryButtonStyle(
              context,
            ).copyWith(padding: MaterialStateProperty.all(const EdgeInsets.symmetric(horizontal: 32, vertical: 14))),
            onPressed: () {},
            child: Text('Register Now', style: AppStyles.button),
          ),
        ],
      ),
    );
  }

  // BOTTOM NAV
  Widget _buildBottomNav() {
    return Container(
      decoration: BoxDecoration(
        color: AppStyles.surface(context),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)],
      ),
      child: BottomNavigationBar(
        currentIndex: 0,
        type: BottomNavigationBarType.fixed,
        backgroundColor: Colors.transparent,
        selectedItemColor: AppStyles.primary,
        unselectedItemColor: AppStyles.textSecondary(context),
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
