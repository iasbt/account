import dotenv from "dotenv";
import { Pool } from "pg";
import { logger } from "../utils/logger.js";

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

pool
  .connect()
  .then((client) => {
    logger.info({ event: "db_connected" });
    client.release();
  })
  .catch((error) => {
    logger.error({ event: "db_connection_error", error: error.message });
  });

export default pool;
