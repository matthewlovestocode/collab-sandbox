"use client";

import { useEffect, useRef, useState } from "react";

type AgentStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

type AgentEvent = {
  id?: number;
  type: string;
  payload: Record<string, unknown>;
  createdAt?: string | number | Date;
};

type AgentJob = {
  id: string;
  status: AgentStatus;
  prompt: string;
  result?: string | null;
  error?: string | null;
};

const serverUrl =
  process.env.NEXT_PUBLIC_SERVER_URL?.replace(/\/$/, "") ??
  "http://localhost:3001";

export function AgentTestPanel() {
  const [prompt, setPrompt] = useState("Summarize the purpose of this repo.");
  const [job, setJob] = useState<AgentJob | null>(null);
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [connectionState, setConnectionState] = useState<
    "idle" | "connecting" | "open" | "closed"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

  const appendEvent = (event: AgentEvent) => {
    setEvents((current) => [...current, event]);
  };

  const connectToEvents = (jobId: string) => {
    eventSourceRef.current?.close();
    setConnectionState("connecting");

    const source = new EventSource(`${serverUrl}/agents/${jobId}/events`);
    eventSourceRef.current = source;

    source.addEventListener("ready", () => {
      setConnectionState("open");
    });

    for (const eventName of [
      "status",
      "log",
      "message",
      "result",
      "error",
      "complete",
    ]) {
      source.addEventListener(eventName, (event) => {
        const parsed = JSON.parse((event as MessageEvent).data) as AgentEvent & {
          payload: Record<string, unknown>;
        };

        appendEvent(parsed);

        if (eventName === "status") {
          const status = parsed.payload.status;
          if (typeof status === "string") {
            setJob((current) =>
              current ? { ...current, status: status as AgentStatus } : current,
            );
          }
        }

        if (eventName === "result") {
          const text = parsed.payload.text;
          if (typeof text === "string") {
            setJob((current) =>
              current ? { ...current, result: text, status: "completed" } : current,
            );
          }
        }

        if (eventName === "error") {
          const message = parsed.payload.message;
          if (typeof message === "string") {
            setError(message);
            setJob((current) =>
              current ? { ...current, error: message, status: "failed" } : current,
            );
          }
        }

        if (eventName === "complete") {
          source.close();
          setConnectionState("closed");
        }
      });
    }

    source.onerror = () => {
      setConnectionState("closed");
    };
  };

  const handleStart = async () => {
    setIsSubmitting(true);
    setError(null);
    setEvents([]);
    setJob(null);
    eventSourceRef.current?.close();

    try {
      const response = await fetch(`${serverUrl}/agents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create job: ${response.status}`);
      }

      const data = (await response.json()) as { job: AgentJob };
      setJob(data.job);
      connectToEvents(data.job.id);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to start the agent job.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!job) {
      return;
    }

    try {
      const response = await fetch(`${serverUrl}/agents/${job.id}/cancel`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(`Failed to cancel job: ${response.status}`);
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to cancel the agent job.",
      );
    }
  };

  return (
    <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">
              Agent Workflow Test
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Starts an agent job on the Express server and streams updates back
              over SSE.
            </p>
          </div>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-700">Prompt</span>
            <textarea
              className="min-h-40 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
            />
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              disabled={isSubmitting}
              onClick={handleStart}
              type="button"
            >
              {isSubmitting ? "Starting..." : "Start job"}
            </button>
            <button
              className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!job || job.status !== "running"}
              onClick={handleCancel}
              type="button"
            >
              Cancel job
            </button>
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}
        </div>
      </div>

      <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">
              Job State
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Live snapshot from the current browser session.
            </p>
          </div>

          <dl className="grid gap-3 text-sm text-slate-700">
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <dt className="font-medium text-slate-500">Server URL</dt>
              <dd className="mt-1 break-all text-slate-950">{serverUrl}</dd>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <dt className="font-medium text-slate-500">Job ID</dt>
              <dd className="mt-1 break-all text-slate-950">
                {job?.id ?? "No job started"}
              </dd>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <dt className="font-medium text-slate-500">Status</dt>
              <dd className="mt-1 text-slate-950">{job?.status ?? "idle"}</dd>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <dt className="font-medium text-slate-500">SSE connection</dt>
              <dd className="mt-1 text-slate-950">{connectionState}</dd>
            </div>
          </dl>

          <div className="rounded-2xl bg-slate-950 px-4 py-4 text-sm text-slate-100">
            <p className="font-medium text-slate-300">Latest result</p>
            <pre className="mt-3 whitespace-pre-wrap break-words font-sans text-sm">
              {job?.result ?? "No result yet."}
            </pre>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm lg:col-span-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">
              Event Stream
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Status, log, message, result, and completion events as they
              arrive.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
            {events.length} events
          </span>
        </div>

        <div className="mt-4 max-h-[28rem] overflow-auto rounded-2xl bg-slate-50 p-4">
          {events.length === 0 ? (
            <p className="text-sm text-slate-500">No events yet.</p>
          ) : (
            <ul className="space-y-3">
              {events.map((event, index) => (
                <li
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                  key={`${event.id ?? "event"}-${index}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {event.type}
                    </span>
                    <span className="text-xs text-slate-400">
                      {event.id ? `#${event.id}` : "live"}
                    </span>
                  </div>
                  <pre className="mt-3 whitespace-pre-wrap break-words font-sans text-sm text-slate-800">
                    {JSON.stringify(event.payload, null, 2)}
                  </pre>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
