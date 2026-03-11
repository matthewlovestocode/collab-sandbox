import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { users } from "./schema.js";

export const userSelectSchema = createSelectSchema(users);
export const userInsertSchema = createInsertSchema(users);
