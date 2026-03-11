import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { agentEvents, agentJobs, users } from "./schema.js";

export const userSelectSchema = createSelectSchema(users);
export const userInsertSchema = createInsertSchema(users);
export const agentJobSelectSchema = createSelectSchema(agentJobs);
export const agentJobInsertSchema = createInsertSchema(agentJobs);
export const agentEventSelectSchema = createSelectSchema(agentEvents);
export const agentEventInsertSchema = createInsertSchema(agentEvents);
