import { Router } from "express";
import healthRoutes from "./healthRoutes.js";
import authRoutes from "./authRoutes.js";
import ssoRoutes from "./ssoRoutes.js";
import dashboardRoutes from "./dashboardRoutes.js";
import adminRoutes from "./adminRoutes.js";

const router = Router();

router.use("/api", healthRoutes);
router.use("/api", authRoutes);
router.use("/api", ssoRoutes);
router.use("/api", dashboardRoutes);
router.use("/api/admin", adminRoutes);

export default router;
