
import { Router } from "express";
import { sendVerificationCode, register, login, changePassword, resetPassword, getMe, updateProfile, logout } from "../controllers/authController.js";
import { requireAuth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { sendCodeSchema, registerSchema, loginSchema, resetPasswordSchema, changePasswordSchema, updateProfileSchema } from "../validators/authSchema.js";
import { authLimiter, sendCodeLimiter } from "../middlewares/rateLimit.js";
import { config } from "../config/index.js";

const router = Router();
const logtoMode = config.authMode === "logto";
const rejectLegacy = (_req, res) => res.status(410).json({ message: "该接口已废弃，请改用 Logto" });

// Apply global auth limiter to all routes in this router
router.use(authLimiter);

router.get("/auth/me", requireAuth, getMe);

if (logtoMode) {
  router.post("/auth/send-code", rejectLegacy);
} else {
  router.post(
    "/auth/send-code", 
    sendCodeLimiter, 
    validate(sendCodeSchema), 
    sendVerificationCode
  );
}

if (logtoMode) {
  router.post("/auth/register", rejectLegacy);
} else {
  router.post(
    "/auth/register", 
    validate(registerSchema), 
    register
  );
}

if (logtoMode) {
  router.post("/auth/login", rejectLegacy);
} else {
  router.post(
    "/auth/login", 
    validate(loginSchema), 
    login
  );
}

if (logtoMode) {
  router.post("/auth/reset-password", rejectLegacy);
} else {
  router.post(
    "/auth/reset-password", 
    validate(resetPasswordSchema), 
    resetPassword
  );
}

if (logtoMode) {
  router.post("/auth/change-password", rejectLegacy);
} else {
  router.post(
    "/auth/change-password", 
    requireAuth, 
    validate(changePasswordSchema), 
    changePassword
  );
}


router.patch(
  "/auth/me", 
  requireAuth, 
  validate(updateProfileSchema), 
  updateProfile
);

// Logout routes (Support GET for redirect and POST for API calls)
// Note: Inherits global authLimiter from line 12
router.get("/auth/logout", logout);
router.post("/auth/logout", logout);

export default router;
