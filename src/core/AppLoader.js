import { pathToFileURL } from 'url';
import fs from 'fs-extra';
import path from 'path';
import yaml from 'yaml';
import chokidar from 'chokidar';
import express from 'express';
import { Pool } from 'pg';

// Simple DB pool for status updates
let pool;

class AppLoader {
  constructor() {
    this.registry = new Map(); // name -> { config, router, status }
    this.configDir = path.resolve(process.cwd(), 'ai.apps.d');
    this.router = express.Router();
  }

  async init() {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT
    });

    await fs.ensureDir(this.configDir);
    
    // Initial Load
    await this.loadAll();

    // Watch for changes
    chokidar.watch(this.configDir).on('change', async (filePath) => {
      console.log(`[AppLoader] Config changed: ${filePath}`);
      await this.loadApp(filePath);
    });

    // Setup dynamic router middleware
    this.router.use((req, res, next) => {
      const appName = req.path.split('/')[1]; // /api/{appName}/...
      const app = this.registry.get(appName);

      if (!app) {
        return next(); // Not a micro-app request
      }

      if (app.status !== 'active') {
        return res.status(503).json({
          code: 5003,
          message: `App ${appName} is ${app.status}`,
          timestamp: Date.now()
        });
      }

      // Delegate to app router
      // Strip /api/{appName}/v{version} prefix or just handle it in app?
      // The plan says: "mount at /api/${appName}/v${version}"
      // So the app router should handle the rest.
      // But express router.use mounts at a path.
      
      // Dynamic dispatch
      // Rewrite request for the sub-app router
      const prefix = `/${appName}`;
      const originalUrl = req.url;
      const originalBaseUrl = req.baseUrl;

      if (req.url.startsWith(prefix)) {
        req.url = req.url.slice(prefix.length) || '/';
        req.baseUrl = (originalBaseUrl || '') + prefix;
      }

      app.router(req, res, (err) => {
        // Restore on next/error
        req.url = originalUrl;
        req.baseUrl = originalBaseUrl;
        next(err);
      });
    });
  }

  async loadAll() {
    const files = await fs.readdir(this.configDir);
    for (const file of files) {
      if (file.endsWith('.yaml')) {
        await this.loadApp(path.join(this.configDir, file));
      }
    }
  }

  async loadApp(filePath) {
    const content = await fs.readFile(filePath, 'utf8');
    const config = yaml.parse(content);
    const { name, version, entry } = config;

    console.log(`[AppLoader] Loading ${name} v${version}...`);

    try {
      // 1. Validate (Simple check)
      if (!entry.backend) throw new Error('Missing backend entry');

const moduleUrl = new URL(pathToFileURL(entry.backend).href);
      moduleUrl.searchParams.set('t', Date.now());
      const appModule = await import(moduleUrl.href);
      const appRouter = appModule.default;

      if (typeof appRouter !== 'function') {
        throw new Error('Backend entry must export an Express Router');
      }

      // 3. Register
      this.registry.set(name, {
        config,
        router: appRouter,
        status: 'active'
      });

      // 4. Update DB
      await this.updateStatus(name, 'active', config);

      console.log(`[AppLoader] ${name} loaded successfully.`);
    } catch (err) {
      console.error(`[AppLoader] Failed to load ${name}:`, err);
      this.registry.set(name, {
        config,
        router: null,
        status: 'degraded'
      });
      await this.updateStatus(name, 'degraded', config);
    }
  }

  async updateStatus(name, status, config) {
    try {
      await pool.query(
        `INSERT INTO applications (name, version, status, config, last_reload_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (name) DO UPDATE 
         SET version = EXCLUDED.version, 
             status = EXCLUDED.status,
             config = EXCLUDED.config,
             last_reload_at = NOW()`,
        [name, config.version, status, JSON.stringify(config)]
      );
    } catch (e) {
      console.error('[AppLoader] DB Update Failed:', e);
    }
  }

  // Helper to mount the dynamic router to main app
  mount(app) {
    // Mount at root level to intercept /{appName} requests
    // Nginx handles /api prefix stripping
    app.use('/', this.router);
  }
}

export const appLoader = new AppLoader();
