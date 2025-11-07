import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';

class LocationScreen extends StatefulWidget {
  final String title;
  final String? initialValue;

  const LocationScreen({super.key, required this.title, this.initialValue});

  @override
  State<LocationScreen> createState() => _LocationScreenState();
}

class _LocationScreenState extends State<LocationScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  final List<Map<String, String>> _allLocations = [
    {'title': 'Ton Duc Thang', 'subtitle': 'Đường Tôn Đức Thắng, Phường Bến Nghé, Quận 1, TP.HCM'},
    {'title': 'Ton Duc Thang University', 'subtitle': '19 Nguyễn Hữu Thọ, Tân Hưng, Quận 7, TP.HCM'},
    {'title': 'Nguyen Hue Walking Street', 'subtitle': 'Quận 1, TP.HCM'},
    {'title': 'Bitexco Financial Tower', 'subtitle': '2 Hải Triều, Bến Nghé, Quận 1, TP.HCM'},
  ];

  List<Map<String, String>> get _filteredLocations {
    if (_searchQuery.isEmpty) return _allLocations;
    return _allLocations.where((loc) {
      final title = loc['title']!.toLowerCase();
      final subtitle = loc['subtitle']!.toLowerCase();
      return title.contains(_searchQuery.toLowerCase()) || subtitle.contains(_searchQuery.toLowerCase());
    }).toList();
  }

  String? _selected;

  @override
  void initState() {
    _selected = widget.initialValue;
    super.initState();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppStyles.background(context),
      appBar: AppBar(
        leading: IconButton(icon: const Icon(Icons.arrow_back), onPressed: () => Navigator.pop(context)),
        title: Text(widget.title, style: AppStyles.h2(context)),
        centerTitle: true,
      ),
      body: Column(
        children: [
          // SEARCH BAR
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _searchController,
              onChanged: (value) => setState(() => _searchQuery = value),
              decoration: AppStyles.inputDecoration(hint: 'Search location...', icon: Icons.search, context: context)
                  .copyWith(
                    suffixIcon: _searchQuery.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear),
                            onPressed: () {
                              _searchController.clear();
                              setState(() => _searchQuery = '');
                            },
                          )
                        : null,
                  ),
            ),
          ),

          // CURRENT LOCATION BUTTON
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: ElevatedButton(
              style: AppStyles.primaryButtonStyle(
                context,
              ).copyWith(padding: MaterialStateProperty.all(const EdgeInsets.all(16))),
              onPressed: () {
                // TODO: Get current location
                Navigator.pop(context, 'Current Location');
              },
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.my_location),
                  const SizedBox(width: 8),
                  Text('Choose Current Location', style: AppStyles.button),
                ],
              ),
            ),
          ),

          const SizedBox(height: 16),

          // FILTERED LIST
          Expanded(
            child: _filteredLocations.isEmpty
                ? Center(child: Text('No locations found', style: AppStyles.body(context)))
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: _filteredLocations.length,
                    itemBuilder: (context, i) {
                      final loc = _filteredLocations[i];
                      final isSelected = _selected == loc['title'];
                      return Card(
                        color: AppStyles.surface(context),
                        margin: const EdgeInsets.only(bottom: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        child: ListTile(
                          contentPadding: const EdgeInsets.all(16),
                          leading: Icon(
                            Icons.location_on,
                            color: isSelected ? AppStyles.primary : AppStyles.textSecondary(context),
                          ),
                          title: Text(loc['title']!, style: AppStyles.body(context)),
                          subtitle: Text(loc['subtitle']!, style: AppStyles.caption(context)),
                          trailing: isSelected ? const Icon(Icons.check, color: AppStyles.primary) : null,
                          onTap: () {
                            setState(() => _selected = loc['title']);
                            Navigator.pop(context, loc['title']);
                          },
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
