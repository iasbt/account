import express from "express";
import helmet from "helmet";
import { corsMiddleware } from "./middlewares/cors.js";
import { loggerMiddleware } from "./middlewares/logger.js";
import { metricsMiddleware, getMetrics } from "./middlewares/metrics.js";
import { appLoader } from "./src/core/AppLoader.js";
import routes from "./routes/index.js";

const app = express();

app.set("trust proxy", 1);

// Security Headers with Helmet
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin resource sharing for static assets/API
  crossOriginOpenerPolicy: false, // Disable COOP to allow cross-origin redirects/popups without issues
  contentSecurityPolicy: false // Disable CSP for now to avoid breaking existing scripts/styles if any
}));

app.use(metricsMiddleware); // Measure all requests
app.use(express.json());
app.use(corsMiddleware);
app.use(loggerMiddleware);

app.get("/metrics", getMetrics); // Expose metrics endpoint

appLoader.mount(app);

app.use(routes);

export default app;
