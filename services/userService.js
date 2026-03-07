import pool from "../config/db.js";
import { logger } from "../utils/logger.js";

// Sync Logto user to local database (Just-in-Time Migration)
export const syncLogtoUser = async (user) => {
  if (!user || !user.id) return null;

  try {
    const { id, email, name, avatar_url, isAdmin } = user;
    
    // Upsert user: If exists, update; if not, insert.
    // We map Logto 'sub' (user.id) to local 'id'.
    // We map Logto 'isAdmin' boolean to local 'is_admin'.
    // Use fallback email if missing (some Logto setups might not return email in ID token without scope)
    const emailValue = email || `no-email-${id}@logto.local`;
    const nameValue = name || 'Logto User';
    const avatarValue = avatar_url || null;
    const isAdminValue = isAdmin || false;

    // Use password placeholder for Logto users as they don't use local password auth
    const passwordPlaceholder = 'LOGTO_MANAGED';

    const query = `
      INSERT INTO users (id, email, name, avatar_url, is_admin, password, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = COALESCE(EXCLUDED.name, users.name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
        is_admin = COALESCE(EXCLUDED.is_admin, users.is_admin),
        updated_at = NOW()
      RETURNING *
    `;
    
    const values = [id, emailValue, nameValue, avatarValue, isAdminValue, passwordPlaceholder];

    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    logger.error({ event: "sync_logto_user_error", error: error.message, userId: user.id });
    // If sync fails, the user might still proceed but DB writes will fail FK constraints.
    return null;
  }
};

export const getUserById = async (id) => {
  const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
  return result.rows[0];
};
