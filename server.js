import { config } from "./config/index.js";
import app from "./app.js";
import { logger } from "./utils/logger.js";
import { appLoader } from "./src/core/AppLoader.js";
import { initEmailTemplates } from "./scripts/init_email_templates.js";
import { migratePreferences } from "./scripts/migrate_preferences.js";
import { ensureAdminIsolation } from "./scripts/ensure_admin.js";
// Start Email Worker
import "./services/emailWorker.js";

// Initialize Services
Promise.all([
  appLoader.init(),
  initEmailTemplates(),
  migratePreferences(),
  ensureAdminIsolation()
]).then(() => {
  logger.info({ event: "core_services_initialized" });
  
  app.listen(config.port, () => {
    logger.info({ event: "server_started", port: config.port });
  });
}).catch(err => {
  logger.error({ event: "server_init_failed", error: err.message });
  process.exit(1);
});
