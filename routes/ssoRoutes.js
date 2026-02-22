import { Router } from "express";
import { issueSsoToken } from "../controllers/ssoController.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/sso/issue", requireAuth, issueSsoToken);

export default router;
