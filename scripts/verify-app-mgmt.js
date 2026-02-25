import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup environment BEFORE importing appController/db
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Force localhost if needed
if (process.env.DB_HOST === 'iasbt-postgres') {
  console.log('Overriding DB_HOST to localhost for local verification');
  process.env.DB_HOST = 'localhost';
}

// Now import controller (which imports db.js)
// Use dynamic import to ensure env is set first
const { createApp, rotateSecret, deleteApp } = await import('../controllers/appController.js');

// Mock Express objects
const mockRes = () => {
  const res = {};
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.body = data;
    return res;
  };
  return res;
};

async function verify() {
  console.log('--- Starting Verification ---');
  const testAppId = `test-app-${Date.now()}`;
  
  // 1. Create App (without secret)
  console.log(`\n1. Creating App: ${testAppId}`);
  const reqCreate = {
    body: {
      name: 'Test App',
      appId: testAppId,
      allowedOrigins: ['http://localhost'],
      tokenType: 'standard'
      // No secret provided
    }
  };
  const resCreate = mockRes();
  await createApp(reqCreate, resCreate);
  
  if (resCreate.statusCode !== 201) {
    console.error('Create failed:', resCreate.statusCode, resCreate.body);
    process.exit(1);
  }
  
  const createdApp = resCreate.body;
  console.log('Created App:', createdApp.id, createdApp.app_id);
  console.log('Generated Secret:', createdApp.secret ? 'Yes (hidden)' : 'No');
  
  if (!createdApp.secret) {
    console.error('Error: Secret was not generated!');
    process.exit(1);
  }

  // 2. Rotate Secret
  console.log('\n2. Rotating Secret...');
  const reqRotate = { params: { id: createdApp.id } };
  const resRotate = mockRes();
  await rotateSecret(reqRotate, resRotate);
  
  if (resRotate.body && resRotate.body.secret && resRotate.body.secret !== createdApp.secret) {
    console.log('Secret Rotated Successfully!');
    console.log('Old Secret:', createdApp.secret.substring(0, 10) + '...');
    console.log('New Secret:', resRotate.body.secret.substring(0, 10) + '...');
  } else {
    console.error('Rotate failed:', resRotate.statusCode, resRotate.body);
  }

  // 3. Delete App
  console.log('\n3. Deleting App...');
  const reqDelete = { params: { id: createdApp.id } };
  const resDelete = mockRes();
  await deleteApp(reqDelete, resDelete);
  
  if (resDelete.body && resDelete.body.message === 'App deleted successfully') {
    console.log('App Deleted Successfully!');
  } else {
    console.error('Delete failed:', resDelete.statusCode, resDelete.body);
  }
  
  console.log('\n--- Verification Complete ---');
  process.exit(0);
}

verify().catch(err => {
  console.error('Verification Error:', err);
  process.exit(1);
});
