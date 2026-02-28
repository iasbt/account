#!/usr/bin/env node
import { Command } from 'commander';
import fs from 'fs-extra';
import path from 'path';
import yaml from 'yaml';
import { execSync } from 'child_process';

const program = new Command();

program
  .name('ai-app-cli')
  .description('One-Click Application Access CLI')
  .version('0.1.0');

// Helper: Ensure directories exist
const ensureDirs = async (dirs) => {
  for (const dir of dirs) {
    await fs.ensureDir(dir);
  }
};

// Command: INIT
program.command('init <name>')
  .description('Initialize a new micro-app')
  .action(async (name) => {
    if (!/^[a-z0-9-]+$/.test(name)) {
      console.error('Error: App name must be lowercase alphanumeric with dashes.');
      process.exit(10);
    }

    const appDir = path.resolve(process.cwd(), 'apps', name);
    if (await fs.pathExists(appDir)) {
      console.error(`Error: Directory ${appDir} already exists.`);
      process.exit(1);
    }

    console.log(`Initializing app: ${name}...`);
    await ensureDirs([
      path.join(appDir, 'server'),
      path.join(appDir, 'web/src'),
      path.resolve(process.cwd(), 'ai.apps.d')
    ]);

    // Generate Server Template
    const serverIndex = `
import express from 'express';
import { registerMicroApp } from '@ai-app/sdk/server.js';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Hello from ${name}!' });
});

export default registerMicroApp({
  name: '${name}',
  version: '1.0.0',
  router
});
`;
    await fs.writeFile(path.join(appDir, 'server', 'index.js'), serverIndex.trim());

    // Generate Client Template (Simple HTML for iframe demo)
    const clientIndex = `
<!DOCTYPE html>
<html>
<head><title>${name}</title></head>
<body><h1>Welcome to ${name}</h1></body>
</html>
`;
    await fs.ensureDir(path.join(appDir, 'web', 'dist'));
    await fs.writeFile(path.join(appDir, 'web', 'dist', 'index.html'), clientIndex.trim());

    // Generate Config
    const configPath = path.resolve(process.cwd(), 'ai.apps.d', `${name}.yaml`);
    const configContent = `
name: ${name}
version: 1.0.0
entry:
    backend: apps/${name}/server/index.js
    frontend: apps/${name}/web/dist/index.html
  deps: []
envPrefix: ${name.toUpperCase().replace(/-/g, '_')}_
meta:
  label: "${name} App"
  icon: "AppIcon"
  order: 1000
`;
    await fs.writeFile(configPath, configContent.trim());
    console.log(`✅ App initialized in ${appDir}`);
    console.log(`✅ Config created at ${configPath}`);
  });

// Command: VALIDATE
program.command('validate <name>')
  .description('Validate micro-app configuration')
  .action(async (name) => {
    const configPath = path.resolve(process.cwd(), 'ai.apps.d', `${name}.yaml`);
    if (!await fs.pathExists(configPath)) {
      console.error(`Error: Config for ${name} not found.`);
      process.exit(10);
    }

    try {
      const fileContent = await fs.readFile(configPath, 'utf8');
      const config = yaml.parse(fileContent);

      // Schema Validation
      if (!config.name || !/^[a-z0-9-]+$/.test(config.name)) throw new Error('Invalid name format');
      if (!config.version || !/^\d+\.\d+\.\d+$/.test(config.version)) throw new Error('Invalid version format (SemVer required)');
      if (!config.entry?.backend || !config.entry?.frontend) throw new Error('Missing entry points');
      
      // Path Validation
      if (!await fs.pathExists(config.entry.backend)) throw new Error(`Backend entry not found: ${config.entry.backend}`);
      if (!await fs.pathExists(config.entry.frontend)) throw new Error(`Frontend entry not found: ${config.entry.frontend}`);

      console.log(`✅ Configuration for ${name} is valid.`);
    } catch (err) {
      console.error(`❌ Validation failed: ${err.message}`);
      process.exit(10);
    }
  });

// Command: DEPLOY
program.command('deploy <name>')
  .description('Deploy micro-app (Build + Reload)')
  .action(async (name) => {
    console.log(`Deploying ${name}...`);
    
    // 1. Validate
    try {
      execSync(`node ${process.argv[1]} validate ${name}`, { stdio: 'inherit' });
    } catch (e) {
      console.error("Failed to load config:", e);
    }

    // 2. Build (Simulated)
    console.log('Building...');
    // In real scenario: execSync('npm run build', { cwd: appDir });
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate build time

    // 3. Trigger Hot Reload (Touch config file)
    const configPath = path.resolve(process.cwd(), 'ai.apps.d', `${name}.yaml`);
    const content = await fs.readFile(configPath, 'utf8');
    await fs.writeFile(configPath, content); // Touch file
    
    console.log(`✅ Deployed ${name} successfully! (Hot reload triggered)`);
  });

program.parse(process.argv);
