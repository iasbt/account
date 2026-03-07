
import { Router } from "express";
import authRoutes from "./authRoutes.js";
import healthRoutes from "./healthRoutes.js";
import dashboardRoutes from "./dashboardRoutes.js";
import adminRoutes from "./adminRoutes.js";
import ssoRoutes from "./ssoRoutes.js";
import appRoutes from "./appRoutes.js";
import galleryRoutes from "./galleryRoutes.js";
import { config } from "../config/index.js";

const router = Router();
const logtoMode = config.authMode === "logto";
const externalIssuer = config.oidc?.externalIssuer || "";
const externalJwksUrl = config.oidc?.externalJwksUrl || "";

// Mount routes
// Note: Nginx rewrites /api/xxx to /xxx, so we mount at root or specific paths without /api prefix.
router.use("/", healthRoutes); // /health
router.use("/", authRoutes);   // /auth/register, etc.
router.use("/", dashboardRoutes); // /dashboard/...
router.use("/admin", adminRoutes); // /admin/...
if (logtoMode) {
  router.get("/.well-known/openid-configuration", (_req, res) => {
    if (!externalIssuer) return res.status(404).end();
    return res.redirect(`${externalIssuer}/.well-known/openid-configuration`);
  });
  router.get("/.well-known/jwks.json", (_req, res) => {
    if (!externalJwksUrl) return res.status(404).end();
    return res.redirect(externalJwksUrl);
  });
  router.all("/oauth/*", (_req, res) => {
    return res.status(410).json({ message: "该接口已废弃，请改用 Logto OIDC" });
  });
  router.all("/interaction/*", (_req, res) => {
    return res.status(410).json({ message: "该接口已废弃，请改用 Logto OIDC" });
  });
} else {
  router.use("/", ssoRoutes);
}
router.use("/apps", appRoutes); // /apps/... (Admin App Management)
router.use("/", galleryRoutes); // /images, /categories

export default router;
