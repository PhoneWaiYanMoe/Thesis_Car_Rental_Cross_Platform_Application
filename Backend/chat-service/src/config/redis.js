const redis = require("redis");
require("dotenv").config();

let redisClient = null;

const connectRedis = async () => {
  try {
    redisClient = redis.createClient({
      socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
      },
      password: process.env.REDIS_PASSWORD || undefined,
    });

    redisClient.on("error", (err) => {
      console.error("Redis Client Error:", err);
    });

    redisClient.on("connect", () => {
      console.log("Chat Service: Redis connected");
    });

    await redisClient.connect();

    return redisClient;
  } catch (error) {
    console.error("Chat Service: Redis connection failed:", error);
    process.exit(1);
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
