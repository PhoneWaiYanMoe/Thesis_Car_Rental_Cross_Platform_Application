const redis = require("redis");
require("dotenv").config();

let redisClient = null;

const connectRedis = async (retries = 10, delay = 5000) => {
  try {
    redisClient = redis.createClient({
      socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        reconnectStrategy: (attempts) => {
          if (attempts > 10) return new Error("Max reconnect attempts reached");
          return Math.min(attempts * 1000, 5000);
        },
      },
      password: process.env.REDIS_PASSWORD || undefined,
    });

    redisClient.on("error", (err) => {
      console.error("Redis Client Error:", err);
    });

    redisClient.on("connect", () => {
      console.log("Chat Service: Redis connected");
    });

    redisClient.on("reconnecting", () => {
      console.log("Chat Service: Redis reconnecting...");
    });

    await redisClient.connect();

    return redisClient;
  } catch (error) {
    console.error(`Chat Service: Redis connection failed: ${error.message}`);
    if (retries > 0) {
      console.log(`Retrying in ${delay / 1000}s... (${retries} attempts left)`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return connectRedis(retries - 1, delay);
    } else {
      console.error("Chat Service: Redis connection failed after all retries");
      process.exit(1);
    }
  }
};

const getRedisClient = () => {
  if (!redisClient) {
    throw new Error("Redis client not initialized");
  }
  return redisClient;
};

module.exports = {
  connectRedis,
  getRedisClient,
};
