
import axios from 'axios';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');

const PORT = 3456; // Use a different port to avoid conflicts
const BASE_URL = `http://localhost:${PORT}`;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runAudit() {
  console.log('🚀 Starting Security Audit (Dynamic Penetration Test)...');

  // Start Server in Production Mode
  const server = spawn('node', ['server.js'], {
    cwd: ROOT_DIR,
    env: {
      ...process.env,
      PORT: PORT,
      NODE_ENV: 'production',
      SSO_JWT_SECRET: 'audit_secret_key_must_be_long_enough',
      LOG_LEVEL: 'error' // Reduce noise
    },
    stdio: 'pipe' // Capture output
  });

  let serverReady = false;
  server.stdout.on('data', (data) => {
    const msg = data.toString();
    // console.log(`[Server]: ${msg.trim()}`);
    if (msg.includes(`Server is running on port ${PORT}`)) {
      serverReady = true;
    }
  });
  
  server.stderr.on('data', (data) => {
    console.error(`[Server Error]: ${data.toString()}`);
  });

  // Wait for server to start
  console.log('⏳ Waiting for server to start...');
  for (let i = 0; i < 20; i++) {
    if (serverReady) break;
    await sleep(500);
  }

  if (!serverReady) {
    console.error('❌ Server failed to start within 10 seconds.');
    server.kill();
    process.exit(1);
  }
  console.log('✅ Server is up.');

  const results = {
    headers: {},
    rateLimit: false,
    sqli: false,
    xss: false
  };

  try {
    // 1. Check Security Headers
    console.log('\n🔍 Testing Security Headers (Direct Node Access)...');
    // Note: Node app runs at root. Nginx handles /api prefix.
    // So we request /health directly.
    const healthRes = await axios.get(`${BASE_URL}/health`);
    const headers = healthRes.headers;
    
    const csp = headers['content-security-policy'];
    const hsts = headers['strict-transport-security'];
    const xcto = headers['x-content-type-options'];
    const xfo = headers['x-frame-options'];

    console.log(`   CSP: ${csp ? '✅ Present' : '❌ Missing'}`);
    if (csp) console.log(`       Value: ${csp}`);
    
    console.log(`   HSTS: ${hsts ? '✅ Present' : '❌ Missing'}`); // Might be missing if not HTTPS? Helmet usually adds it.
    console.log(`   X-Content-Type-Options: ${xcto ? '✅ Present' : '❌ Missing'}`);
    console.log(`   X-Frame-Options: ${xfo ? '✅ Present' : '❌ Missing'}`);

    if (csp && xcto) results.headers.pass = true;

    // 2. Test SQL Injection
    console.log('\n🔍 Testing SQL Injection...');
    try {
      // Use a payload that would cause a syntax error if not sanitized
      // or bypass auth if vulnerable
      const sqliPayload = "' OR '1'='1";
      const res = await axios.post(`${BASE_URL}/auth/login`, {
        account: sqliPayload,
        password: 'password'
      }, { validateStatus: () => true });

      if (res.status === 500) {
        console.error('   ❌ SQL Injection causing Server Error (500)!');
      } else if (res.status === 200) {
        console.error('   ❌ SQL Injection BYPASSED AUTH (200)!');
      } else {
        console.log(`   ✅ SQL Injection handled correctly (Status: ${res.status})`);
        results.sqli = true;
      }
    } catch (err) {
      console.error('   ⚠️ Error testing SQLi:', err.message);
    }

    // 3. Test Brute Force Lockout
    console.log('\n🔐 Testing Brute Force Lockout...');
    const lockoutAccount = 'lockout_test_' + Date.now(); // Unique account
    // Ensure account doesn't exist (triggers recordFailedAttempt)
    
    let locked = false;
    for (let i = 1; i <= 6; i++) {
      try {
        const res = await axios.post(`${BASE_URL}/auth/login`, {
          account: lockoutAccount,
          password: 'wrong_password'
        }, { validateStatus: () => true });

        if (res.data && res.data.message && res.data.message.includes('锁定')) {
          console.log(`   ✅ Account locked on attempt #${i} (Message: ${res.data.message})`);
          locked = true;
          break;
        } else {
          // console.log(`   Attempt #${i}: ${res.status} - ${res.data.message}`);
        }
      } catch (err) {
        console.error(`   ⚠️ Error on attempt #${i}:`, err.message);
      }
    }

    if (!locked) {
      console.error('   ❌ Account was NOT locked after 6 attempts!');
      results.lockout = false;
    } else {
      results.lockout = true;
    }

    // 4. Test Rate Limiting (Last, as it might block subsequent requests)
    console.log('\n🔍 Testing Rate Limiting (Expect 429 after 60 reqs)...');
    let rateLimitHit = false;
    let successCount = 0;
    const maxReqs = 70;
    
    for (let i = 0; i < maxReqs; i++) {
      try {
        await axios.post(`${BASE_URL}/auth/login`, {
          account: 'test_ratelimit',
          password: 'password'
        });
        successCount++;
      } catch (err) {
        if (err.response && err.response.status === 429) {
          console.log(`   ✅ Rate limit hit at request #${i + 1}`);
          rateLimitHit = true;
          break;
        } else if (err.response && (err.response.status === 400 || err.response.status === 401)) {
             // Expected auth failure
             successCount++;
        } else {
             console.log(`   ⚠️ Unexpected error: ${err.message}`);
        }
      }
    }
    
    if (rateLimitHit) {
        results.rateLimit = true;
    } else {
        console.error('   ❌ Rate limit NOT hit within 70 requests.');
    }
    console.log(`   ℹ️ Successful requests before limit/error: ${successCount}`);

  } catch (err) {
    console.error('❌ Audit failed with error:', err);
  } finally {
    console.log('\n🛑 Stopping Server...');
    server.kill();
  }
}

runAudit();
