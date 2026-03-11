import { agentEvents, agentJobs, db } from "@collab-sandbox/db";
import { asc, eq, gt } from "drizzle-orm";
import OpenAI from "openai";
import type { Response } from "express";
import { randomUUID } from "node:crypto";
import { serverConfig } from "../config.js";

export type AgentEventType =
  | "status"
  | "log"
  | "message"
  | "result"
  | "error"
  | "complete";

type SseClient = {
  id: string;
  res: Response;
};

const openai = serverConfig.openAiApiKey
  ? new OpenAI({ apiKey: serverConfig.openAiApiKey })
  : null;

const sseClients = new Map<string, SseClient[]>();
const runningJobs = new Map<string, AbortController>();

function writeSseEvent(
  res: Response,
  event: string,
  data: Record<string, unknown>,
  id?: number,
) {
  if (id) {
    res.write(`id: ${id}\n`);
  }
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function addClient(jobId: string, client: SseClient) {
  const clients = sseClients.get(jobId) ?? [];
  clients.push(client);
  sseClients.set(jobId, clients);
}

function removeClient(jobId: string, clientId: string) {
  const clients = sseClients.get(jobId) ?? [];
  const next = clients.filter((client) => client.id !== clientId);

  if (next.length === 0) {
    sseClients.delete(jobId);
    return;
  }

  sseClients.set(jobId, next);
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

async function updateJob(
  jobId: string,
  values: Partial<typeof agentJobs.$inferInsert>,
) {
  const [job] = await db
    .update(agentJobs)
    .set({
      ...values,
      updatedAt: new Date(),
    })
    .where(eq(agentJobs.id, jobId))
    .returning();

  return job;
}

export async function recordEvent(
  jobId: string,
  type: AgentEventType,
  payload: Record<string, unknown>,
) {
  const [event] = await db
    .insert(agentEvents)
    .values({
      jobId,
      type,
      payload: JSON.stringify(payload),
    })
    .returning();

  const message = {
    id: event.id,
    jobId,
    type,
    payload,
    createdAt: event.createdAt,
  };

  for (const client of sseClients.get(jobId) ?? []) {
    writeSseEvent(client.res, type, message, event.id);
  }

  return message;
}

async function completeJob(jobId: string, result: string) {
  runningJobs.delete(jobId);
  await updateJob(jobId, {
    status: "completed",
    result,
    finishedAt: new Date(),
  });
  await recordEvent(jobId, "result", { text: result });
  await recordEvent(jobId, "complete", { status: "completed" });
}

async function failJob(jobId: string, error: string) {
  runningJobs.delete(jobId);
  await updateJob(jobId, {
    status: "failed",
    error,
    finishedAt: new Date(),
  });
  await recordEvent(jobId, "error", { message: error });
  await recordEvent(jobId, "complete", { status: "failed" });
}

export async function cancelAgentJob(jobId: string) {
  const controller = runningJobs.get(jobId);
  controller?.abort();
  runningJobs.delete(jobId);
  await updateJob(jobId, {
    status: "cancelled",
    finishedAt: new Date(),
  });
  await recordEvent(jobId, "status", { status: "cancelled" });
  await recordEvent(jobId, "complete", { status: "cancelled" });
}

async function runOpenAiAgent(jobId: string, prompt: string) {
  if (!openai) {
    await failJob(jobId, "OPENAI_API_KEY is not configured on the server.");
    return;
  }

  const controller = new AbortController();
  runningJobs.set(jobId, controller);

  try {
    await updateJob(jobId, {
      status: "running",
      startedAt: new Date(),
    });
    await recordEvent(jobId, "status", { status: "running" });
    await recordEvent(jobId, "log", {
      message: `Submitting prompt to OpenAI model ${serverConfig.openAiModel}.`,
    });

    const stream = await openai.responses.stream(
      {
        model: serverConfig.openAiModel,
        input: prompt,
      },
      {
        signal: controller.signal,
      },
    );

    let outputText = "";

    for await (const event of stream) {
      if (controller.signal.aborted) {
        return;
      }

      if (event.type === "response.output_text.delta") {
        outputText += event.delta;
        await recordEvent(jobId, "message", { delta: event.delta });
        continue;
      }

      if (event.type === "response.completed") {
        const finalText =
          outputText.trim() ||
          event.response.output_text ||
          "The OpenAI agent completed without text output.";
        await completeJob(jobId, finalText);
        return;
      }

      if (event.type === "response.failed") {
        const message = event.response.error?.message ?? "OpenAI response failed.";
        await failJob(jobId, message);
        return;
      }
    }

    if (!controller.signal.aborted) {
      await completeJob(
        jobId,
        outputText.trim() || "The OpenAI agent completed without text output.",
      );
    }
  } catch (error) {
    if (isAbortError(error)) {
      return;
    }

    await failJob(
      jobId,
      error instanceof Error ? error.message : "OpenAI agent execution failed.",
    );
  }
}

export async function createAgentJob(prompt: string) {
  const jobId = randomUUID();

  const [job] = await db
    .insert(agentJobs)
    .values({
      id: jobId,
      prompt,
      cwd: serverConfig.cwd,
    })
    .returning();

  await recordEvent(jobId, "status", { status: "queued" });
  void runOpenAiAgent(jobId, prompt);

  return job;
}

export async function getAgentJob(jobId: string) {
  const [job] = await db
    .select()
    .from(agentJobs)
    .where(eq(agentJobs.id, jobId))
    .limit(1);

  return job;
}

export async function getAgentJobSnapshot(jobId: string) {
  const job = await getAgentJob(jobId);

  if (!job) {
    return null;
  }

  const events = await db
    .select()
    .from(agentEvents)
    .where(eq(agentEvents.jobId, jobId))
    .orderBy(asc(agentEvents.id));

  return {
    job,
    events: events.map((event) => ({
      ...event,
      payload: JSON.parse(event.payload),
    })),
  };
}

export async function attachAgentEventStream(
  jobId: string,
  res: Response,
  lastEventId: number,
) {
  const clientId = randomUUID();
  addClient(jobId, { id: clientId, res });

  const job = await getAgentJob(jobId);
  if (!job) {
    removeClient(jobId, clientId);
    return null;
  }

  writeSseEvent(res, "ready", { jobId: job.id, status: job.status });

  const missedEvents = await db
    .select()
    .from(agentEvents)
    .where(lastEventId ? gt(agentEvents.id, lastEventId) : eq(agentEvents.jobId, job.id))
    .orderBy(asc(agentEvents.id));

  for (const event of missedEvents) {
    if (event.jobId !== job.id) {
      continue;
    }

    writeSseEvent(
      res,
      event.type,
      {
        id: event.id,
        jobId: event.jobId,
        type: event.type,
        payload: JSON.parse(event.payload),
        createdAt: event.createdAt,
      },
      event.id,
    );
  }

  return {
    clientId,
    close: () => removeClient(jobId, clientId),
  };
}
