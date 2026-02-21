import { Pool } from "pg";
import { writeFile } from "node:fs/promises";

const connectionString =
  process.env.SUPABASE_DB_URL ||
  "postgresql://postgres:QQaCt6MsB%3ASPGtd@db.izraerumphwwrjfdjfcp.supabase.co:5432/postgres";

const excludedTables = new Set([
  "schema_migrations",
  "supabase_migrations",
  "supabase_migrations_schema",
  "supabase_functions",
  "_prisma_migrations",
]);

function isExcludedTable(name) {
  return (
    excludedTables.has(name) ||
    name.startsWith("supabase_") ||
    name.startsWith("pg_")
  );
}

function escapeString(value) {
  return value.replace(/'/g, "''");
}

function formatArray(values, baseType) {
  const isNumberLike = ["smallint", "integer", "bigint", "numeric", "real", "double precision", "decimal"].includes(
    baseType
  );
  const isBoolean = baseType === "boolean";
  const elements = values.map((item) => {
    if (item === null) {
      return "NULL";
    }
    if (isNumberLike) {
      return String(item);
    }
    if (isBoolean) {
      return item ? "TRUE" : "FALSE";
    }
    const text = String(item).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    return `"${text}"`;
  });
  return `'{' + elements.join(",") + '}'`;
}

function formatValue(value, type) {
  if (value === null || value === undefined) {
    return "NULL";
  }
  if (Buffer.isBuffer(value)) {
    return `E'\\\\x${value.toString("hex")}'`;
  }
  if (Array.isArray(value) && type.endsWith("[]")) {
    const baseType = type.slice(0, -2);
    return formatArray(value, baseType);
  }
  if (typeof value === "number" || typeof value === "bigint") {
    return String(value);
  }
  if (typeof value === "boolean") {
    return value ? "TRUE" : "FALSE";
  }
  if (value instanceof Date) {
    return `'${value.toISOString()}'`;
  }
  if (typeof value === "object") {
    const jsonText = escapeString(JSON.stringify(value));
    if (type === "jsonb") {
      return `'${jsonText}'::jsonb`;
    }
    if (type === "json") {
      return `'${jsonText}'::json`;
    }
    return `'${jsonText}'`;
  }
  return `'${escapeString(String(value))}'`;
}

async function getTables(pool) {
  const { rows } = await pool.query(
    `
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
    `
  );
  return rows.map((row) => row.table_name).filter((name) => !isExcludedTable(name));
}

async function getColumns(pool, tableName) {
  const { rows } = await pool.query(
    `
    SELECT
      a.attname AS column_name,
      format_type(a.atttypid, a.atttypmod) AS data_type,
      a.attnotnull AS not_null,
      pg_get_expr(ad.adbin, ad.adrelid) AS column_default,
      a.attnum AS ordinal_position
    FROM pg_attribute a
    JOIN pg_class c ON a.attrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    LEFT JOIN pg_attrdef ad ON a.attrelid = ad.adrelid AND a.attnum = ad.adnum
    WHERE n.nspname = 'public'
      AND c.relname = $1
      AND a.attnum > 0
      AND NOT a.attisdropped
    ORDER BY a.attnum
    `,
    [tableName]
  );
  return rows;
}

async function getPrimaryKey(pool, tableName) {
  const { rows } = await pool.query(
    `
    SELECT a.attname AS column_name
    FROM pg_index i
    JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
    WHERE i.indrelid = $1::regclass
      AND i.indisprimary
    ORDER BY a.attnum
    `,
    [`public.${tableName}`]
  );
  return rows.map((row) => row.column_name);
}

function buildCreateTable(tableName, columns, primaryKey) {
  const columnLines = columns.map((col) => {
    const parts = [`"${col.column_name}"`, col.data_type];
    if (col.column_default) {
      parts.push(`DEFAULT ${col.column_default}`);
    }
    if (col.not_null) {
      parts.push("NOT NULL");
    }
    return parts.join(" ");
  });

  if (primaryKey.length > 0) {
    const pk = primaryKey.map((col) => `"${col}"`).join(", ");
    columnLines.push(`PRIMARY KEY (${pk})`);
  }

  return `CREATE TABLE IF NOT EXISTS "${tableName}" (\n  ${columnLines.join(
    ",\n  "
  )}\n);\n`;
}

async function buildInserts(pool, tableName, columns) {
  const { rows } = await pool.query(`SELECT * FROM "public"."${tableName}"`);
  if (rows.length === 0) {
    return "";
  }

  const columnNames = columns.map((col) => col.column_name);
  const columnTypes = columns.map((col) => col.data_type);
  const columnsSql = columnNames.map((col) => `"${col}"`).join(", ");

  const valuesSql = rows
    .map((row) => {
      const values = columnNames.map((colName, index) =>
        formatValue(row[colName], columnTypes[index])
      );
      return `(${values.join(", ")})`;
    })
    .join(",\n");

  return `INSERT INTO "${tableName}" (${columnsSql}) VALUES\n${valuesSql};\n`;
}

async function run() {
  const pool = new Pool({ connectionString });
  try {
    const tables = await getTables(pool);
    let output = "";

    for (const tableName of tables) {
      const columns = await getColumns(pool, tableName);
      const primaryKey = await getPrimaryKey(pool, tableName);
      output += buildCreateTable(tableName, columns, primaryKey);
      output += await buildInserts(pool, tableName, columns);
      output += "\n";
    }

    await writeFile("supabase_full_backup.sql", output, "utf-8");
    console.log("导出完成：supabase_full_backup.sql 已生成");
  } finally {
    await pool.end();
  }
}

run().catch((error) => {
  console.error("导出失败", error);
  process.exit(1);
});
