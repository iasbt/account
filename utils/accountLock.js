
import { getRedisClient } from "./redis.js";

// In-memory fallback
const memoryStore = new Map();
const LOCK_THRESHOLD = 5;
const LOCK_DURATION = 900; // 15 minutes in seconds
const ATTEMPT_TTL = 900; // 15 minutes window

export const checkLockout = async (account) => {
  const key = `login_attempts:${account}`;
  
  try {
    const redis = getRedisClient();
    if (redis.status === 'ready') {
      const attempts = await redis.get(key);
      if (attempts && parseInt(attempts) >= LOCK_THRESHOLD) {
        const ttl = await redis.ttl(key);
        return { locked: true, remaining: ttl > 0 ? ttl : 0 };
      }
      return { locked: false };
    }
  } catch (error) {
    console.warn("[AccountLock] Redis error:", error.message);
  }

  // Fallback
  const data = memoryStore.get(key);
  if (data) {
    if (Date.now() > data.expires) {
      memoryStore.delete(key);
      return { locked: false };
    }
    if (data.attempts >= LOCK_THRESHOLD) {
      const remaining = Math.ceil((data.expires - Date.now()) / 1000);
      return { locked: true, remaining };
    }
  }
  return { locked: false };
};

export const recordFailedAttempt = async (account) => {
  const key = `login_attempts:${account}`;
  
  try {
    const redis = getRedisClient();
    if (redis.status === 'ready') {
      const attempts = await redis.incr(key);
      if (attempts === 1) {
        await redis.expire(key, ATTEMPT_TTL);
      }
      // If threshold reached, ensure TTL is set (refresh lock duration or keep existing?)
      // Usually we want to lock for duration FROM the last failed attempt or from the threshold crossing.
      // Here we just keep the TTL of the window, or extend it if we want strict lockout.
      // Let's ensure if it hits threshold, we set/refresh TTL to LOCK_DURATION.
      if (attempts >= LOCK_THRESHOLD) {
        await redis.expire(key, LOCK_DURATION);
      }
      return attempts;
    }
  } catch (error) {
    console.warn("[AccountLock] Redis error:", error.message);
  }

  // Fallback
  let data = memoryStore.get(key);
  const now = Date.now();
  if (!data || now > data.expires) {
    data = { attempts: 0, expires: now + ATTEMPT_TTL * 1000 };
  }
  data.attempts += 1;
  if (data.attempts >= LOCK_THRESHOLD) {
    data.expires = now + LOCK_DURATION * 1000;
  }
  memoryStore.set(key, data);
  return data.attempts;
};

export const resetAttempts = async (account) => {
  const key = `login_attempts:${account}`;
  
  try {
    const redis = getRedisClient();
    if (redis.status === 'ready') {
      await redis.del(key);
    }
  } catch (error) {
    console.warn("[AccountLock] Redis error:", error.message);
  }

  memoryStore.delete(key);
};
