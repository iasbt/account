import axios from 'axios';
import crypto from 'crypto';

const BASE_URL = 'http://localhost:3000';
const USER_EMAIL = 'admin@example.com';
const USER_PASS = 'password123';

// Helper to encode code_challenge
function base64URLEncode(str) {
    return str.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

function sha256(buffer) {
    return crypto.createHash('sha256').update(buffer).digest();
}

async function runTest() {
    console.log('--- Starting Refresh Token Flow Test ---');

    try {
        // 1. Login to get User Token
        console.log('\n1. Logging in as user...');
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            account: USER_EMAIL,
            password: USER_PASS
        });
        const userToken = loginRes.data.token;
        console.log('User Token obtained:', userToken ? 'Yes' : 'No');

        // 2. Authorize to get Auth Code (with PKCE)
        console.log('\n2. Requesting Auth Code...');
        const codeVerifier = base64URLEncode(crypto.randomBytes(32));
        const codeChallenge = base64URLEncode(sha256(codeVerifier));
        
        const authRes = await axios.post(`${BASE_URL}/oauth/authorize`, {
            client_id: 'gallery',
            redirect_uri: 'http://localhost:5173/auth/callback',
            response_type: 'code',
            code_challenge: codeChallenge,
            code_challenge_method: 'S256',
            scope: 'profile'
        }, {
            headers: { Authorization: `Bearer ${userToken}` },
            maxRedirects: 0,
            validateStatus: status => status >= 200 && status < 400
        });
        
        console.log('Auth Status:', authRes.status);
        console.log('Auth Data:', authRes.data);
        
        // Extract code from redirect_url
        const redirectUrl = authRes.data.redirect_url;
        console.log('Redirect URL:', redirectUrl);
        
        const url = new URL(redirectUrl);
        const authCode = url.searchParams.get('code');
        console.log('Auth Code obtained:', authCode);

        // 3. Exchange Code for Tokens
        console.log('\n3. Exchanging Code for Tokens...');
        const tokenRes = await axios.post(`${BASE_URL}/oauth/token`, {
            grant_type: 'authorization_code',
            code: authCode,
            redirect_uri: 'http://localhost:5173/auth/callback',
            client_id: 'gallery',
            client_secret: 'MvVh2XGOWu0axQJFoFYbocTvAXd9tZ9J3NQzAbfIz',
            code_verifier: codeVerifier
        });

        const accessToken1 = tokenRes.data.access_token;
        const refreshToken1 = tokenRes.data.refresh_token;
        console.log('Access Token 1:', accessToken1 ? 'Yes' : 'No');
        console.log('Refresh Token 1:', refreshToken1 ? 'Yes' : 'No');

        if (!refreshToken1) {
            console.error('FAILED: No refresh token returned!');
            return;
        }

        // 4. Use Refresh Token to get New Tokens
        console.log('\n4. Refreshing Tokens...');
        // Wait a second to ensure different timestamps if needed (though not strictly necessary for logic)
        await new Promise(r => setTimeout(r, 1000));

        const refreshRes = await axios.post(`${BASE_URL}/oauth/token`, {
            grant_type: 'refresh_token',
            refresh_token: refreshToken1,
            client_id: 'gallery',
            client_secret: 'MvVh2XGOWu0axQJFoFYbocTvAXd9tZ9J3NQzAbfIz'
        });

        const accessToken2 = refreshRes.data.access_token;
        const refreshToken2 = refreshRes.data.refresh_token;
        console.log('Access Token 2:', accessToken2 ? 'Yes' : 'No');
        console.log('Refresh Token 2:', refreshToken2 ? 'Yes' : 'No');

        if (accessToken1 === accessToken2) {
             console.warn('WARNING: Access Token 1 and 2 are identical (might be acceptable if ttl is long, but usually different due to iat)');
        }
        if (refreshToken1 === refreshToken2) {
             console.error('FAILED: Refresh Token was not rotated!');
        } else {
             console.log('SUCCESS: Refresh Token Rotated.');
        }

        // 5. Try to Reuse Old Refresh Token (Should Fail)
        console.log('\n5. Attempting to Reuse Old Refresh Token (Expect Failure)...');
        try {
            await axios.post(`${BASE_URL}/oauth/token`, {
                grant_type: 'refresh_token',
                refresh_token: refreshToken1,
                client_id: 'gallery',
                client_secret: 'MvVh2XGOWu0axQJFoFYbocTvAXd9tZ9J3NQzAbfIz'
            });
            console.error('FAILED: Old Refresh Token should have been revoked!');
        } catch (err) {
            if (err.response && err.response.status === 400 && err.response.data.error === 'invalid_grant') {
                console.log('SUCCESS: Old Refresh Token rejected as expected.');
            } else {
                console.error('FAILED: Unexpected error:', err.message);
                if (err.response) console.error('Response:', err.response.data);
            }
        }

    } catch (err) {
        console.error('Test Failed:', err.message);
        if (err.response) {
            console.error('Response Status:', err.response.status);
            console.error('Response Data:', err.response.data);
        }
    }
    console.log('\n--- Test Complete ---');
}

runTest();
