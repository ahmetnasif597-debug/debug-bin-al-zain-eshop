import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import path from "path";
import { fileURLToPath } from "url";

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (!process.env.DATABASE_URL) {
  console.error("❌  DATABASE_URL is not set. Cannot run migrations.");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

const migrationsFolder = path.resolve(__dirname, "../drizzle");

console.log("🔄  Running database migrations…");

try {
  await migrate(db, { migrationsFolder });
  console.log("✅  Database migrations completed successfully.");
} catch (err) {
  console.error("❌  Migration failed:", err);
  process.exit(1);
} finally {
  await pool.end();
}
