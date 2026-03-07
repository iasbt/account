
import { Router } from "express";
import healthRoutes from "./healthRoutes.js";
import galleryRoutes from "./galleryRoutes.js";

const router = Router();

// Mount routes
// Note: Nginx rewrites /api/xxx to /xxx, so we mount at root or specific paths without /api prefix.
router.use("/", healthRoutes); // /health
router.use("/", galleryRoutes); // /images, /categories

export default router;
