import Redis from "ioredis";
import { config } from "../config/index.js";
import { logger } from "../middlewares/logger.js";

// Use singleton pattern for Redis connection
let redisClient = null;

export const getRedisClient = () => {
  if (!redisClient) {
    redisClient = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      // Retry strategy: wait 1s, then 2s, then 4s... max 30s
      retryStrategy: (times) => {
        const delay = Math.min(times * 1000, 30000);
        return delay;
      },
      // Don't crash on error
      maxRetriesPerRequest: null,
      // Reconnect automatically
      reconnectOnError: (err) => {
        const targetError = "READONLY";
        if (err.message.includes(targetError)) {
          // Only reconnect when the error is "READONLY"
          return true;
        }
        return false;
      }
    });

    redisClient.on("error", (err) => {
      // Suppress connection errors to avoid flooding logs in dev
      if (err.code === 'ECONNREFUSED') {
         // console.warn("[Redis] Connection refused (Is Redis running?)");
         return;
      }
      logger.error({ event: "redis_connection_error", error: err.message });
    });

    redisClient.on("connect", () => {
      logger.info({ event: "redis_connected" });
    });
  }
  return redisClient;
};

// Token Blacklist Prefix
const BLACKLIST_PREFIX = "token_blacklist:";

/**
 * Add token to blacklist
 * @param {string} token - The JWT token to blacklist
 * @param {number} expiresInSeconds - Time until token expiration (TTL)
 */
export const addToBlacklist = async (token, expiresInSeconds) => {
  if (!token || !expiresInSeconds) return;
  try {
    const client = getRedisClient();
    if (client.status !== 'ready') return;
    // Set key with expiration matches the token's remaining life
    await client.set(`${BLACKLIST_PREFIX}${token}`, "1", "EX", Math.ceil(expiresInSeconds));
  } catch (error) {
    logger.warn({ event: "redis_blacklist_add_failed", error: error.message });
  }
};

/**
 * Check if token is in blacklist
 * @param {string} token 
 * @returns {Promise<boolean>}
 */
export const isBlacklisted = async (token) => {
  if (!token) return false;
  try {
    const client = getRedisClient();
    // Skip if not connected to avoid hanging
    if (client.status !== 'ready') {
      // console.warn("[Redis] Client not ready, skipping blacklist check");
      return false; 
    }
    const result = await client.get(`${BLACKLIST_PREFIX}${token}`);
    return result === "1";
  } catch (error) {
    logger.warn({ event: "redis_blacklist_check_failed", error: error.message });
    return false;
  }
};
