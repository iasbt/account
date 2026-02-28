import { getRedisClient } from "./redis.js";

// In-memory fallback for development/testing when Redis is unavailable
const memoryStore = new Map();

export const setVerificationCode = async (email, code) => {
  try {
    const redis = getRedisClient();
    if (redis.status === 'ready') {
      await redis.set(`verify:${email}`, code, "EX", 300);
    } else {
      console.warn("[VerificationStore] Redis not ready, using memory store");
      memoryStore.set(email, { code, expires: Date.now() + 300000 });
    }
  } catch (error) {
    console.error("[VerificationStore] Set error:", error);
    // Fallback to memory
    memoryStore.set(email, { code, expires: Date.now() + 300000 });
  }
};

export const getVerificationCode = async (email) => {
  // 1. Magic Code for Development/Testing
  if (process.env.NODE_ENV !== 'production' && email.startsWith('test')) {
     return { code: '123456', expires: Date.now() + 3600000 };
  }

  try {
    const redis = getRedisClient();
    if (redis.status === 'ready') {
      const code = await redis.get(`verify:${email}`);
      if (!code) return null;
      return { code, expires: Date.now() + 300000 }; // Redis handles expiry, return valid time
    }
  } catch (_error) {
    console.warn("[VerificationStore] Redis error, checking memory store");
  }

  // Fallback to memory store
  const data = memoryStore.get(email);
  if (!data) return null;
  if (Date.now() > data.expires) {
    memoryStore.delete(email);
    return null;
  }
  return data;
};

export const deleteVerificationCode = async (email) => {
  try {
    const redis = getRedisClient();
    if (redis.status === 'ready') {
      await redis.del(`verify:${email}`);
    }
  } catch (e) {
    console.error("Verify Code Error:", e);
    return false;
  }
  
  memoryStore.delete(email);
};
