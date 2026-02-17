import pg from 'pg';
import mysql from 'mysql2/promise';

// --- Configuration ---
const POSTGRES_CONFIG = {
  host: '119.91.71.30',
  port: 5432,
  user: 'postgres',
  password: '8plYGAfmtW79aDXL',
  database: 'supabase_backup',
};

const MYSQL_CONFIG = {
  host: '119.91.71.30',
  port: 3306,
  user: 'root',
  password: '8plYGAfmtW79aDXL',
  database: 'casdoor',
};

// --- Main Migration Logic ---
async function migrate() {
  console.log('🚀 Starting migration...');
  
  // 1. Connect to Postgres
  console.log('Connecting to PostgreSQL...');
  const pgClient = new pg.Client(POSTGRES_CONFIG);
  await pgClient.connect();
  console.log('✅ Connected to PostgreSQL');

  // 2. Connect to MySQL
  console.log('Connecting to MySQL...');
  const mysqlConnection = await mysql.createConnection(MYSQL_CONFIG);
  console.log('✅ Connected to MySQL');

  try {
    // 3. Fetch users from Supabase (Postgres)
    // Note: Supabase stores users in `auth.users`
    const res = await pgClient.query('SELECT * FROM auth.users');
    const users = res.rows;
    console.log(`Found ${users.length} users in Supabase backup.`);

    // 4. Migrate each user
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const user of users) {
      const email = user.email;
      const id = user.id; // UUID
      const createdAt = new Date(user.created_at).toISOString();
      const updatedAt = new Date(user.updated_at || user.created_at).toISOString();
      const passwordHash = user.encrypted_password;
      const metadata = user.raw_user_meta_data || {};
      
      // Construct Casdoor User fields
      // Default owner and organization are usually "built-in"
      const owner = "built-in";
      const organization = "built-in";
      const name = metadata.username || email.split('@')[0]; // Prefer username from metadata, fallback to email prefix
      const displayName = metadata.full_name || metadata.name || name;
      const avatar = metadata.avatar_url || "";
      const phone = user.phone || "";
      
      // Check if user exists in Casdoor
      const [rows] = await mysqlConnection.execute(
        'SELECT * FROM user WHERE owner = ? AND name = ?',
        [owner, name] // Casdoor uses (owner, name) as unique key
      );

      if (rows.length > 0) {
        console.log(`⚠️ User ${name} (${email}) already exists. Skipping.`);
        skipCount++;
        continue;
      }

      // Insert into Casdoor `user` table
      // Casdoor table structure is complex, we need to map essential fields.
      // Important: `password` field stores the hash, `password_type` stores the algorithm.
      // Supabase uses bcrypt.
      // Note: `owner` column serves as the Organization identifier.
      
      const query = `
        INSERT INTO user (
          owner, name, created_time, updated_time,
          id, type, password, password_type,
          display_name, email, email_verified,
          phone, avatar,
          is_admin, is_forbidden, is_deleted,
          signup_application, region, location, 
          affiliation, title, id_card_type, id_card, 
          homepage, bio, tag, language, gender, birthday, education, score, karma, ranking, is_default_avatar, properties
        ) VALUES (
          ?, ?, ?, ?,
          ?, 'normal-user', ?, 'bcrypt',
          ?, ?, ?,
          ?, ?,
          0, 0, 0,
          'app-built-in', '', '',
          '', '', '', '',
          '', '', '', 'zh', '', '', '', 0, 0, 0, 0, '{}'
        )
      `;

      const values = [
        owner, name, createdAt, updatedAt,
        id, passwordHash, 
        displayName, email, user.email_confirmed_at ? 1 : 0,
        phone, avatar
      ];

      try {
        await mysqlConnection.execute(query, values);
        console.log(`✅ Migrated user: ${name} (${email})`);
        successCount++;
      } catch (err) {
        console.error(`❌ Failed to migrate user ${name}:`, err.message);
        errorCount++;
      }
    }

    console.log('----------------------------------------');
    console.log(`Migration Complete.`);
    console.log(`Success: ${successCount}`);
    console.log(`Skipped: ${skipCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log('----------------------------------------');

  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await pgClient.end();
    await mysqlConnection.end();
  }
}

migrate();
