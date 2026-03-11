import { db, users } from "@collab-sandbox/db";
import { desc } from "drizzle-orm";
import { Router } from "express";

export const usersRouter = Router();

usersRouter.get("/", async (_req, res) => {
  const results = await db.select().from(users).orderBy(desc(users.createdAt));
  res.json({ users: results });
});
