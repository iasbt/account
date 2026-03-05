import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8'));

export const getHealth = (req, res) => {
  const forwardedFor = req.headers['x-forwarded-for'];
  const forwardedValue = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
  const realClientIp = (forwardedValue || "").split(",")[0]?.trim()
    || req.headers["x-real-ip"]
    || req.ip
    || req.socket?.remoteAddress;
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "account-backend",
    version: packageJson.version,
    realClientIp
  });
};
