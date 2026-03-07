import { Router } from "express";
import { getHealth } from "../controllers/healthController.js";

const router = Router();

// Public health check endpoint
router.get("/", getHealth);

export default router;
