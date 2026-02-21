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

pool
  .connect()
  .then((client) => {
    console.log("Database connected");
    client.release();
  })
  .catch((error) => {
    console.error("Database connection error", error);
  });

export default pool;
