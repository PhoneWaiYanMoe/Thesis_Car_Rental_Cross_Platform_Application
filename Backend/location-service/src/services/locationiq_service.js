const axios = require("axios");

class LocationIQService {
  constructor() {
    this.apiKey = process.env.LOCATIONIQ_API_KEY;
    this.baseUrl = "https://us1.locationiq.com/v1";

    if (!this.apiKey) {
      console.warn(
        "⚠️  LOCATIONIQ_API_KEY not set. Get one at https://locationiq.com"
      );
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      validateStatus: function (status) {
        return status >= 200 && status < 500;
      },
    });

    this.lastRequestTime = 0;
    this.minRequestInterval = 200; // 200ms between requests (5 requests/second max)
  }

  async _waitForRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  // Search for locations
  async search(query, limit = 10) {
    if (!query || typeof query !== "string" || query.trim() === "") {
      throw new Error("Invalid or empty query parameter");
    }

    if (!this.apiKey) {
      throw new Error("LocationIQ API key not configured");
    }

    await this._waitForRateLimit();

    console.log(`🔍 LocationIQ search: "${query}"`);

    try {
      const response = await this.client.get("/search.php", {
        params: {
          key: this.apiKey,
          q: query.trim(),
          format: "json",
          limit,
          addressdetails: 1,
          countrycodes: "vn", // Focus on Vietnam
          "accept-language": "en",
          dedupe: 1, // Remove duplicate results
        },
      });

      if (response.status === 401) {
        throw new Error("Invalid LocationIQ API key");
      } else if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please try again later.");
      } else if (response.status >= 400) {
        throw new Error(`LocationIQ API error: ${response.status}`);
      }

      if (!Array.isArray(response.data)) {
        throw new Error("Invalid response format from LocationIQ");
      }

      console.log(`✅ LocationIQ found ${response.data.length} results`);

      return response.data.map((item) => this._formatSearchResult(item));
    } catch (error) {
      console.error("LocationIQ search error:", error.message);

      if (error.response) {
        if (error.response.status === 401) {
          throw new Error(
            "Invalid API key. Please check your LocationIQ configuration."
          );
        } else if (error.response.status === 429) {
          throw new Error("Rate limit exceeded. Please wait before retrying.");
        }
      }

      throw new Error(`Failed to search location: ${error.message}`);
    }
  }

  // Reverse geocoding
  async reverse(lat, lon) {
    if (!this.apiKey) {
      throw new Error("LocationIQ API key not configured");
    }

    await this._waitForRateLimit();

    console.log(`📍 LocationIQ reverse: (${lat}, ${lon})`);

    try {
      const response = await this.client.get("/reverse.php", {
        params: {
          key: this.apiKey,
          lat,
          lon,
          format: "json",
          addressdetails: 1,
          "accept-language": "en",
        },
      });

      if (response.status === 401) {
        throw new Error("Invalid LocationIQ API key");
      } else if (response.status === 429) {
        throw new Error("Rate limit exceeded");
      } else if (response.status >= 400) {
        throw new Error(`LocationIQ API error: ${response.status}`);
      }

      console.log(
        `✅ LocationIQ reverse result: ${response.data.display_name}`
      );

      return this._formatReverseResult(response.data);
    } catch (error) {
      console.error("LocationIQ reverse error:", error.message);

      if (error.response?.status === 429) {
        throw new Error("Rate limit exceeded. Please wait and try again.");
      }

      throw new Error("Failed to reverse geocode");
    }
  }

  // Autocomplete (faster for real-time search)
  async autocomplete(query, limit = 5) {
    if (!query || query.length < 2) {
      return [];
    }

    if (!this.apiKey) {
      console.warn("LocationIQ API key not configured");
      return [];
    }

    await this._waitForRateLimit();

    try {
      const response = await this.client.get("/autocomplete.php", {
        params: {
          key: this.apiKey,
          q: query.trim(),
          limit,
          countrycodes: "vn",
          "accept-language": "en",
        },
      });

      if (response.status >= 400) {
        return [];
      }

      if (!Array.isArray(response.data)) {
        return [];
      }

      return response.data.map((item) => ({
        placeId: item.place_id,
        displayName: item.display_name,
        address: item.address || {},
      }));
    } catch (error) {
      console.error("LocationIQ autocomplete error:", error.message);
      return [];
    }
  }

  // Get place details (not available in LocationIQ, fallback to search)
  async getDetails(placeId) {
    console.log(
      `ℹ️  LocationIQ doesn't support place details API. Using search instead.`
    );

    try {
      // Try to get details using the place_id in a search
      // This is a workaround since LocationIQ doesn't have a dedicated details endpoint
      const response = await this.client.get("/search.php", {
        params: {
          key: this.apiKey,
          osm_ids: `N${placeId}`, // Try as node
          format: "json",
          addressdetails: 1,
        },
      });

      if (response.data && response.data[0]) {
        return this._formatSearchResult(response.data[0]);
      }

      throw new Error("Place not found");
    } catch (error) {
      console.error("LocationIQ details error:", error.message);
      throw new Error("Failed to get place details");
    }
  }

  // Calculate distance between two points (Haversine formula)
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
    const distance = R * c;

    return distance;
  }

  // Format search result (compatible with existing code)
  _formatSearchResult(item) {
    const address = item.address || {};

    return {
      placeId: item.place_id,
      displayName: item.display_name,
      shortName: this._getShortName(address),
      subtitle: this._getSubtitle(address),
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      type: item.type || item.class,
      address: {
        road: address.road,
        suburb: address.suburb || address.neighbourhood,
        city: address.city || address.town || address.village,
        country: address.country,
        postcode: address.postcode,
      },
    };
  }

  // Format reverse geocoding result
  _formatReverseResult(data) {
    const address = data.address || {};

    return {
      placeId: data.place_id,
      displayName: data.display_name,
      shortName: this._getShortName(address),
      latitude: parseFloat(data.lat),
      longitude: parseFloat(data.lon),
      address: {
        road: address.road,
        suburb: address.suburb || address.neighbourhood,
        city: address.city || address.town || address.village,
        country: address.country,
        postcode: address.postcode,
      },
    };
  }

  // Get short name from address
  _getShortName(address) {
    if (address.road && address.suburb) {
      return `${address.road}, ${address.suburb}`;
    } else if (address.road) {
      return address.road;
    } else if (address.suburb) {
      return address.suburb;
    } else if (address.city) {
      return address.city;
    }
    return "Unknown";
  }

  // Get subtitle from address
  _getSubtitle(address) {
    const parts = [];

    if (address.suburb && !address.road) {
      parts.push(address.suburb);
    }
    if (address.city) {
      parts.push(address.city);
    }
    if (address.country) {
      parts.push(address.country);
    }

    return parts.join(", ");
  }

  // Convert degrees to radians
  _toRad(degrees) {
    return degrees * (Math.PI / 180);
  }
}

module.exports = new LocationIQService();
