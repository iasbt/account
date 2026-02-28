
import fs from 'fs';

const moves = [
  // Scripts -> scripts/
  { src: 'debug_apps.js', dest: 'scripts/debug_apps.js' },
  { src: 'fix_db.js', dest: 'scripts/fix_db.js' },
  { src: 'fix_gallery_client.cjs', dest: 'scripts/fix_gallery_client.cjs' },
  { src: 'fix_gallery_client.js', dest: 'scripts/fix_gallery_client.js' },
  { src: 'maintenance.js', dest: 'scripts/maintenance.js' },
  { src: 'verify_api.js', dest: 'scripts/verify_api.js' },
  { src: 'fetch_logs.ps1', dest: 'scripts/fetch_logs.ps1' },
  { src: 'full_deploy.ps1', dest: 'scripts/full_deploy.ps1' },
  { src: 'run_migration.ps1', dest: 'scripts/run_migration.ps1' },
  { src: 'run_remote.ps1', dest: 'scripts/run_remote.ps1' },
  { src: 'test_version.ps1', dest: 'scripts/test_version.ps1' },
  { src: 'update_gallery.ps1', dest: 'scripts/update_gallery.ps1' },

  // Config/Services -> appropriate folders
  { src: 'db.js', dest: 'config/db.js' }, // Assuming it's a config
  { src: 'emailService.js', dest: 'services/emailService.js' },

  // Data/Temp -> scripts/data/ or delete
  { src: 'pgadmin_snippets.json', dest: 'scripts/data/pgadmin_snippets.json' },
  { src: 'supabase_full_backup.sql', dest: 'scripts/data/supabase_full_backup.sql' },
  { src: 'hash.txt', dest: 'scripts/data/hash.txt' },
  { src: 'temp_gallery_env.txt', dest: 'scripts/data/temp_gallery_env.txt' },
  { src: 'test_cmd.txt', dest: 'scripts/data/test_cmd.txt' },
  { src: 'users_rows_updated.csv', dest: 'scripts/data/users_rows_updated.csv' },
  { src: 'init.sql', dest: 'scripts/migrations/000_init.sql' },

  // Docs/Agent -> docs/agent/
  { src: 'findings.md', dest: 'docs/agent/findings.md' },
  { src: 'progress.md', dest: 'docs/agent/progress.md' },
  { src: 'task_plan.md', dest: 'docs/agent/task_plan.md' },
  { src: '.env.ps1.example', dest: 'docs/examples/.env.ps1.example' },
];

// Create dirs
['scripts/data', 'docs/agent', 'docs/examples'].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

let movedCount = 0;

moves.forEach(({ src, dest }) => {
  if (fs.existsSync(src)) {
    // Check if dest exists
    if (fs.existsSync(dest)) {
      console.log(`⚠️ Destination ${dest} already exists. Skipping ${src}.`);
    } else {
      try {
        fs.renameSync(src, dest);
        console.log(`✅ Moved ${src} -> ${dest}`);
        movedCount++;
      } catch (e) {
        console.error(`❌ Failed to move ${src}: ${e.message}`);
      }
    }
  }
});

console.log(`Cleanup complete. Moved ${movedCount} files.`);
