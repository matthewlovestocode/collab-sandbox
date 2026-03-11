import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

const serverInfo = {
  name: "collab-sandbox-mcp-server",
  version: "0.1.0",
};

function createServer() {
  const server = new McpServer(serverInfo, {
    capabilities: {
      logging: {},
    },
  });

  server.registerTool(
    "ping",
    {
      title: "Ping",
      description: "Return a simple response from the MCP server.",
      inputSchema: {
        message: z.string().default("pong"),
      },
      outputSchema: {
        echoed: z.string(),
      },
    },
    async ({ message }) => {
      const output = { echoed: message };

      return {
        content: [{ type: "text", text: output.echoed }],
        structuredContent: output,
      };
    },
  );

  server.registerResource(
    "server-info",
    "info://server",
    {
      title: "Server Info",
      description: "Basic metadata about this MCP server.",
      mimeType: "application/json",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify(
            {
              ...serverInfo,
              transport: "http",
              endpoint: "/mcp",
            },
            null,
            2,
          ),
        },
      ],
    }),
  );

  server.registerResource(
    "greeting-template",
    new ResourceTemplate("greetings://{name}", { list: undefined }),
    {
      title: "Greeting Template",
      description: "A dynamic greeting resource.",
      mimeType: "text/plain",
    },
    async (uri, { name }) => ({
      contents: [
        {
          uri: uri.href,
          text: `Hello, ${name}. This response came from the MCP server scaffold.`,
        },
      ],
    }),
  );

  server.registerPrompt(
    "summarize-workspace",
    {
      title: "Summarize Workspace",
      description: "Prompt template for summarizing the current workspace state.",
      argsSchema: {
        focus: z.string().optional(),
      },
    },
    ({ focus }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: focus
              ? `Summarize the current workspace with an emphasis on ${focus}.`
              : "Summarize the current workspace and call out the most important moving parts.",
          },
        },
      ],
    }),
  );

  return server;
}

async function main() {
  const host = process.env.MCP_SERVER_HOST ?? "127.0.0.1";
  const port = Number(process.env.MCP_SERVER_PORT ?? 3002);
  const app = createMcpExpressApp({ host });

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.post("/mcp", async (req, res) => {
    const server = createServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error("Error handling MCP request:", error);

      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: "Internal server error",
          },
          id: null,
        });
      }
    } finally {
      await transport.close();
      await server.close();
    }
  });

  app.get("/mcp", (_req, res) => {
    res.status(405).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed.",
      },
      id: null,
    });
  });

  app.delete("/mcp", (_req, res) => {
    res.status(405).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed.",
      },
      id: null,
    });
  });

  app.listen(port, host, (error?: Error) => {
    if (error) {
      console.error("MCP server failed to start:", error);
      process.exit(1);
    }

    console.log(`MCP HTTP server listening on http://${host}:${port}/mcp`);
  });
}

main().catch((error) => {
  console.error("MCP server failed to start:", error);
  process.exit(1);
});
