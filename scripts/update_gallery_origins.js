
import pool from '../db.js';
import { config } from '../config/index.js';

async function updateGalleryOrigins() {
  try {
    console.log('Starting Gallery Origins Update...');
    
    // Check if gallery app exists
    const result = await pool.query("SELECT * FROM public.applications WHERE app_id = 'gallery'");
    
    const galleryHost = process.env.GALLERY_HOST || 'http://119.91.71.30';
    const origins = [
        `${galleryHost}:5173`,
        galleryHost,
        `${galleryHost}:3000`,
        `${galleryHost}:8080`,
        'http://localhost:5173'
    ];

    if (result.rowCount === 0) {
      console.log('Gallery app not found in DB. It might be created on demand or not seeded yet.');
      // Create it if not exists (using config as fallback)
      // This is a simplified insert
      await pool.query(`
        INSERT INTO public.applications (app_id, name, allowed_origins, secret, is_active)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        'gallery',
        'Image Gallery',
        origins,
        process.env.SSO_SECRET_GALLERY || config.ssoSecret,
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
        origins
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
