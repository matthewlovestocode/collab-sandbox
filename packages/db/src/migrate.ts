import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

const databaseUrl = process.env.DATABASE_URL ?? "./data/dev.sqlite";
const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = resolve(packageRoot, "../..");
const databasePath = resolve(repoRoot, databaseUrl);

mkdirSync(dirname(databasePath), { recursive: true });

const sqlite = new Database(databasePath);
const db = drizzle(sqlite);

migrate(db, {
  migrationsFolder: resolve(packageRoot, "drizzle"),
});

sqlite.close();
