import {
  attachAgentEventStream,
  cancelAgentJob,
  createAgentJob,
  getAgentJob,
  getAgentJobSnapshot,
} from "../services/agent-jobs.js";
import { Router } from "express";
import { z } from "zod";

const createAgentJobSchema = z.object({
  prompt: z.string().min(1),
});

export const agentsRouter = Router();

agentsRouter.post("/", async (req, res) => {
  const parsed = createAgentJobSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid request body",
      details: parsed.error.flatten(),
    });
    return;
  }

  const job = await createAgentJob(parsed.data.prompt);
  res.status(201).json({ job });
});

agentsRouter.get("/:id", async (req, res) => {
  const snapshot = await getAgentJobSnapshot(req.params.id);

  if (!snapshot) {
    res.status(404).json({ error: "Agent job not found" });
    return;
  }

  res.json(snapshot);
});

agentsRouter.get("/:id/events", async (req, res) => {
  const job = await getAgentJob(req.params.id);

  if (!job) {
    res.status(404).json({ error: "Agent job not found" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const lastEventId = Number(req.header("last-event-id") ?? 0);
  const stream = await attachAgentEventStream(job.id, res, lastEventId);

  if (!stream) {
    res.status(404).json({ error: "Agent job not found" });
    return;
  }

  const heartbeat = setInterval(() => {
    res.write(": keepalive\n\n");
  }, 15000);

  req.on("close", () => {
    clearInterval(heartbeat);
    stream.close();
  });
});

agentsRouter.post("/:id/cancel", async (req, res) => {
  const job = await getAgentJob(req.params.id);

  if (!job) {
    res.status(404).json({ error: "Agent job not found" });
    return;
  }

  if (job.status === "completed" || job.status === "failed" || job.status === "cancelled") {
    res.status(409).json({ error: `Agent job is already ${job.status}` });
    return;
  }

  await cancelAgentJob(job.id);
  res.json({ ok: true });
});
