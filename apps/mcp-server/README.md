# MCP Server

This workspace contains a TypeScript MCP server built with the official `@modelcontextprotocol/sdk`.

## Scripts

```sh
npm run dev --workspace mcp-server
npm run build --workspace mcp-server
npm run start --workspace mcp-server
npm run lint --workspace mcp-server
```

## Transport

The scaffold uses Streamable HTTP over Express.

- MCP endpoint: `POST /mcp`
- Health endpoint: `GET /health`
- Default URL: `http://127.0.0.1:3002/mcp`

## Environment

An example env file is available at `apps/mcp-server/.env.example`.

The server reads these values from the root `.env` file:

- `MCP_SERVER_HOST`: bind host, defaults to `127.0.0.1`
- `MCP_SERVER_PORT`: HTTP port, defaults to `3002`

## Included capabilities

- `ping` tool: returns a simple echoed response
- `info://server` resource: exposes basic server metadata
- `greetings://{name}` resource template: dynamic greeting content
- `summarize-workspace` prompt: starter prompt template

## Structure

- `src/index.ts`: MCP server entrypoint and registrations
- `tsconfig.json`: build config for the workspace
