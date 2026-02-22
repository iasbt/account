import crypto from "node:crypto";
import { config } from "../config/index.js";
import { redactHeaders } from "../utils/helpers.js";

export const loggerMiddleware = (req, res, next) => {
  if (!req.path.startsWith("/api/")) return next();
  const requestId = crypto.randomUUID();
  const start = Date.now();
  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);
  const origin = req.headers.origin || "";
  const entry = {
    requestId,
    method: req.method,
    path: req.path,
    origin,
    ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
  };
  if (config.logLevel === "debug") {
    entry.headers = redactHeaders(req.headers);
  }
  console.log(JSON.stringify({ level: "info", event: "api_request_start", ...entry }));
  res.on("finish", () => {
    const durationMs = Date.now() - start;
    console.log(
      JSON.stringify({
        level: "info",
        event: "api_request_end",
        requestId,
        status: res.statusCode,
        durationMs,
      })
    );
  });
  next();
};
