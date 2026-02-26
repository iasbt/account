import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { getImages, createImage, getCategories, createCategory } from "../controllers/galleryController.js";

const router = Router();

router.use(requireAuth); // Protect all routes

// Images
router.get("/images", getImages);
router.post("/images", createImage);

// Categories
router.get("/categories", getCategories);
router.post("/categories", createCategory);

// User Onboarding (Mock for now to fix 404)
router.get("/user/onboarding", (req, res) => {
  res.json({ completed: true });
});

export default router;
