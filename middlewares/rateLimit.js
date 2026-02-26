
import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 300, // Limit each IP to 300 requests per windowMs
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
  message: {
    success: false,
    message: "发送太频繁，请稍后再试"
  }
});
