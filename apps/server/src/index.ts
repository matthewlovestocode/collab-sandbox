import "dotenv/config";
import { db, users } from "@collab-sandbox/db";
import { desc } from "drizzle-orm";
import express from "express";

const app = express();
const port = Number(process.env.SERVER_PORT ?? 3001);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/users", async (_req, res) => {
  const results = await db.select().from(users).orderBy(desc(users.createdAt));
  res.json({ users: results });
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
