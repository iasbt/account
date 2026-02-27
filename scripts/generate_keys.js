
import { generateKeyPairSync } from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const certsDir = path.join(__dirname, '../certs');

if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir);
}

const privateKeyPath = path.join(certsDir, 'private.pem');
const publicKeyPath = path.join(certsDir, 'public.pem');

if (fs.existsSync(privateKeyPath) && fs.existsSync(publicKeyPath)) {
  console.log('Keys already exist. Skipping generation.');
  process.exit(0);
}

console.log('Generating RSA Key Pair...');

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem'
  }
});

fs.writeFileSync(privateKeyPath, privateKey);
fs.writeFileSync(publicKeyPath, publicKey);

console.log(`Keys generated successfully in ${certsDir}`);
console.log('Private Key: certs/private.pem');
console.log('Public Key: certs/public.pem');
