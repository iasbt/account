import { Router } from "express";
import { issueSsoToken, authorize, token } from "../controllers/ssoController.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/sso/issue", requireAuth, issueSsoToken);

// OAuth 2.0 Authorization Code Flow
router.post("/oauth/authorize", requireAuth, authorize);
router.post("/oauth/token", token);

export default router;
