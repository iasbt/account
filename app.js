import express from "express";
import { corsMiddleware } from "./middlewares/cors.js";
import { loggerMiddleware } from "./middlewares/logger.js";
import { appLoader } from "./src/core/AppLoader.js";
import routes from "./routes/index.js";

const app = express();

app.set("trust proxy", true);
app.use(express.json());
app.use(corsMiddleware);
app.use(loggerMiddleware);

// Mount micro-apps
appLoader.mount(app);

app.use(routes);

export default app;
