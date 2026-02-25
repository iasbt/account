
import { Router } from "express";
import { sendVerificationCode, register, login, getSsoToken, changePassword, resetPassword, getMe, getSupabaseUser } from "../controllers/authController.js";
import { requireAuth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { sendCodeSchema, registerSchema, loginSchema, resetPasswordSchema, changePasswordSchema } from "../validators/authSchema.js";
import { authLimiter, sendCodeLimiter } from "../middlewares/rateLimit.js";

const router = Router();

// Apply global auth limiter to all routes in this router
router.use(authLimiter);

router.get("/auth/me", requireAuth, getMe);
router.get("/auth/v1/user", getSupabaseUser);

router.post(
  "/auth/send-code", 
  sendCodeLimiter, 
  validate(sendCodeSchema), 
  sendVerificationCode
);

router.post(
  "/auth/register", 
  validate(registerSchema), 
  register
);

router.post(
  "/auth/login", 
  validate(loginSchema), 
  login
);

router.post(
  "/auth/reset-password", 
  validate(resetPasswordSchema), 
  resetPassword
);

router.get("/auth/sso-token", requireAuth, getSsoToken);

router.post(
  "/auth/change-password", 
  requireAuth, 
  validate(changePasswordSchema), 
  changePassword
);

export default router;
