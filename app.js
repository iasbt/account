import express from "express";
import helmet from "helmet";
import { config } from "./config/index.js";
import { corsMiddleware } from "./middlewares/cors.js";
import { loggerMiddleware } from "./middlewares/logger.js";
import { metricsMiddleware, getMetrics } from "./middlewares/metrics.js";
import { appLoader } from "./src/core/AppLoader.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import routes from "./routes/index.js";

const app = express();

app.set("trust proxy", 1);

const galleryHost = config.galleryHost;
const cspConnectSources = (process.env.CSP_CONNECT_SRC || "https://*.iasbt.cloud,https://*.iasbt.com")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

// Security Headers with Helmet
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin resource sharing for static assets/API
  crossOriginOpenerPolicy: false, // Disable COOP to allow cross-origin redirects/popups without issues
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts for React (dev)
      styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for Tailwind/React
      imgSrc: ["'self'", "data:", "https:", `${galleryHost}:*`], // Allow external images
      connectSrc: ["'self'", "http://localhost:*", ...cspConnectSources, `${galleryHost}:*`], // Allow API calls
    },
  }
}));

app.use(metricsMiddleware); // Measure all requests
app.use(express.json());
app.use(corsMiddleware);
app.use(loggerMiddleware);

app.get("/metrics", getMetrics); // Expose metrics endpoint
appLoader.mount(app);

// Mount routes
// Note: Frontend uses /api prefix (via VITE_AUTH_BASE_URL)
// Nginx also routes /api to this backend.
app.use("/api", routes);

// Also mount at root for internal/legacy calls or if Nginx strips prefix
app.use(routes);

// Error handling middleware
app.use(errorHandler);

export default app;
