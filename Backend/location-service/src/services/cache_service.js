// Simple in-memory cache
// For production, use Redis
class CacheService {
  constructor() {
    this.cache = new Map();
    this.expirations = new Map();
    
    // Clean up expired items every minute
    setInterval(() => this._cleanExpired(), 60000);
  }

  async get(key) {
    // Check if key exists and hasn't expired
    if (this.cache.has(key)) {
      const expiration = this.expirations.get(key);
      
      if (!expiration || expiration > Date.now()) {
        return this.cache.get(key);
      }
      
      // Remove expired item
      this.cache.delete(key);
      this.expirations.delete(key);
    }
    
    return null;
  }

  async set(key, value, ttlSeconds) {
    this.cache.set(key, value);
    
    if (ttlSeconds) {
      const expiration = Date.now() + (ttlSeconds * 1000);
      this.expirations.set(key, expiration);
    }
    
    return true;
  }

  async delete(key) {
    this.cache.delete(key);
    this.expirations.delete(key);
    return true;
  }

  async clear() {
    this.cache.clear();
    this.expirations.clear();
    return true;
  }

  _cleanExpired() {
    const now = Date.now();
    const expiredKeys = [];
    
    for (const [key, expiration] of this.expirations.entries()) {
      if (expiration && expiration <= now) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => {
      this.cache.delete(key);
      this.expirations.delete(key);
    });
    
    if (expiredKeys.length > 0) {
      console.log(`🧹 Cleaned ${expiredKeys.length} expired cache entries`);
    }
  }

  getStats() {
    return {
      totalKeys: this.cache.size,
      withExpiration: this.expirations.size,
    };
  }
}

module.exports = new CacheService();