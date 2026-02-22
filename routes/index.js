import { Router } from "express";
import healthRoutes from "./healthRoutes.js";
import authRoutes from "./authRoutes.js";
import ssoRoutes from "./ssoRoutes.js";
import dashboardRoutes from "./dashboardRoutes.js";
import adminRoutes from "./adminRoutes.js";

const router = Router();

router.use("/", healthRoutes);
router.use("/", authRoutes);
router.use("/", ssoRoutes);
router.use("/", dashboardRoutes);
router.use("/admin", adminRoutes);

export default router;
