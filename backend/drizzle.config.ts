import { defineConfig } from "drizzle-kit";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  schema: path.join(__dirname, "./src/db/schema/index.ts"),
  out: path.join(__dirname, "./drizzle"),
  dialect: "postgresql",
  ...(process.env.DATABASE_URL
    ? { dbCredentials: { url: process.env.DATABASE_URL } }
    : {}),
});
