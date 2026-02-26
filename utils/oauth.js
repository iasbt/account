import { getRedisClient } from "./redis.js";
import { randomBytes } from "crypto";

const CODE_PREFIX = "oauth:code:";
const CODE_TTL = 300; // 5 minutes

/**
 * Generate a secure authorization code
 */
export const generateAuthCode = () => {
  return randomBytes(16).toString("hex");
};

/**
 * Store authorization code
 * @param {string} code 
 * @param {object} data { userId, clientId, redirectUri, scope, codeChallenge }
 */
export const storeAuthCode = async (code, data) => {
  const client = getRedisClient();
  await client.set(
    `${CODE_PREFIX}${code}`, 
    JSON.stringify(data), 
    "EX", 
    CODE_TTL
  );
};

/**
 * Get and validate authorization code
 * @param {string} code 
 * @returns {Promise<object|null>}
 */
export const getAuthCode = async (code) => {
  const client = getRedisClient();
  const data = await client.get(`${CODE_PREFIX}${code}`);
  return data ? JSON.parse(data) : null;
};

/**
 * Invalidate authorization code (prevent reuse)
 * @param {string} code 
 */
export const invalidateAuthCode = async (code) => {
  const client = getRedisClient();
  await client.del(`${CODE_PREFIX}${code}`);
};
