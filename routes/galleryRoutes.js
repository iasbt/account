import { Router } from "express";
import pool from "../config/db.js";
import { requireAuth } from "../middlewares/auth.js";
import { 
  getImages, 
  createImage, 
  getCategories, 
  createCategory,
  getPreferences,
  updatePreferences,
  updateOnboarding
} from "../controllers/galleryController.js";

const router = Router();

router.use(requireAuth); // Protect all routes

// Images
router.get("/images", getImages);
router.post("/images", createImage);

// Categories
router.get("/categories", getCategories);
router.post("/categories", createCategory);

// User Preferences
router.get("/user/preferences", getPreferences);
router.patch("/user/preferences", updatePreferences);

// User Onboarding (Legacy/Specific check)
router.get("/user/onboarding", async (req, res) => {
  try {
    const result = await pool.query("SELECT has_seen_onboarding FROM user_preferences WHERE user_id = $1", [req.user.id]);
    const completed = result.rows[0]?.has_seen_onboarding || false;
    res.json({ completed });
  } catch (error) {
    console.error("Onboarding check error:", error);
    res.status(500).json({ completed: false });
  }
});

router.post("/user/onboarding", updateOnboarding);

export default router;
