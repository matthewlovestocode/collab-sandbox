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

The server reads `SERVER_PORT` from the root `.env` file. If not set, it defaults to `3001`.

## Endpoints

- `GET /health`: simple health response
- `GET /users`: returns users from the shared SQLite database

## Structure

- `src/index.ts`: Express app entrypoint
- `tsconfig.json`: server TypeScript build config
