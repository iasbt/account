import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { 
  getImages, 
  createImage, 
  getCategories, 
  createCategory,
  getPreferences,
  updatePreferences,
  getOnboarding,
  updateOnboarding
} from "../controllers/galleryController.js";

const router = Router();

// Schemas
const createImageSchema = z.object({
  body: z.object({
    title: z.string().min(1, "标题不能为空"),
    file_url: z.string().url("图片URL无效"),
    file_path: z.string().optional(),
    width: z.number().positive("宽度必须大于0"),
    height: z.number().positive("高度必须大于0"),
    category_id: z.number().optional()
  })
});

const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, "分类名称不能为空"),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "颜色代码无效").optional()
  })
});

const updatePreferencesSchema = z.object({
  body: z.object({
    hasAcceptedTerms: z.boolean().optional(),
    hasSeenOnboarding: z.boolean().optional(),
    categoryOrder: z.array(z.number()).optional(),
    hiddenCategoryIds: z.array(z.number()).optional()
  })
});

router.use(requireAuth); // Protect all routes

// Images
router.get("/images", getImages);
router.post("/images", validate(createImageSchema), createImage);

// Categories
router.get("/categories", getCategories);
router.post("/categories", validate(createCategorySchema), createCategory);

// User Preferences
router.get("/user/preferences", getPreferences);
router.patch("/user/preferences", validate(updatePreferencesSchema), updatePreferences);

// User Onboarding (Legacy/Specific check)
router.get("/user/onboarding", getOnboarding);

router.post("/user/onboarding", updateOnboarding);

export default router;
