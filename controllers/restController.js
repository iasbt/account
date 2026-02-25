import { pool } from "../config/db.js";
import { verifyToken } from "../utils/token.js";

export const getUsers = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      // No token provided, return empty array as per Supabase behavior for unauthenticated requests to protected tables
      return res.json([]);
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.json([]);
    }

    let payload = verifyToken(token);

    if (!payload) {
      try {
        const result = await pool.query(
          "SELECT secret FROM public.applications WHERE token_type = 'supabase' AND secret IS NOT NULL"
        );
        for (const row of result.rows) {
          const candidate = verifyToken(token, row.secret);
          if (candidate) {
            payload = candidate;
            break;
          }
        }
      } catch (error) {
        console.error("Supabase token verification error in REST API:", error);
      }
    }

    if (!payload) {
      return res.json([]);
    }

    // Token is valid. Return mock user data for Gallery
    // Gallery expects: has_accepted_upload_terms, has_seen_onboarding, category_order, hidden_category_ids
    const userId = payload.sub || payload.id;
    
    // We return a single object inside an array because Supabase .select() returns an array by default
    // unless .single() is used, but even then, for 'id=eq.undefined', it might expect a list.
    // The frontend code is likely doing .select('*').eq('id', userId) or similar.
    
    return res.json([{
      id: userId,
      has_accepted_upload_terms: true,
      has_seen_onboarding: true,
      category_order: [],
      hidden_category_ids: []
    }]);
    
  } catch (error) {
    console.error("Rest API Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
