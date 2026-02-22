import pool from "../db.js";

export const getDashboardStats = async (req, res) => {
  try {
    const [imageCountResult, latestImagesResult, userResult] = await Promise.all([
      pool.query("SELECT COUNT(*)::bigint AS count FROM gallery.images"),
      pool.query(
        `SELECT title, file_path
         FROM gallery.images
         ORDER BY created_at DESC NULLS LAST
         LIMIT 5`
      ),
      pool.query(
        "SELECT id, email, username FROM public.legacy_users WHERE email = $1 LIMIT 1",
        ["iasbt@outlook.com"]
      )
    ]);

    return res.json({
      totalImages: imageCountResult.rows[0]?.count ?? "0",
      latestImages: latestImagesResult.rows,
      user: userResult.rows[0] || null,
    });
  } catch (error) {
    console.error("Dashboard stats error", error);
    return res.status(500).json({ message: "查询失败" });
  }
};
