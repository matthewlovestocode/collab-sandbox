# DB

This workspace contains the shared SQLite + Drizzle setup for the monorepo.

## Scripts

```sh
npm run db:generate --workspace @collab-sandbox/db
npm run db:migrate --workspace @collab-sandbox/db
npm run db:studio --workspace @collab-sandbox/db
```

## Environment

The database uses `DATABASE_URL` from the root `.env` file.

Example:

```env
DATABASE_URL=./data/dev.sqlite
```

## Structure

- `src/schema.ts`: Drizzle schema definitions
- `src/validation.ts`: Zod schemas generated from Drizzle tables
- `src/client.ts`: SQLite connection and Drizzle client
- `src/migrate.ts`: migration runner
- `drizzle.config.ts`: Drizzle Kit configuration

## Tables

- `users`: sample application table
- `agent_jobs`: persisted agent job state
- `agent_events`: persisted event log for SSE replay and job history
