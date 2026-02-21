import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function createSchemas() {
  await pool.query("CREATE SCHEMA IF NOT EXISTS gallery");
  await pool.query("CREATE SCHEMA IF NOT EXISTS toolbox");
  await pool.query("CREATE SCHEMA IF NOT EXISTS life_os");
}

async function createPublicTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.users (
      id BIGSERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.legacy_users (
      id UUID PRIMARY KEY,
      email TEXT,
      password_hash TEXT,
      username TEXT,
      created_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ,
      uid TEXT,
      has_accepted_upload_terms BOOLEAN NOT NULL DEFAULT FALSE,
      category_order UUID[] NOT NULL DEFAULT '{}'::uuid[],
      hidden_category_ids UUID[] NOT NULL DEFAULT '{}'::uuid[],
      has_seen_onboarding BOOLEAN NOT NULL DEFAULT FALSE
    );
  `);
}

async function createGalleryTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS gallery.categories (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT,
      sort_order INTEGER,
      user_id UUID REFERENCES public.legacy_users(id)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS gallery.albums (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL,
      user_id UUID REFERENCES public.legacy_users(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS gallery.images (
      id UUID PRIMARY KEY,
      user_id UUID REFERENCES public.legacy_users(id),
      title TEXT,
      description TEXT,
      file_url TEXT,
      file_path TEXT,
      file_size BIGINT,
      width INTEGER,
      height INTEGER,
      category_id UUID REFERENCES gallery.categories(id),
      created_at TIMESTAMPTZ,
      is_public BOOLEAN NOT NULL DEFAULT FALSE,
      exif JSONB,
      taken_at TIMESTAMPTZ,
      deleted_at TIMESTAMPTZ,
      original_name TEXT,
      format TEXT,
      is_favorite BOOLEAN NOT NULL DEFAULT FALSE
    );
  `);
}

async function getSchemas() {
  const { rows } = await pool.query(
    `
    SELECT schema_name
    FROM information_schema.schemata
    ORDER BY schema_name
    `
  );
  return rows.map((row) => row.schema_name);
}

async function getTablesBySchema() {
  const { rows } = await pool.query(
    `
    SELECT table_schema, table_name
    FROM information_schema.tables
    WHERE table_type = 'BASE TABLE'
    ORDER BY table_schema, table_name
    `
  );
  const grouped = new Map();
  for (const row of rows) {
    if (!grouped.has(row.table_schema)) {
      grouped.set(row.table_schema, []);
    }
    grouped.get(row.table_schema).push(row.table_name);
  }
  return grouped;
}

async function getColumns(schemaName, tableName) {
  const { rows } = await pool.query(
    `
    SELECT column_name, data_type, udt_name
    FROM information_schema.columns
    WHERE table_schema = $1 AND table_name = $2
    ORDER BY ordinal_position
    `,
    [schemaName, tableName]
  );
  return rows.map((row) => ({
    name: row.column_name,
    type: row.data_type === "ARRAY" ? `${row.udt_name}[]` : row.data_type,
  }));
}

async function runInspect() {
  const schemas = await getSchemas();
  console.log("Schema 列表:");
  console.log(schemas.join(", ") || "(无)");

  const tablesBySchema = await getTablesBySchema();
  console.log("\n表清单:");
  for (const [schemaName, tables] of tablesBySchema.entries()) {
    console.log(`${schemaName}: ${tables.join(", ") || "(无)"}`);
  }

  const imagesColumns = await getColumns("gallery", "images");
  console.log("\n表结构: gallery.images");
  if (imagesColumns.length === 0) {
    console.log("gallery.images 不存在");
  } else {
    for (const col of imagesColumns) {
      console.log(`${col.name} ${col.type}`);
    }
  }
}

async function run() {
  try {
    await createSchemas();
    await createPublicTables();
    await createGalleryTables();
    await runInspect();
    console.log("\n结构重建完成");
  } finally {
    await pool.end();
  }
}

run().catch((error) => {
  console.error("结构重建失败", error);
  process.exit(1);
});
