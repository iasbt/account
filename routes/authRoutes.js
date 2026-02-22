import { Router } from "express";
import { sendVerificationCode, register, login, getSsoToken } from "../controllers/authController.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.post("/auth/send-code", sendVerificationCode);
router.post("/auth/register", register);
router.post("/auth/login", login);
router.get("/auth/sso-token", requireAuth, getSsoToken);

export default router;
