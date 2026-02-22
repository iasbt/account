import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { requireAdmin } from "../middlewares/roleCheck.js";
import { getAllUsers } from "../controllers/adminController.js";

const router = Router();

// 所有管理接口都需要登录和管理员权限
router.use(requireAuth);
router.use(requireAdmin);

router.get("/users", getAllUsers);

export default router;
