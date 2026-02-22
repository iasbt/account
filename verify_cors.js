import fetch from 'node-fetch';

const target = 'http://119.91.71.30/api/health';
const origins = [
  'http://119.91.71.30',
  'https://account.iasbt.com',
  'http://evil.com'
];

console.log("Running CORS Check V3");

async function check(origin) {
  try {
    const res = await fetch(target, {
      headers: { 'Origin': origin }
    });
    console.log(`[${origin}] Status: ${res.status}`);
    console.log(`[${origin}] ACAO: ${res.headers.get('access-control-allow-origin')}`);
  } catch (err) {
    console.error(`[${origin}] Error:`, err.message);
  }
}

(async () => {
  for (const o of origins) {
    await check(o);
  }
})();
