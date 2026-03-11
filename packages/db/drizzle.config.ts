import { defineConfig } from "drizzle-kit";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const configDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(configDir, "../..");

export default defineConfig({
  schema: resolve(configDir, "src/schema.ts"),
  out: resolve(configDir, "drizzle"),
  dialect: "sqlite",
  dbCredentials: {
    url: resolve(repoRoot, process.env.DATABASE_URL ?? "./data/dev.sqlite"),
  },
});
