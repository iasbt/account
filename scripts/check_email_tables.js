import pool from "../db.js";

const checkTables = async () => {
  try {
    const res = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('email_providers', 'email_logs', 'email_templates');
    `);
    console.log("Existing tables:", res.rows.map(r => r.table_name));
    
    // Check columns for email_providers to see if it matches V2 spec
    if (res.rows.some(r => r.table_name === 'email_providers')) {
        const cols = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'email_providers';
        `);
        console.log("email_providers columns:", cols.rows.map(c => c.column_name));
    }

  } catch (err) {
    console.error("Error checking tables:", err);
  } finally {
    pool.end();
  }
};

checkTables();
