
import rateLimit from "express-rate-limit";
import { config } from "../config/index.js";

const isWhitelisted = (req) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  return config.debugAllowlist.some(allowed => ip.includes(allowed));
};

export const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // Limit each IP to 60 requests per minute (1 req/sec)
  skip: isWhitelisted,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after 1 minute"
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const sendCodeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 requests per minute
  skip: isWhitelisted,
  message: {
    success: false,
    message: "发送太频繁，请稍后再试"
  }
});
