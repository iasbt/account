import express from "express";
import { corsMiddleware } from "./middlewares/cors.js";
import { loggerMiddleware } from "./middlewares/logger.js";
import { appLoader } from "./src/core/AppLoader.js";
import routes from "./routes/index.js";

const app = express();

// Trust the reverse proxy (Nginx)
app.set("trust proxy", 1);
console.log("[Debug] Trust proxy set to:", app.get("trust proxy"));

app.use(express.json());
app.use(corsMiddleware);
app.use(loggerMiddleware);

// Mount micro-apps
appLoader.mount(app);

app.use(routes);

export default app;
