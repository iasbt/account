import Redis from "ioredis";
import { config } from "../config/index.js";

const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  // Retry strategy
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  // Don't crash on error
  maxRetriesPerRequest: null
});

redis.on("error", (err) => {
  console.error("Redis error:", err);
});

redis.on("connect", () => {
  console.log("Connected to Redis");
});

const PREFIX = "verify:";

export const setVerificationCode = async (email, code) => {
  // Set with 5 minutes (300 seconds) expiry
  await redis.set(`${PREFIX}${email}`, code, "EX", 300);
};

export const getVerificationCode = async (email) => {
  const code = await redis.get(`${PREFIX}${email}`);
  if (!code) return null;
  // Return in the same format as the old memory store for compatibility
  // The old store returned { code, expires } but we handle expiry in Redis
  // So we just return an object that validates correctly
  // Wait, let's check how it's used.
  // In authController:
  // const storedCode = getVerificationCode(email);
  // if (!storedCode || storedCode.code !== code || Date.now() > storedCode.expires)
  
  // We should adapt the return value or change the controller.
  // Adapting return value:
  return { code, expires: Date.now() + 300000 }; // Fake expiry since Redis handles it
};

export const deleteVerificationCode = async (email) => {
  await redis.del(`${PREFIX}${email}`);
};
