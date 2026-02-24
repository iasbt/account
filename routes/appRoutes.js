
import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { requireAdmin } from "../middlewares/roleCheck.js";
import { getApps, getApp, createApp, updateApp, deleteApp } from "../controllers/appController.js";

const router = Router();

// Protect all routes with authentication and admin check
router.use(requireAuth);
router.use(requireAdmin);

router.get("/", getApps);
router.get("/:id", getApp);
router.post("/", createApp);
router.put("/:id", updateApp);
router.delete("/:id", deleteApp);

export default router;
