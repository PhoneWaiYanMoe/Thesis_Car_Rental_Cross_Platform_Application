// Backend/location-service/src/services/geoapify_service.js
const axios = require("axios");

/**
 * Geoapify Geocoding Service
 * 
 * FREE TIER: 3,000 requests/day (no credit card required)
 * Get API key at: https://www.geoapify.com/
 * 
 * Advantages over LocationIQ/Nominatim:
 * - Better address formatting
 * - More accurate city/district parsing
 * - Faster response times
 * - Better handling of Asian addresses
 */

class GeoapifyService {
  constructor() {
    this.apiKey = process.env.GEOAPIFY_API_KEY;
    this.baseUrl = "https://api.geoapify.com/v1";

    if (!this.apiKey) {
      console.warn(
        "⚠️  GEOAPIFY_API_KEY not set. Get one at https://www.geoapify.com/"
      );
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      validateStatus: (status) => status >= 200 && status < 500,
    });
  }

  /**
   * Search for locations
   */
  async search(query, limit = 10) {
    if (!query || typeof query !== "string" || query.trim() === "") {
      throw new Error("Invalid or empty query parameter");
    }

    if (!this.apiKey) {
      throw new Error("Geoapify API key not configured");
    }

    console.log(`🔍 Geoapify search: "${query}"`);

    try {
      const response = await this.client.get("/geocode/search", {
        params: {
          text: query.trim(),
          apiKey: this.apiKey,
          limit,
          filter: "countrycode:vn", // Focus on Vietnam
          format: "json",
          lang: "en",
        },
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error("Invalid Geoapify API key");
      } else if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please try again later.");
      } else if (response.status >= 400) {
        throw new Error(`Geoapify API error: ${response.status}`);
      }

      const results = response.data.results || [];
      console.log(`✅ Geoapify found ${results.length} results`);

      return results.map((item) => this._formatSearchResult(item));
    } catch (error) {
      console.error("❌ Geoapify search error:", error.message);

      if (error.response) {
        if (error.response.status === 401 || error.response.status === 403) {
          throw new Error("Invalid API key. Check your Geoapify configuration.");
        } else if (error.response.status === 429) {
          throw new Error("Rate limit exceeded. Please wait before retrying.");
        }
      }

      throw new Error(`Failed to search location: ${error.message}`);
    }
  }

  /**
   * Reverse geocoding
   */
  async reverse(lat, lon) {
    if (!this.apiKey) {
      throw new Error("Geoapify API key not configured");
    }

    console.log(`📍 Geoapify reverse: (${lat}, ${lon})`);

    try {
      const response = await this.client.get("/geocode/reverse", {
        params: {
          lat,
          lon,
          apiKey: this.apiKey,
          format: "json",
          lang: "en",
        },
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error("Invalid Geoapify API key");
      } else if (response.status === 429) {
        throw new Error("Rate limit exceeded");
      } else if (response.status >= 400) {
        throw new Error(`Geoapify API error: ${response.status}`);
      }

      const results = response.data.results || [];
      if (results.length === 0) {
        throw new Error("No address found for these coordinates");
      }

      console.log(`✅ Geoapify reverse result: ${results[0].formatted}`);

      return this._formatReverseResult(results[0]);
    } catch (error) {
      console.error("❌ Geoapify reverse error:", error.message);

      if (error.response?.status === 429) {
        throw new Error("Rate limit exceeded. Please wait and try again.");
      }

      throw new Error("Failed to reverse geocode");
    }
  }

  /**
   * Autocomplete (faster for real-time search)
   */
  async autocomplete(query, limit = 5) {
    if (!query || query.length < 2) {
      return [];
    }

    if (!this.apiKey) {
      console.warn("Geoapify API key not configured");
      return [];
    }

    try {
      const response = await this.client.get("/geocode/autocomplete", {
        params: {
          text: query.trim(),
          apiKey: this.apiKey,
          limit,
          filter: "countrycode:vn",
          format: "json",
          lang: "en",
        },
      });

      if (response.status >= 400) {
        return [];
      }

      const results = response.data.results || [];
      return results.map((item) => ({
        placeId: item.place_id || item.osm_id,
        displayName: item.formatted,
        address: item.address || {},
      }));
    } catch (error) {
      console.error("❌ Geoapify autocomplete error:", error.message);
      return [];
    }
  }

  /**
   * Get place details (not directly supported, use reverse geocoding)
   */
  async getDetails(placeId) {
    // Geoapify doesn't have a dedicated details endpoint
    // Try to extract coordinates from place_id if it's an OSM ID
    console.log(`ℹ️  Using reverse geocoding for place details`);
    throw new Error("Place details not directly supported by Geoapify");
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = this._toRad(lat2 - lat1);
    const dLon = this._toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this._toRad(lat1)) *
        Math.cos(this._toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Format search result to match existing API structure
   */
  _formatSearchResult(item) {
    const props = item.properties || {};
    const address = props;

    // Extract city and district properly
    const city = 
      address.city || 
      address.town || 
      address.village || 
      address.municipality ||
      address.county || 
      "Ho Chi Minh City"; // Default for Vietnam

    const district = 
      address.district || 
      address.suburb || 
      address.neighbourhood || 
      address.quarter ||
      "";

    const road = 
      address.street || 
      address.road || 
      address.name ||
      "";

    // Build short name
    let shortName = "";
    if (road && district) {
      shortName = `${road}, ${district}`;
    } else if (road) {
      shortName = road;
    } else if (district) {
      shortName = district;
    } else if (city) {
      shortName = city;
    } else {
      shortName = props.formatted || "Unknown";
    }

    // Build subtitle
    const subtitleParts = [];
    if (district && !road) subtitleParts.push(district);
    if (city) subtitleParts.push(city);
    if (address.country) subtitleParts.push(address.country);

    return {
      placeId: item.place_id || props.place_id || props.osm_id,
      displayName: props.formatted || `${road}, ${district}, ${city}`,
      shortName,
      subtitle: subtitleParts.join(", "),
      latitude: parseFloat(props.lat || item.geometry?.coordinates?.[1] || 0),
      longitude: parseFloat(props.lon || item.geometry?.coordinates?.[0] || 0),
      type: props.type || props.result_type || "unknown",
      address: {
        road,
        suburb: district,
        city,
        country: address.country || "Vietnam",
        postcode: address.postcode || address.postal_code,
      },
    };
  }

  /**
   * Format reverse geocoding result
   */
  _formatReverseResult(data) {
    const props = data.properties || {};
    const address = props;

    const city = 
      address.city || 
      address.town || 
      address.village || 
      address.municipality ||
      address.county || 
      "Ho Chi Minh City";

    const district = 
      address.district || 
      address.suburb || 
      address.neighbourhood || 
      address.quarter ||
      "";

    const road = 
      address.street || 
      address.road || 
      address.name ||
      "";

    let shortName = "";
    if (road && district) {
      shortName = `${road}, ${district}`;
    } else if (road) {
      shortName = road;
    } else if (district) {
      shortName = district;
    } else {
      shortName = city;
    }

    return {
      placeId: data.place_id || props.place_id || props.osm_id,
      displayName: props.formatted || `${road}, ${district}, ${city}`,
      shortName,
      latitude: parseFloat(props.lat || data.geometry?.coordinates?.[1] || 0),
      longitude: parseFloat(props.lon || data.geometry?.coordinates?.[0] || 0),
      address: {
        road,
        suburb: district,
        city,
        country: address.country || "Vietnam",
        postcode: address.postcode || address.postal_code,
      },
    };
  }

  /**
   * Convert degrees to radians
   */
  _toRad(degrees) {
    return degrees * (Math.PI / 180);
  }
}

module.exports = new GeoapifyService();