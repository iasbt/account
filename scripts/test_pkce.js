import crypto from 'crypto';
import fetch from 'node-fetch';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(rootDir, '.env') });

const pool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'account_system',
  port: parseInt(process.env.DB_PORT || '5432', 10),
});

const BASE_URL = 'http://localhost:3000';
const APP_ID = 'gallery';
const REDIRECT_URI = 'http://localhost:5173/auth/callback';

// 1. Generate PKCE Verifier and Challenge
const generatePKCE = () => {
  const verifier = crypto.randomBytes(32).toString('base64url');
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  return { verifier, challenge };
};

const runTest = async () => {
  console.log('--- Starting PKCE Flow Test ---');

  // Fetch Client Secret
  const res = await pool.query('SELECT secret FROM applications WHERE app_id = $1', [APP_ID]);
  if (res.rowCount === 0) {
    console.error('App not found in DB');
    process.exit(1);
  }
  const CLIENT_SECRET = res.rows[0].secret;
  console.log(`Fetched Client Secret: ${CLIENT_SECRET.substring(0, 4)}...`);

  const { verifier, challenge } = generatePKCE();
  console.log(`Verifier: ${verifier}`);
  console.log(`Challenge: ${challenge}`);

  // 2. Authorize Request
  console.log('\n[Step 1] Requesting Authorization Code...');
  // Note: This requires the server to be running and authenticated via session if protected.
  // But wait, /oauth/authorize is protected by `requireAuth`.
  // My script doesn't have a session cookie.
  // This test will fail unless I mock a session or login first.
  
  // This is becoming complicated for a simple verification script.
  // I should use `supertest` or just manual verification via browser.
  // However, I can simulate the flow if I can bypass auth or login via API.
  // Login first to get cookie?
  
  // Let's login first.
  console.log('\n[Step 0] Logging in to get Session...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ account: 'admin', password: 'password123' }) // Assuming default admin
  });
  
  const loginData = await loginRes.json();
  console.log('Login Response:', loginData);

  if (!loginData.success) {
     console.error('Login failed. Cannot proceed with PKCE test.');
     // Skip if login fails (e.g. wrong password)
     process.exit(1);
  }
  
  const token = loginData.token;
  console.log('Login successful, got token:', token);

  // Now Authorize
  // Note: API might expect Bearer token in header, or Cookie.
  // Let's check requireAuth middleware.
  // It usually checks Authorization header.
  
  const authResponse = await fetch(`${BASE_URL}/oauth/authorize`, {
    method: 'POST',
    headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      client_id: APP_ID,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      code_challenge: challenge,
      code_challenge_method: 'S256'
    })
  });

  const authData = await authResponse.json();
  console.log('Auth Response:', authData);

  if (!authData.redirect_url) {
    console.error('Failed to get redirect_url');
    process.exit(1);
  }

  const redirectUrl = new URL(authData.redirect_url);
  const code = redirectUrl.searchParams.get('code');
  console.log(`Auth Code: ${code}`);

  // 3. Token Exchange (With Correct Verifier)
  console.log('\n[Step 2] Exchanging Code for Token (Correct Verifier)...');
  const tokenResponse = await fetch(`${BASE_URL}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: REDIRECT_URI,
      client_id: APP_ID,
      client_secret: CLIENT_SECRET,
      code_verifier: verifier
    })
  });

  const tokenData = await tokenResponse.json();
  console.log('Token Response:', tokenData);

  if (tokenData.access_token) {
    console.log('✅ PKCE Flow Success!');
  } else {
    console.error('❌ PKCE Flow Failed!');
    process.exit(1);
  }

  // 4. Test Attack (Wrong Verifier)
  console.log('\n[Step 3] Testing Attack (Wrong Verifier)...');
  
  // Get new code
  const authResponse2 = await fetch(`${BASE_URL}/oauth/authorize`, {
    method: 'POST',
    headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      client_id: APP_ID,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      code_challenge: challenge,
      code_challenge_method: 'S256'
    })
  });
  const authData2 = await authResponse2.json();
  const code2 = new URL(authData2.redirect_url).searchParams.get('code');
  
  const wrongVerifierResponse = await fetch(`${BASE_URL}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code: code2,
      redirect_uri: REDIRECT_URI,
      client_id: APP_ID,
      client_secret: CLIENT_SECRET,
      code_verifier: 'wrong-verifier-string'
    })
  });
  
  const wrongData = await wrongVerifierResponse.json();
  console.log('Attack Response:', wrongData);
  
  if (wrongVerifierResponse.status === 400 && wrongData.error === 'invalid_grant') {
     console.log('✅ Attack Blocked Successfully!');
  } else {
     console.error('❌ Attack NOT Blocked!');
     process.exit(1);
  }
  
  await pool.end();
};

runTest().catch(async (err) => {
    console.error(err);
    await pool.end();
});
