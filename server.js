import { config } from "./config/index.js";
import app from "./app.js";
import { appLoader } from "./src/core/AppLoader.js";
import { initEmailTemplates } from "./scripts/init_email_templates.js";
// Start Email Worker
import "./services/emailWorker.js";

// Initialize Services
Promise.all([
  appLoader.init(),
  initEmailTemplates()
]).then(() => {
  console.log("Core services initialized");
  
  app.listen(config.port, () => {
    console.log(`Server is running on port ${config.port}`);
  });
}).catch(err => {
  console.error("Failed to initialize services", err);
  process.exit(1);
});
