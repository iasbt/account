import express from "express";
import helmet from "helmet";
import { corsMiddleware } from "./middlewares/cors.js";
import { loggerMiddleware } from "./middlewares/logger.js";
import { metricsMiddleware, getMetrics } from "./middlewares/metrics.js";
import { appLoader } from "./src/core/AppLoader.js";
import routes from "./routes/index.js";

const app = express();

app.set("trust proxy", 1);

const galleryHost = process.env.GALLERY_HOST || "http://119.91.71.30";

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
      connectSrc: ["'self'", "http://localhost:*", "https://*.iasbt.com", `${galleryHost}:*`], // Allow API calls
    },
  }
}));

app.use(metricsMiddleware); // Measure all requests
app.use(express.json());
app.use(corsMiddleware);
app.use(loggerMiddleware);

app.get("/metrics", getMetrics); // Expose metrics endpoint
appLoader.mount(app);

app.use(routes);
app.use("/api", routes);

export default app;
