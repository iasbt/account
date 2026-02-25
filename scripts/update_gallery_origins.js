
import pool from '../db.js';
import { config } from '../config/index.js';

async function updateGalleryOrigins() {
  try {
    console.log('Starting Gallery Origins Update...');
    
    // Check if gallery app exists
    const result = await pool.query("SELECT * FROM public.applications WHERE app_id = 'gallery'");
    
    if (result.rowCount === 0) {
      console.log('Gallery app not found in DB. It might be created on demand or not seeded yet.');
      // Create it if not exists (using config as fallback)
      // This is a simplified insert
      await pool.query(`
        INSERT INTO public.applications (app_id, name, allowed_origins, token_type, secret, is_active)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        'gallery',
        'Image Gallery',
        ['http://119.91.71.30:5173', 'http://119.91.71.30', 'http://119.91.71.30:3000', 'http://119.91.71.30:8080', 'http://localhost:5173'],
        'supabase',
        process.env.SSO_SECRET_GALLERY || config.ssoSecret, // Fallback to global secret if env not set
        true
      ]);
      console.log('Gallery app created.');
    } else {
      console.log('Gallery app found. Updating origins...');
      await pool.query(`
        UPDATE public.applications
        SET allowed_origins = $1
        WHERE app_id = 'gallery'
      `, [
        ['http://119.91.71.30:5173', 'http://119.91.71.30', 'http://119.91.71.30:3000', 'http://119.91.71.30:8080', 'http://localhost:5173']
      ]);
      console.log('Gallery origins updated.');
    }
    
    console.log('Update Complete.');
    process.exit(0);
  } catch (err) {
    console.error('Update Failed:', err);
    process.exit(1);
  }
}

updateGalleryOrigins();
