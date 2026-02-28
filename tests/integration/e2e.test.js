
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';

const TEST_DB_CONFIG = {
  host: 'localhost',
  port: 5433,
  user: 'postgres',
  password: 'password',
  database: 'account_test',
};

const TEST_REDIS_CONFIG = {
  host: 'localhost',
  port: 6380
};

const runIntegration = process.env.RUN_INTEGRATION_TESTS === 'true';
const describeIntegration = runIntegration ? describe : describe.skip;

describeIntegration('Integration Tests: End-to-End Flow', () => {
  let app;
  let pool;

  beforeAll(async () => {
    process.env.DB_HOST = TEST_DB_CONFIG.host;
    process.env.DB_PORT = TEST_DB_CONFIG.port.toString();
    process.env.DB_USER = TEST_DB_CONFIG.user;
    process.env.DB_PASSWORD = TEST_DB_CONFIG.password;
    process.env.DB_NAME = TEST_DB_CONFIG.database;
    process.env.REDIS_HOST = TEST_REDIS_CONFIG.host;
    process.env.REDIS_PORT = TEST_REDIS_CONFIG.port.toString();
    process.env.NODE_ENV = 'test';

    const appModule = await import('../../app.js');
    app = appModule.default;
    const poolModule = await import('../../config/db.js');
    pool = poolModule.default;

    try {
      await pool.query('DROP TABLE IF EXISTS public.users CASCADE');
      await pool.query('DROP TABLE IF EXISTS public.applications CASCADE');
      await pool.query('DROP TABLE IF EXISTS public.refresh_tokens CASCADE');
      
      // Run Migrations (Simplified schema)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS public.users (
          id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          email text UNIQUE NOT NULL,
          password text NOT NULL,
          name text,
          is_admin boolean DEFAULT false,
          created_at timestamptz DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS public.applications (
          id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          name text NOT NULL,
          secret text NOT NULL,
          allowed_origins text[] DEFAULT '{}',
          is_active boolean DEFAULT true,
          created_at timestamptz DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS public.refresh_tokens (
          id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          token text UNIQUE NOT NULL,
          user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
          expires_at timestamptz NOT NULL,
          revoked boolean DEFAULT false,
          created_at timestamptz DEFAULT now()
        );
      `);
    } catch (e) {
      console.error('DB Setup Error:', e);
      throw e;
    }
  });

  afterAll(async () => {
    await pool.end();
  });

  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test_user@example.com',
        password: 'password123',
        name: 'Test User',
        code: '123456'
      });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
  });

  it('should login and return a token', async () => {
    // 1. Create User manually
    const hashedPassword = await bcrypt.hash('password123', 10);
    await pool.query(
      'INSERT INTO public.users (email, password, name) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      ['login@example.com', hashedPassword, 'Login User']
    );

    // 2. Login
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        account: 'login@example.com',
        password: 'password123'
      })
      .expect(200)
      .expect((_response) => {
        // verify cookies or body
      });
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
  });

  it('should fail to login with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        account: 'login@example.com',
        password: 'wrongpassword'
      });

    expect(res.status).toBe(401);
  });
});
