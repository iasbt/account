import fetch from 'node-fetch';
import crypto from 'crypto';

// Direct access to Node.js server (bypassing Nginx rewrite)
// Nginx rewrites /api/xxx -> /xxx, so here we use /xxx directly
const API_URL = 'http://localhost:3000';

async function run() {
  const randomSuffix = crypto.randomInt(1000, 9999);
  const email = `testuser_${randomSuffix}@example.com`;
  const password = 'Password123!';
  const name = `TestUser${randomSuffix}`;

  console.log(`Testing with user: ${email}`);

  // 1. Register
  console.log('1. Registering...');
  const regRes = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name, code: '123456' }) // Assuming code validation is bypassed or mocked?
    // Wait, register endpoint checks verification code?
    // Let's check authController.js. If it requires code, I might need to generate one or bypass.
    // But for now let's try.
  });

  if (regRes.status !== 201 && regRes.status !== 200) {
    const text = await regRes.text();
    console.log('Register failed:', regRes.status, text);
    // Try login directly if user exists?
    // Or maybe verification code is needed.
    // If so, I need to request code first.
  } else {
    console.log('Register success:', await regRes.json());
  }

  // 2. Login
  console.log('2. Logging in...');
  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ account: email, password })
  });

  if (!loginRes.ok) {
    console.error('Login failed:', loginRes.status, await loginRes.text());
    return;
  }

  const loginData = await loginRes.json();
  const token = loginData.token;
  console.log('Login success. Token:', token.substring(0, 20) + '...');

  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  // 3. Get Preferences
  console.log('3. Get Preferences...');
  const prefRes = await fetch(`${API_URL}/user/preferences`, { headers });
  if (prefRes.ok) {
    console.log('Preferences:', await prefRes.json());
  } else {
    console.error('Get Preferences failed:', prefRes.status, await prefRes.text());
  }

  // 4. Update Preferences
  console.log('4. Update Preferences...');
  const updatePrefRes = await fetch(`${API_URL}/user/preferences`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      hasAcceptedTerms: true,
      hasSeenOnboarding: true,
      categoryOrder: ['cat1', 'cat2']
    })
  });
  if (updatePrefRes.ok) {
    console.log('Update Preferences success:', await updatePrefRes.json());
  } else {
    console.error('Update Preferences failed:', updatePrefRes.status, await updatePrefRes.text());
  }

  // 5. Create Category (Gallery)
  console.log('5. Create Category...');
  const catRes = await fetch(`${API_URL}/categories`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: 'My Category', color: '#ff0000' })
  });
  if (catRes.ok) {
    console.log('Create Category success:', await catRes.json());
  } else {
    console.error('Create Category failed:', catRes.status, await catRes.text());
  }

  // 6. Get Categories
  console.log('6. Get Categories...');
  const getCatRes = await fetch(`${API_URL}/categories`, { headers });
  if (getCatRes.ok) {
    console.log('Get Categories success:', await getCatRes.json());
  } else {
    console.error('Get Categories failed:', getCatRes.status, await getCatRes.text());
  }
  
  // 7. Check Onboarding
  console.log('7. Check Onboarding...');
  const onboardRes = await fetch(`${API_URL}/user/onboarding`, { headers });
  if (onboardRes.ok) {
    console.log('Onboarding status:', await onboardRes.json());
  } else {
    console.error('Onboarding check failed:', onboardRes.status, await onboardRes.text());
  }
}

run().catch(console.error);
