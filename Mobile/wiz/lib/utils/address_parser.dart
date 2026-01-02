class AddressParser {
  /// Parse address string into city and district
  /// Handles various address formats from geocoding services
  static Map<String, String> parse(String address) {
    print('🔍 Parsing address: "$address"');

    // Default values
    String city = 'Ho Chi Minh City';
    String district = '';

    // Split by comma
    final parts = address.split(',').map((e) => e.trim()).toList();
    print('📝 Address parts: $parts');

    // Common patterns:
    // 1. "Street, District, City, Country"
    // 2. "Building, Street, District, City, Postal, Country"
    // 3. "Nguyen Huu Tho, Ho Chi Minh City, Vietnam"

    // Look for "Ho Chi Minh" or "Saigon" in any part
    int cityIndex = -1;
    for (int i = 0; i < parts.length; i++) {
      final part = parts[i].toLowerCase();
      if (part.contains('ho chi minh') || part.contains('saigon')) {
        cityIndex = i;
        city = 'Ho Chi Minh City';
        break;
      } else if (part.contains('hanoi') || part.contains('hà nội')) {
        cityIndex = i;
        city = 'Hanoi';
        break;
      } else if (part.contains('da nang') || part.contains('đà nẵng')) {
        cityIndex = i;
        city = 'Da Nang';
        break;
      }
    }

    // If city found, look for district in parts before it
    if (cityIndex > 0) {
      // Check the part immediately before city
      for (int i = cityIndex - 1; i >= 0; i--) {
        final part = parts[i].toLowerCase();

        // Look for "District X" or "Quận X" pattern
        if (part.contains('district') || part.contains('quận') || part.contains('quan')) {
          district = parts[i];
          break;
        }

        // Look for numeric district like "District 1", "Quận 7"
        final districtMatch = RegExp(r'(district|quận|quan)\s*(\d+)', caseSensitive: false).firstMatch(part);
        if (districtMatch != null) {
          district = 'District ${districtMatch.group(2)}';
          break;
        }

        // If part contains just a number, might be district number
        if (part.trim().length <= 2 && int.tryParse(part.trim()) != null) {
          district = 'District ${part.trim()}';
          break;
        }
      }
    }

    // If no district found but we have Ho Chi Minh City, default to District 1
    if (district.isEmpty && city == 'Ho Chi Minh City' && parts.length > 2) {
      // Try to find district from second-to-last part before country
      if (parts.length >= 3) {
        final possibleDistrict = parts[parts.length - 3].toLowerCase();
        if (possibleDistrict.contains('district') || possibleDistrict.contains('quận')) {
          district = parts[parts.length - 3];
        }
      }
    }

    final result = {'city': city, 'district': district.isEmpty ? '' : district};

    print('✅ Parsed result: $result');
    return result;
  }

  /// Extract clean display name from address
  static String getShortName(String address) {
    final parts = address.split(',').map((e) => e.trim()).toList();

    // Return first 2-3 meaningful parts
    if (parts.length >= 3) {
      return '${parts[0]}, ${parts[1]}';
    } else if (parts.length == 2) {
      return parts[0];
    }
    return address;
  }
}
