export const parseOrigins = (value) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export const defaultAllowlist = [
  "https://account.iasbt.com",
  "*.vercel.app",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://account.iasbt.com/login",
];

export const isOriginAllowed = (origin, allowlist) => {
  if (!origin) return true;
  const effectiveAllowlist = allowlist.length > 0 ? allowlist : defaultAllowlist;
  
  try {
    const { host, protocol } = new URL(origin);
    return effectiveAllowlist.some((allowed) => {
      if (!allowed) return false;
      if (allowed.includes("*")) {
        const escaped = allowed.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
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

export const parseAllowlist = (raw) => {
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

export const isHostAllowed = (host, allowlist) => {
  if (allowlist.length > 0) {
    return allowlist.some((item) => host === item || host.endsWith(`.${item}`));
  }
  if (host === "iasbt.com" || host.endsWith(".iasbt.com")) return true;
  if (host === "localhost" || host === "127.0.0.1") return true;
  return false;
};

export const redactHeaders = (headers) => {
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
