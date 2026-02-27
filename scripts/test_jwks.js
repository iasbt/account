
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

const testJwks = async () => {
  console.log(`Checking ${BASE_URL}/.well-known/jwks.json ...`);
  try {
    const res = await fetch(`${BASE_URL}/.well-known/jwks.json`);
    if (!res.ok) {
      console.error('Failed:', res.status, res.statusText);
      const text = await res.text();
      console.error(text);
      return;
    }
    const data = await res.json();
    console.log('JWKS Response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Fetch Error:', err);
  }
};

const testOpenId = async () => {
  console.log(`Checking ${BASE_URL}/.well-known/openid-configuration ...`);
  try {
    const res = await fetch(`${BASE_URL}/.well-known/openid-configuration`);
    if (!res.ok) {
      console.error('Failed:', res.status, res.statusText);
      return;
    }
    const data = await res.json();
    console.log('OpenID Config:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Fetch Error:', err);
  }
};

(async () => {
  await testJwks();
  await testOpenId();
})();
