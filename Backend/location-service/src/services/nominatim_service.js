const axios = require("axios");

class NominatimService {
  constructor() {
    this.baseUrl = "https://nominatim.openstreetmap.org";
    this.userAgent = "WizCarRental/1.0 (contact@yourapp.com)"; 
    this.lastRequestTime = 0;
    this.minRequestInterval = 1000; 

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        "User-Agent": this.userAgent,
        Referer: "http://localhost:3003", 
      },
      timeout: 10000,
    });
  }

  // Add rate limiting
  async _waitForRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      console.log(`⏱️  Rate limiting: waiting ${waitTime}ms`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  // Search for locations
  async search(query, limit = 10) {
    if (!query || typeof query !== "string" || query.trim() === "") {
      throw new Error("Invalid or empty query parameter");
    }

    // Wait to respect rate limit
    await this._waitForRateLimit();

    console.log("Making request with query:", query);

    try {
      const response = await this.client.get("/search", {
        params: {
          q: query,
          format: "json",
          limit,
          addressdetails: 1,
          "accept-language": "en", // Request English results
        },
      });

      // Fix: Use arrow function to preserve 'this' context
      return response.data.map((item) => this._formatSearchResult(item));
    } catch (error) {
      console.error("Nominatim search error:", error.message);

      if (error.response) {
        console.error("HTTP Status:", error.response.status);
        console.error("Response Data:", error.response.data);

        if (error.response.status === 418) {
          throw new Error(
            "Rate limit exceeded. Please wait a moment and try again."
          );
        } else if (error.response.status === 429) {
          throw new Error("Too many requests. Please try again later.");
        }
      } else if (error.request) {
        console.error("No response received");
        throw new Error("Network error: Unable to reach location service");
      }

      throw new Error("Failed to search location");
    }
  }

  // Reverse geocoding
  async reverse(lat, lon) {
    await this._waitForRateLimit();

    try {
      const response = await this.client.get("/reverse", {
        params: {
          lat,
          lon,
          format: "json",
          addressdetails: 1,
          "accept-language": "en",
        },
      });

      return this._formatReverseResult(response.data);
    } catch (error) {
      console.error("Nominatim reverse error:", error.message);

      if (error.response?.status === 418 || error.response?.status === 429) {
        throw new Error("Rate limit exceeded. Please wait and try again.");
      }

      throw new Error("Failed to reverse geocode");
    }
  }

  // Get place details
  async getDetails(placeId) {
    await this._waitForRateLimit();

    try {
      const response = await this.client.get("/details", {
        params: {
          place_id: placeId,
          format: "json",
        },
      });

      return response.data;
    } catch (error) {
      console.error("Nominatim details error:", error.message);
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

  // Format search result
  _formatSearchResult(item) {
    const address = item.address || {};

    return {
      placeId: item.place_id,
      displayName: item.display_name,
      shortName: this._getShortName(address),
      subtitle: this._getSubtitle(address),
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      type: item.type,
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

module.exports = new NominatimService();
