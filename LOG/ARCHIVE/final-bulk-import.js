import dotenv from "dotenv";
import { Pool } from "pg";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

dotenv.config();

const CSV_DIR =
  process.env.CSV_DIR || "D:\\OneDrive\\Desktop\\数据库备份";

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const tableSchemaMap = new Map([
  ["applications", "public"],
  ["legacy_users", "public"],
  ["users", "public"],
  ["policy_versions", "public"],
  ["profiles", "public"],
  ["user_app_access", "public"],
  ["user_consent_logs", "public"],
  ["categories", "gallery"],
  ["images", "gallery"],
  ["image_likes", "gallery"],
  ["albums", "gallery"],
]);

const importPriority = [
  "applications_rows.csv",
  "legacy_users_rows.csv",
  "categories_rows.csv",
  "images_rows.csv",
];

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }
    if (char === ",") {
      row.push(field);
      field = "";
      continue;
    }
    if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }
    if (char === "\r") {
      continue;
    }
    field += char;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function isInteger(value) {
  return /^-?\d+$/.test(value);
}

function isNumber(value) {
  return /^-?\d+(\.\d+)?$/.test(value);
}

function isBoolean(value) {
  return /^(true|false)$/i.test(value);
}

function isTimestamp(value) {
  const time = Date.parse(value);
  return Number.isFinite(time);
}

