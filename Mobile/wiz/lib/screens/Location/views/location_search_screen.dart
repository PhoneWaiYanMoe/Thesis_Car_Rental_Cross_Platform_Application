import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/screens/Location/services/location_api_service.dart';
import 'package:wiz/services/location_service.dart';
import 'package:latlong2/latlong.dart';

class LocationSearchScreen extends StatefulWidget {
  final String title;

  const LocationSearchScreen({super.key, required this.title});

  @override
  State<LocationSearchScreen> createState() => _LocationSearchScreenState();
}

class _LocationSearchScreenState extends State<LocationSearchScreen> {
  final TextEditingController _searchController = TextEditingController();
  final LocationApiService _locationApiService = LocationApiService();
  final LocationService _locationService = LocationService();

  List<SearchResult> _searchResults = [];
  List<HistoryItem> _searchHistory = [];
  bool _isSearching = false;
  bool _showHistory = true;

  @override
  void initState() {
    super.initState();
    _loadSearchHistory();
    _searchController.addListener(_onSearchChanged);
  }

  Future<void> _loadSearchHistory() async {
    final history = await _locationApiService.getSearchHistory(limit: 10);
    if (mounted) {
      setState(() => _searchHistory = history);
      print('📚 [SCREEN] Loaded ${history.length} items from backend');
    }
  }

  void _onSearchChanged() {
    final query = _searchController.text.trim();

    if (query.isEmpty) {
      setState(() {
        _showHistory = true;
        _searchResults = [];
        _isSearching = false;
      });
      return;
    }

    if (query.length < 2) {
      setState(() {
        _showHistory = false;
        _searchResults = [];
        _isSearching = false;
      });
      return;
    }

    setState(() {
      _showHistory = false;
      _isSearching = true;
    });

    // Debounce: wait 500ms before searching
    Future.delayed(const Duration(milliseconds: 500), () {
      if (_searchController.text.trim() == query && mounted) {
        _performSearch(query);
      }
    });
  }

  Future<void> _performSearch(String query) async {
    try {
      print('🔍 [SCREEN] Searching for: "$query"');

      final results = await _locationApiService.searchLocation(query);

      if (mounted) {
        setState(() {
          _searchResults = results;
          _isSearching = false;
        });
        print('✅ [SCREEN] Received ${results.length} results');
      }
    } catch (e) {
      print('❌ [SCREEN] Search failed: $e');
      if (mounted) {
        setState(() => _isSearching = false);
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Search failed: ${e.toString()}'), backgroundColor: Colors.red));
      }
    }
  }

