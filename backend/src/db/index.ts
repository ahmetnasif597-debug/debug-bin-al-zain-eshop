import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNodePg } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const DATABASE_URL = process.env.DATABASE_URL;

// Neon serverless (HTTP) للإنتاج — يدعم فقط postgres:// أو postgresql:// على Neon
// node-postgres (TCP) للتطوير المحلي مع Postgres عادي (localhost / 127.0.0.1)
function isLocalDatabase(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "0.0.0.0" ||
      host === "::1" ||
      host.endsWith(".local")
    );
  } catch {
    return false;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db: any = isLocalDatabase(DATABASE_URL)
  ? drizzleNodePg(new Pool({ connectionString: DATABASE_URL }), { schema })
  : drizzleNeon(neon(DATABASE_URL), { schema });

export * from "./schema";