function parseJsonIfPossible(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function inferTypeFromSamples(columnName, samples) {
  if (columnName === "exif") {
    return "jsonb";
  }
  if (columnName.endsWith("_at")) {
    return "timestamptz";
  }
  if (columnName.startsWith("is_")) {
    return "boolean";
  }

  const nonEmpty = samples.filter((value) => value !== "");
  if (nonEmpty.length === 0) {
    return "text";
  }

  let allBoolean = true;
  let allInteger = true;
  let allNumber = true;
  let allTimestamp = true;
  let allUuid = true;
  let allJsonArray = true;
  let allJson = true;
  let arrayElementType = null;

  for (const value of nonEmpty) {
    allBoolean = allBoolean && isBoolean(value);
    allInteger = allInteger && isInteger(value);
    allNumber = allNumber && isNumber(value);
    allTimestamp = allTimestamp && isTimestamp(value);
    allUuid = allUuid && isUuid(value);

    const jsonValue = parseJsonIfPossible(value);
    if (jsonValue === null) {
      allJson = false;
      allJsonArray = false;
    } else {
      if (!Array.isArray(jsonValue)) {
        allJsonArray = false;
      } else {
        if (jsonValue.every((item) => typeof item === "string" && isUuid(item))) {
          arrayElementType = arrayElementType || "uuid";
        } else if (jsonValue.every((item) => typeof item === "number")) {
          arrayElementType = arrayElementType || "numeric";
        } else if (jsonValue.every((item) => typeof item === "string")) {
          arrayElementType = arrayElementType || "text";
        } else {
          arrayElementType = "text";
        }
      }
    }
  }

  if (allBoolean) {
    return "boolean";
  }
  if (allInteger) {
    return "bigint";
  }
  if (allNumber) {
    return "numeric";
  }
  if (allTimestamp) {
    return "timestamptz";
  }
  if (allUuid) {
    return "uuid";
  }
  if (allJsonArray && arrayElementType) {
    return `${arrayElementType}[]`;
  }
  if (allJson) {
    return "jsonb";
  }
  return "text";
}

function coerceValue(value, type, columnName) {
  if (value === "") {
    return null;
  }
  const normalized = typeof value === "string" ? value.trim() : value;
  if (type === "boolean") {
    return /^true$/i.test(normalized);
  }
  if (type === "bigint" || type === "integer" || type === "numeric") {
    return Number(normalized);
  }
  if (type === "uuid") {
    return normalized;
  }
  if (type === "timestamptz" || type === "timestamp without time zone") {
    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (type.endsWith("[]")) {
    const jsonValue = parseJsonIfPossible(normalized);
    if (Array.isArray(jsonValue)) {
      return jsonValue;
    }
    return normalized === "[]" ? [] : [normalized];
  }
  if (type === "json" || type === "jsonb" || columnName === "exif") {
    const jsonValue = parseJsonIfPossible(normalized);
    return jsonValue ?? normalized;
  }
  return normalized;
}

async function ensureSchema(schemaName) {
  await pool.query(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);
}

async function tableExists(schemaName, tableName) {
  const { rows } = await pool.query(
    `
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = $1 AND table_name = $2
    `,
    [schemaName, tableName]
  );
  return rows.length > 0;
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

async function createTableIfMissing(schemaName, tableName, headers, samples) {
  const exists = await tableExists(schemaName, tableName);
  if (exists) {
    return;
  }

  const columnDefs = headers.map((columnName) => {
    const columnSamples = samples.map((row) => row[columnName] ?? "");
    const type = inferTypeFromSamples(columnName, columnSamples);
    return `"${columnName}" ${type}`;
  });

  const hasId = headers.includes("id");
  const sql = `
    CREATE TABLE IF NOT EXISTS "${schemaName}"."${tableName}" (
      ${columnDefs.join(",\n      ")}
      ${hasId ? ",\n      PRIMARY KEY (id)" : ""}
    );
  `;
  await pool.query(sql);
}

function extractTableName(fileName) {
  return fileName.replace(/_rows\.csv$/i, "");
}

async function seedCoreUsers() {
  const users = [
    {
      id: "70572163-fce2-4996-ae67-3673f759b7c5",
      email: "iasbt@iasbt.local",
      username: "iasbt",
    },
    {
      id: "ace0da4c-04e8-460f-b77c-0da2eea45935",
      email: "user_a@iasbt.local",
      username: "user_a",
    },
    {
      id: "40b39d98-b4df-4ef2-b212-47c1d63ded18",
      email: "user_b@iasbt.local",
      username: "user_b",
    },
  ];

  for (const user of users) {
    const randomPassword = crypto.randomBytes(12).toString("hex");
    await pool.query(
      `
      INSERT INTO public.legacy_users (id, email, password_hash, username, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE
      SET email = EXCLUDED.email,
          password_hash = EXCLUDED.password_hash,
          username = EXCLUDED.username,
          updated_at = NOW()
      `,
      [user.id, user.email, randomPassword, user.username]
    );
  }
}

async function importCsv(filePath) {
  const fileName = path.basename(filePath);
  const tableName = extractTableName(fileName);
  const schemaName = tableSchemaMap.get(tableName) || "public";

  await ensureSchema(schemaName);

  const content = await readFile(filePath, "utf-8");
  const rows = parseCsv(content);
  if (rows.length === 0) {
    return;
  }

  const headers = rows[0].map((header) => header.trim());
  const dataRows = rows.slice(1).filter((row) => row.length > 0);

  const samples = dataRows.slice(0, 100).map((row) => {
    const sample = {};
    headers.forEach((header, index) => {
      sample[header] = row[index] ?? "";
    });
    return sample;
  });

  await createTableIfMissing(schemaName, tableName, headers, samples);

  const columnInfo = await getColumns(schemaName, tableName);
  const columnMap = new Map(columnInfo.map((col) => [col.name, col.type]));

  const insertColumns = headers.filter((header) => columnMap.has(header));
  const placeholders = insertColumns.map((_, index) => `$${index + 1}`).join(", ");

  const conflictClause =
    tableName === "legacy_users"
      ? `ON CONFLICT (id) DO UPDATE SET ${insertColumns
          .filter((col) => col !== "id")
          .map((col) => `"${col}" = EXCLUDED."${col}"`)
          .join(", ")}`
      : "";

  const insertSql = `
    INSERT INTO "${schemaName}"."${tableName}" (${insertColumns
      .map((col) => `"${col}"`)
      .join(", ")})
    VALUES (${placeholders})
    ${conflictClause}
  `;

  for (let rowIndex = 0; rowIndex < dataRows.length; rowIndex += 1) {
    const row = dataRows[rowIndex];
    try {
      const values = insertColumns.map((columnName, index) => {
        const rawValue = row[headers.indexOf(columnName)] ?? "";
        const type = columnMap.get(columnName) || "text";
        return coerceValue(rawValue, type, columnName);
      });
      await pool.query(insertSql, values);
    } catch (error) {
      console.warn(
        `跳过损坏行: ${fileName} 第 ${rowIndex + 2} 行`,
        error.message || error
      );
    }
  }
}

async function printReport() {
  const legacyCount = await pool.query(
    `SELECT COUNT(*)::bigint AS count FROM public.legacy_users`
  );
  const imagesCount = await pool.query(
    `SELECT COUNT(*)::bigint AS count FROM gallery.images`
  );
  const randomImage = await pool.query(
    `SELECT title, taken_at FROM gallery.images ORDER BY random() LIMIT 1`
  );

  console.log("\n竣工验收报告");
  console.log(`public.legacy_users 行数: ${legacyCount.rows[0].count}`);
  console.log(`gallery.images 行数: ${imagesCount.rows[0].count}`);
  if (randomImage.rows.length > 0) {
    console.log(
      `随机图片: ${randomImage.rows[0].title} | ${randomImage.rows[0].taken_at}`
    );
  } else {
    console.log("随机图片: 无数据");
  }
}

async function run() {
  try {
    await seedCoreUsers();

    const files = await readdir(CSV_DIR);
    const csvFiles = files.filter((file) => file.endsWith("_rows.csv"));
    const priority = importPriority.filter((file) => csvFiles.includes(file));
    const remaining = csvFiles
      .filter((file) => !priority.includes(file))
      .sort();
    const importList = [...priority, ...remaining];

    for (const fileName of importList) {
      const filePath = path.join(CSV_DIR, fileName);
      console.log(`开始导入 ${fileName}`);
      await importCsv(filePath);
    }

    await printReport();
  } finally {
    await pool.end();
  }
}

run().catch((error) => {
  console.error("批量导入失败", error);
  process.exit(1);
});
