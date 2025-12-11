const axios = require("axios");

class NominatimService {
  constructor() {
    this.baseUrl = "https://nominatim.openstreetmap.org";
    this.userAgent = "WizCarRental/1.0";
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        "User-Agent": this.userAgent,
      },
      timeout: 10000,
      // Optional: Add proxy if behind one (uncomment and configure if needed)
      // proxy: {
      //   host: 'your.proxy.host',
      //   port: 8080,
      // },
    });
  }

  // Search for locations
  async search(query, limit = 10) {
    if (!query || typeof query !== "string" || query.trim() === "") {
      throw new Error("Invalid or empty query parameter");
    }

    console.log("Making request with query:", query);
    console.log(
      "Full URL:",
      `${this.baseUrl}/search?q=${encodeURIComponent(
        query
      )}&format=json&limit=${limit}&addressdetails=1`
    );

    try {
      const response = await this.client.get("/search", {
        params: {
          q: query,
          format: "json",
          limit,
          addressdetails: 1,
        },
      });

      return response.data.map(this._formatSearchResult);
    } catch (error) {
      console.error("Nominatim search error:", error); // Log full error object
      if (error.response) {
        console.error("HTTP Status:", error.response.status);
        console.error("Response Data:", error.response.data);
        console.error("Response Headers:", error.response.headers);
      } else if (error.request) {
        console.error("No response received. Request details:", error.request);
      } else {
        console.error("Error setting up request:", error.message);
      }
      throw new Error("Failed to search location");
    }
  }

  // Reverse geocoding
  async reverse(lat, lon) {
    try {
      const response = await this.client.get("/reverse", {
        params: {
          lat,
          lon,
          format: "json",
          addressdetails: 1,
        },
      });

      return this._formatReverseResult(response.data);
    } catch (error) {
      console.error("Nominatim reverse error:", error.message);
      throw new Error("Failed to reverse geocode");
    }
  }

  // Get place details
  async getDetails(placeId) {
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
