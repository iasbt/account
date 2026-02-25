import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8'));

export const getHealth = (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "account-backend",
    version: packageJson.version
  });
};
