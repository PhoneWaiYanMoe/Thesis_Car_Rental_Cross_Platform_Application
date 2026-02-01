const NodeCache = require("node-cache");

// Cache with default TTL from env or 5 minutes
const cache = new NodeCache({
  stdTTL: parseInt(process.env.CACHE_TTL) || 300,
  checkperiod: 120,
});

const getCacheKey = (prefix, params) => {
  const paramString = JSON.stringify(params);
  return `${prefix}:${paramString}`;
};

const getCached = (key) => {
  return cache.get(key);
};

const setCached = (key, data, ttl) => {
  return cache.set(key, data, ttl);
};

const deleteCached = (key) => {
  return cache.del(key);
};

const flushCache = () => {
  return cache.flushAll();
};

module.exports = {
  cache,
  getCacheKey,
  getCached,
  setCached,
  deleteCached,
  flushCache,
};
