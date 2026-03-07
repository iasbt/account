
import { Router } from "express";
import galleryRoutes from "./galleryRoutes.js";
import healthRoutes from "./healthRoutes.js";

const router = Router();

router.use("/", galleryRoutes);
router.use("/health", healthRoutes);

export default router;
