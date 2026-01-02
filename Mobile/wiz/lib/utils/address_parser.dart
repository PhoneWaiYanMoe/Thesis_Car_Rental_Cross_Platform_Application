class AddressParser {
  /// Parse address string into city and district
  /// Handles various address formats from geocoding services
  static Map<String, String> parse(String address) {
    print('🔍 Parsing address: "$address"');

    // Default values
    String city = '';
    String district = '';

    // Split by comma
    final parts = address.split(',').map((e) => e.trim()).where((e) => e.isNotEmpty).toList();
    print('📝 Address parts: $parts');

    // Common patterns:
    // 1. "Street, Ward, District, City, Country"
    // 2. "Nguyen Huu Tho, Phường Tân Hưng, Quận 7, Ho Chi Minh City, Vietnam"

    // STEP 1: Find city (country is usually last)
    int cityIndex = -1;
    
    // Check from right to left (city usually comes before country)
    for (int i = parts.length - 1; i >= 0; i--) {
      final part = parts[i].toLowerCase();
      
      // Check for major Vietnamese cities
      if (part.contains('ho chi minh') || part.contains('hồ chí minh') || part.contains('saigon') || part.contains('sài gòn')) {
        cityIndex = i;
        city = 'Ho Chi Minh City';
        break;
      } else if (part.contains('hanoi') || part.contains('hà nội') || part.contains('ha noi')) {
        cityIndex = i;
        city = 'Hanoi';
        break;
      } else if (part.contains('da nang') || part.contains('đà nẵng') || part.contains('danang')) {
        cityIndex = i;
        city = 'Da Nang';
        break;
      } else if (part == 'vietnam' || part == 'việt nam' || part == 'viet nam') {
        // This is country, not city - continue searching
        continue;
      }
    }

    // STEP 2: Find district (look in parts BEFORE city)
    if (cityIndex > 0) {
      // Check parts before city index
      for (int i = cityIndex - 1; i >= 0; i--) {
        final part = parts[i].toLowerCase();

        // Vietnamese district patterns: "Quận 7", "District 1", "Huyện X"
        if (part.contains('quận') || part.contains('quan') || 
            part.contains('district') || part.contains('huyện') || part.contains('huyen')) {
          
          // Extract district name/number
          final districtMatch = RegExp(r'(quận|quan|district|huyện|huyen)\s*(\d+|\w+)', caseSensitive: false).firstMatch(part);
          if (districtMatch != null) {
            final districtNum = districtMatch.group(2);
            district = int.tryParse(districtNum ?? '') != null ? 'District $districtNum' : parts[i];
            break;
          } else {
            district = parts[i];
            break;
          }
        }
        
        // Check if it's just a ward/commune (Phường, Xã) - skip these
        if (part.contains('phường') || part.contains('phuong') || 
            part.contains('xã') || part.contains('xa') ||
            part.contains('ward') || part.contains('commune')) {
          continue;
        }
      }
    }

    final result = {
      'city': city.isEmpty ? '' : city,
      'district': district.isEmpty ? '' : district,
    };

    print('✅ Parsed result: $result');
    return result;
  }
}