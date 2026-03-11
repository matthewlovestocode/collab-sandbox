import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as schema from "./schema.js";

const databaseUrl = process.env.DATABASE_URL ?? "./data/dev.sqlite";
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const databasePath = resolve(repoRoot, databaseUrl);

mkdirSync(dirname(databasePath), { recursive: true });

const sqlite = new Database(databasePath);

export const db = drizzle(sqlite, { schema });
export { schema, sqlite };
