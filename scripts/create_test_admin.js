
import pool from '../db.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const run = async () => {
  try {
    const email = 'admin@example.com';
    const name = 'admin';
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log(`Checking for user: ${email} / ${name}`);

    // Check if user exists
    const res = await pool.query(
      "SELECT * FROM public.users WHERE email = $1 OR name = $2",
      [email, name]
    );

    if (res.rowCount > 0) {
      console.log('User exists. Updating password and admin status...');
      const user = res.rows[0];
      await pool.query(
        "UPDATE public.users SET password = $1, is_admin = true WHERE id = $2",
        [hashedPassword, user.id]
      );
      console.log(`User ${user.name} updated.`);
    } else {
      console.log('User does not exist. Creating new admin user...');
      const id = uuidv4();
      await pool.query(
        "INSERT INTO public.users (id, name, email, password, is_admin) VALUES ($1, $2, $3, $4, true)",
        [id, name, email, hashedPassword]
      );
      console.log(`User ${name} created.`);
    }

    console.log('Done.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    // Wait a bit for logs to flush
    setTimeout(() => process.exit(0), 1000);
  }
};

run();
