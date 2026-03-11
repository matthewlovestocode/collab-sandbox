# Server

This workspace contains a minimal TypeScript Express server.

## Scripts

```sh
npm run dev --workspace server
npm run build --workspace server
npm run start --workspace server
npm run lint --workspace server
```

## Environment

The server reads these values from the root `.env` file:

- `SERVER_PORT`: HTTP port, defaults to `3001`
- `OPENAI_API_KEY`: API key used for agent jobs
- `OPENAI_MODEL`: model used for agent jobs, defaults to `gpt-5`

## Endpoints

- `GET /health`: simple health response
- `GET /users`: returns users from the shared SQLite database
- `POST /agents`: creates an OpenAI-backed agent job
- `GET /agents/:id`: returns an agent job snapshot with persisted events
- `GET /agents/:id/events`: SSE stream for live agent events
- `POST /agents/:id/cancel`: cancels a running agent job

## Structure

- `src/index.ts`: Express app entrypoint
- `tsconfig.json`: server TypeScript build config

## Agent SSE flow

The server persists agent job state and events to SQLite, then streams live updates over Server-Sent Events. Agent execution is backed by the OpenAI Responses API, which keeps the same event model you can later reuse for a more specialized Codex worker.
