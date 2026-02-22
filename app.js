import express from "express";
import path from "node:path";
import { corsMiddleware } from "./middlewares/cors.js";
import { loggerMiddleware } from "./middlewares/logger.js";
import routes from "./routes/index.js";

const app = express();

app.use(express.json());
app.use(corsMiddleware);
app.use(loggerMiddleware);

app.use(routes);

// Static dashboard route (legacy)
app.get("/dashboard.html", (req, res) => {
  const filePath = path.resolve(process.cwd(), "dashboard.html");
  res.sendFile(filePath);
});

export default app;
