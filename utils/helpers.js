/**
 * @param {string | undefined} value
 */
export const parseOrigins = (value) =>
  (value || "")
    .split(",")
    .map((/** @type {string} */ item) => item.trim().replace(/\/+$/, ""))
    .filter(Boolean);

export const defaultAllowlist = [
  "https://iasbt.cloud",
  "https://www.iasbt.cloud",
  "https://account.iasbt.cloud",
  "*.vercel.app",
  "http://119.91.71.30",
  "https://119.91.71.30",
  "http://localhost:5170",
  "http://127.0.0.1:5170",
  "http://localhost:5171",
  "http://127.0.0.1:5171",
  "http://localhost:5172",
  "http://127.0.0.1:5172",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
  "http://localhost:5175",
  "http://127.0.0.1:5175",
  "http://localhost:5176",
  "http://127.0.0.1:5176",
  "https://iasbt.cloud/login",
  "https://account.iasbt.cloud/login",
];

/**
 * @param {string | undefined} origin
 * @param {string[]} allowlist
 */
export const isOriginAllowed = (origin, allowlist) => {
  if (!origin) return true;
  const effectiveAllowlist = allowlist.length > 0 ? allowlist : defaultAllowlist;
  
  try {
    const { host, protocol } = new URL(origin);
    return effectiveAllowlist.some((/** @type {string} */ allowed) => {
      if (!allowed) return false;
      if (allowed.includes("*")) {
        const escaped = allowed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(`^${escaped.replace(/\\\*/g, ".*")}$`);
        if (allowed.includes("://")) {
          return regex.test(origin);
        }
        return regex.test(host);
      }
      return origin === allowed || `${protocol}//${host}` === allowed || host === allowed;
    });
  } catch {
    return false;
  }
};

/**
 * @param {string} raw
 */
export const parseAllowlist = (raw) => {
  return raw
    .split(",")
    .map((/** @type {string} */ item) => item.trim())
    .filter(Boolean);
};

/**
 * @param {string} host
 * @param {string[]} allowlist
 */
export const isHostAllowed = (host, allowlist) => {
  if (allowlist.length > 0) {
    return allowlist.some((/** @type {string} */ item) => host === item || host.endsWith(`.${item}`));
  }
  if (host === "iasbt.cloud" || host.endsWith(".iasbt.cloud")) return true;
  if (host === "localhost" || host === "127.0.0.1") return true;
  return false;
};

/**
 * @param {Record<string, any>} headers
 */
export const redactHeaders = (headers) => {
  /** @type {Record<string, any>} */
  const result = {};
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === "authorization") {
      result[key] = "[redacted]";
      continue;
    }
    result[key] = value;
  }
  return result;
};
