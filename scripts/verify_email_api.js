const API_URL = 'http://localhost:3000';
const ADMIN_EMAIL = 'iasbt@outlook.com';
const ADMIN_PASS = 'password123';

async function verify() {
  try {
    console.log('1. Logging in as Admin...');
    const loginRes = await fetch(`${API_URL}/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        account: ADMIN_EMAIL,
        password: ADMIN_PASS
      })
    });
    
    if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.statusText}`);
    const loginData = await loginRes.json();
    const { token } = loginData;
    console.log('Login successful. Token obtained.');
    
    const headers = { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // 2. Get Stats
    console.log('\n2. Getting Email Stats...');
    const statsRes = await fetch(`${API_URL}/admin/email/stats`, { headers });
    const statsData = await statsRes.json();
    console.log('Stats:', statsData);

    // 3. Get Providers
    console.log('\n3. Getting Email Providers...');
    const providersRes = await fetch(`${API_URL}/admin/email/providers`, { headers });
    const providersData = await providersRes.json();
    console.log(`Found ${providersData.length} providers.`);

    // 4. Create Dummy Provider
    console.log('\n4. Creating Dummy Provider...');
    const createRes = await fetch(`${API_URL}/admin/email/providers`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'Test Provider',
        host: 'smtp.test.com',
        port: 587,
        secure: false,
        auth_user: 'test',
        auth_pass: 'testpass',
        from_name: 'Test Sender',
        from_email: 'test@test.com'
      })
    });
    const createData = await createRes.json();
    const newProviderId = createData.id;
    console.log('Created provider ID:', newProviderId);

    // 5. Get Logs
    console.log('\n5. Getting Email Logs...');
    const logsRes = await fetch(`${API_URL}/admin/email/logs`, { headers });
    const logsData = await logsRes.json();
    console.log(`Logs retrieved: ${logsData.logs.length}, Total: ${logsData.total}`);

    // 6. Test Provider (Expect failure as host is fake, but API should be reachable)
    console.log('\n6. Testing Provider (Expecting connection error)...');
    const testRes = await fetch(`${API_URL}/admin/email/providers/${newProviderId}/test`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        email: 'test@example.com'
      })
    });
    
    if (!testRes.ok) {
       const errData = await testRes.json();
       console.log('Expected error received:', errData.message);
    } else {
       console.log('Unexpected success (should fail with fake host)');
    }

    // 7. Delete Provider
    console.log('\n7. Deleting Dummy Provider...');
    await fetch(`${API_URL}/admin/email/providers/${newProviderId}`, { 
      method: 'DELETE',
      headers 
    });
    console.log('Provider deleted.');

    console.log('\n✅ Verification Complete!');

  } catch (error) {
    console.error('❌ Verification Failed:', error);
  }
}

verify();
