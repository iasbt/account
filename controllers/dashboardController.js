import pool from "../config/db.js";
import { logger } from "../middlewares/logger.js";

export const getDashboardStats = async (req, res) => {
  try {
    const [userCountResult, appsResult] = await Promise.all([
      // 1. Get total user count (V2 Standard: public.users)
      pool.query("SELECT COUNT(*)::int AS count FROM public.users"),
      // 2. Get active applications
      pool.query("SELECT * FROM public.applications WHERE is_active = true ORDER BY created_at ASC")
    ]);

    const userCount = userCountResult.rows[0]?.count || 0;
    const apps = appsResult.rows.map(app => ({
      id: app.app_id,
      name: app.name,
      // Use the first allowed origin as the default launch URL
      url: app.allowed_origins?.[0] || '#',
      // Description is not in DB yet, we can add it later or handle in frontend
      description: app.description || 'No description available.',
      icon: 'AppIcon' // Default icon
    }));

    return res.json({
      userCount,
      apps
    });
  } catch (error) {
    logger.error({ event: "dashboard_stats_error", error: error.message });
    return res.status(500).json({ message: "Failed to fetch dashboard stats" });
  }
};
