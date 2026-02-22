import express from "express";
import { corsMiddleware } from "./middlewares/cors.js";
import { loggerMiddleware } from "./middlewares/logger.js";
import routes from "./routes/index.js";

const app = express();

app.use(express.json());
app.use(corsMiddleware);
app.use(loggerMiddleware);

app.use(routes);

export default app;
