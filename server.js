import { config } from "./config/index.js";
import app from "./app.js";
import { logger } from "./utils/logger.js";
import { runMigrations } from "./scripts/db_migrate.js";

// Initialize Services
Promise.resolve()
  .then(() => runMigrations())
  .then(() => {
    logger.info({ event: "core_services_initialized" });
  
    app.listen(config.port, () => {
      logger.info({ event: "server_started", port: config.port });
    });
  }).catch(err => {
    logger.error({ event: "server_init_failed", error: err.message });
    process.exit(1);
  });
