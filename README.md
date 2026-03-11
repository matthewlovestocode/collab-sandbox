# collab-sandbox

`collab-sandbox` is an `npm` workspaces monorepo with three application workspaces:

- `apps/web`: Next.js web client
- `apps/server`: TypeScript Express server
- `apps/mcp-server`: TypeScript MCP server

`turbo` orchestrates workspace scripts from the repo root.

## Requirements

- Node.js 20+
- npm 10+

## Getting started

```sh
npm install
cp .env.example .env
npm run dev
```

`npm run dev` starts all three apps from the repo root.

## Common commands

```sh
npm run dev
npm run dev:mcp-server
npm run build
npm run lint
npm run test
```

Run a command for a single workspace:

```sh
npm run dev --workspace web
npm run dev --workspace server
npm run dev --workspace mcp-server
```

## Environment

Root environment variables live in `.env`.

- `WEB_PORT`: port used by the Next.js app
- `SERVER_PORT`: port used by the Express server
- `MCP_SERVER_HOST`: bind host used by the MCP HTTP server
- `MCP_SERVER_PORT`: port used by the MCP HTTP server

## Layout

- `apps/`: deployable applications
- `packages/`: shared libraries and shared configuration
- `tsconfig.base.json`: shared TypeScript defaults for workspaces that extend it
