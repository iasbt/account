import { config } from "./config/index.js";
import app from "./app.js";
import { appLoader } from "./src/core/AppLoader.js";

// Initialize Micro-Apps Loader
appLoader.init().then(() => {
  console.log("Micro-Apps Loader initialized");
}).catch(err => {
  console.error("Failed to initialize AppLoader", err);
});

app.listen(config.port, () => {
  console.log(`Server is running on port ${config.port}`);
});
