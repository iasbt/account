
import { Router } from "express";
import authRoutes from "./authRoutes.js";
import healthRoutes from "./healthRoutes.js";
import dashboardRoutes from "./dashboardRoutes.js";
import adminRoutes from "./adminRoutes.js";
import ssoRoutes from "./ssoRoutes.js";
import appRoutes from "./appRoutes.js";
import restRoutes from "./restRoutes.js";

const router = Router();

// Mount routes
// Note: Nginx rewrites /api/xxx to /xxx, so we mount at root or specific paths without /api prefix.
router.use("/", healthRoutes); // /health
router.use("/", authRoutes);   // /auth/register, etc.
router.use("/", dashboardRoutes); // /dashboard/...
router.use("/admin", adminRoutes); // /admin/...
router.use("/", ssoRoutes);    // /sso/... (if defined in ssoRoutes)
router.use("/apps", appRoutes); // /apps/... (Admin App Management)
router.use("/rest", restRoutes); // /rest/v1/users (Supabase Mock)

export default router;
