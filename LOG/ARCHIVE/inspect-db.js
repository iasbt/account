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

async function getRowCount(schemaName, tableName) {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::bigint AS count FROM "${schemaName}"."${tableName}"`
  );
  return rows[0]?.count ?? "0";
}

async function inspectCoreTable(tableName) {
  const schemaName = "public";
  const columns = await getColumns(schemaName, tableName);
  if (columns.length === 0) {
    return { exists: false };
  }
  const rowCount = await getRowCount(schemaName, tableName);
  return { exists: true, columns, rowCount };
}

async function run() {
  try {
    const schemas = await getSchemas();
    console.log("Schema 列表:");
    console.log(schemas.join(", ") || "(无)");

    const tablesBySchema = await getTablesBySchema();
    console.log("\n表清单:");
    for (const [schemaName, tables] of tablesBySchema.entries()) {
      console.log(`${schemaName}: ${tables.join(", ") || "(无)"}`);
    }

    const legacyUsers = await inspectCoreTable("legacy_users");
    console.log("\n表结构: legacy_users");
    if (!legacyUsers.exists) {
      console.log("public.legacy_users 不存在");
    } else {
      for (const col of legacyUsers.columns) {
        console.log(`${col.name} ${col.type}`);
      }
      console.log(`行数: ${legacyUsers.rowCount}`);
    }

    const images = await inspectCoreTable("images");
    console.log("\n表结构: images");
    if (!images.exists) {
      console.log("public.images 不存在");
    } else {
      for (const col of images.columns) {
        console.log(`${col.name} ${col.type}`);
      }
      console.log(`行数: ${images.rowCount}`);
    }
  } finally {
    await pool.end();
  }
}

run().catch((error) => {
  console.error("检查失败", error);
  process.exit(1);
});