  Future<void> _handleCurrentLocation() async {
    setState(() => _isSearching = true);

    try {
      final position = await _locationService.getCurrentPosition();

      if (position == null) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Unable to get current location. Please check location permissions.'),
              backgroundColor: Colors.red,
            ),
          );
        }
        setState(() => _isSearching = false);
        return;
      }

      final address = await _locationApiService.reverseGeocode(position);

      if (address != null && mounted) {
        final result = SearchResult(
          placeId: 'current_location',
          displayName: address,
          position: position,
          type: 'current_location',
        );

        final displayName = address.trim().isNotEmpty ? address : 'Current Location';
        final subtitle = address.split(',').skip(1).join(',').trim();

        await _locationApiService.saveToHistory(
          displayName: displayName,
          shortName: 'Current Location',
          subtitle: subtitle.isNotEmpty ? subtitle : 'Current Location',
          latitude: position.latitude,
          longitude: position.longitude,
        );

        Navigator.pop(context, result);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error: ${e.toString()}'), backgroundColor: Colors.red));
      }
    } finally {
      if (mounted) {
        setState(() => _isSearching = false);
      }
    }
  }

  Future<void> _handleResultTap(SearchResult result) async {
    final displayName = result.displayName.trim().isNotEmpty
        ? result.displayName
        : result.shortName.trim().isNotEmpty
        ? result.shortName
        : 'Unknown Location';

    await _locationApiService.saveToHistory(
      displayName: displayName,
      shortName: result.shortName,
      subtitle: result.subtitle,
      latitude: result.position.latitude,
      longitude: result.position.longitude,
    );

    if (mounted) {
      Navigator.pop(context, result);
    }
  }

  Future<void> _handleHistoryTap(HistoryItem item) async {
    final result = item.toSearchResult();

    final displayName = item.displayName.trim().isNotEmpty
        ? item.displayName
        : item.shortName.trim().isNotEmpty
        ? item.shortName
        : 'Unknown Location';

    await _locationApiService.saveToHistory(
      displayName: displayName,
      shortName: item.shortName,
      subtitle: item.subtitle,
      latitude: item.position.latitude,
      longitude: item.position.longitude,
    );

    if (mounted) {
      Navigator.pop(context, result);
    }
  }

  Future<void> _clearHistory() async {
    final success = await _locationApiService.clearHistory();
    if (success) {
      setState(() => _searchHistory = []);
    }
  }

  Future<void> _deleteHistoryItem(HistoryItem item) async {
    final success = await _locationApiService.deleteFromHistory(item.id);
    if (success) {
      _loadSearchHistory();
    }
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
        backgroundColor: AppStyles.background(context),
        elevation: 0,
        leading: IconButton(icon: const Icon(Icons.arrow_back), onPressed: () => Navigator.pop(context)),
        title: Text(widget.title, style: AppStyles.h2(context)),
        centerTitle: true,
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _searchController,
              autofocus: true,
              decoration: AppStyles.inputDecoration(hint: 'Search location...', icon: Icons.search, context: context)
                  .copyWith(
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(icon: const Icon(Icons.clear), onPressed: () => _searchController.clear())
                        : null,
                  ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: ElevatedButton.icon(
              style: AppStyles.primaryButtonStyle(
                context,
              ).copyWith(padding: WidgetStateProperty.all(const EdgeInsets.all(16))),
              onPressed: _isSearching ? null : _handleCurrentLocation,
              icon: _isSearching
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                    )
                  : const Icon(Icons.my_location),
              label: Text('Use Current Location', style: AppStyles.button),
            ),
          ),
          const SizedBox(height: 16),
          Expanded(child: _buildContent()),
        ],
      ),
    );
  }

  Widget _buildContent() {
    if (_isSearching && !_showHistory) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_showHistory) {
      return _buildSearchHistory();
    }

    if (_searchResults.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.search_off, size: 64, color: AppStyles.textSecondary(context).withOpacity(0.5)),
            const SizedBox(height: 16),
            Text('No locations found', style: AppStyles.body(context)),
          ],
        ),
      );
    }

    return _buildSearchResults();
  }

  Widget _buildSearchResults() {
    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      itemCount: _searchResults.length,
      itemBuilder: (context, index) {
        final result = _searchResults[index];
        return Card(
          color: AppStyles.surface(context),
          margin: const EdgeInsets.only(bottom: 12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          child: ListTile(
            contentPadding: const EdgeInsets.all(16),
            leading: Icon(Icons.location_on, color: AppStyles.primary),
            title: Text(result.shortName, style: AppStyles.body(context)),
            subtitle: Text(result.subtitle, style: AppStyles.caption(context)),
            onTap: () => _handleResultTap(result),
          ),
        );
      },
    );
  }

  Widget _buildSearchHistory() {
    if (_searchHistory.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.history, size: 64, color: AppStyles.textSecondary(context).withOpacity(0.5)),
            const SizedBox(height: 16),
            Text('No search history', style: AppStyles.body(context)),
            Text('Your recent searches will appear here', style: AppStyles.caption(context)),
          ],
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Recent Searches (${_searchHistory.length})', style: AppStyles.h3(context)),
              TextButton(
                onPressed: _clearHistory,
                child: const Text('Clear All', style: TextStyle(color: Colors.red)),
              ),
            ],
          ),
        ),
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: _searchHistory.length,
            itemBuilder: (context, index) {
              final item = _searchHistory[index];
              return Card(
                color: AppStyles.surface(context),
                margin: const EdgeInsets.only(bottom: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                child: ListTile(
                  contentPadding: const EdgeInsets.all(16),
                  leading: Icon(Icons.history, color: AppStyles.textSecondary(context)),
                  title: Text(item.shortName, style: AppStyles.body(context)),
                  subtitle: Text(item.subtitle, style: AppStyles.caption(context)),
                  trailing: IconButton(
                    icon: const Icon(Icons.close, size: 20),
                    onPressed: () => _deleteHistoryItem(item),
                  ),
                  onTap: () => _handleHistoryTap(item),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}
