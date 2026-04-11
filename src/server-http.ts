#!/usr/bin/env node
/**
 * OpenPGx MCP Server — HTTP transport for remote deployment.
 * Serves the same 9 tools as the stdio version via Streamable HTTP.
 *
 * Usage:
 *   node dist/server-http.js          # listens on PORT (default 3200)
 *   PORT=8080 node dist/server-http.js
 */

import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer, OPENPGX_VERSION } from "./server-core.js";
import { createServer as createHttpServer, IncomingMessage, ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";

const PORT = parseInt(process.env.PORT ?? "3200", 10);
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

interface SessionEntry {
  transport: StreamableHTTPServerTransport;
  lastActivity: number;
}

const sessions = new Map<string, SessionEntry>();

setInterval(() => {
  const now = Date.now();
  for (const [sid, entry] of sessions) {
    if (now - entry.lastActivity > SESSION_TTL_MS) {
      entry.transport.close?.();
      sessions.delete(sid);
    }
  }
}, 60_000);

async function handleMcp(req: IncomingMessage, res: ServerResponse) {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  if (sessionId && sessions.has(sessionId)) {
    const entry = sessions.get(sessionId)!;
    entry.lastActivity = Date.now();
    await entry.transport.handleRequest(req, res);
    return;
  }

  if (sessionId && !sessions.has(sessionId)) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Session not found" }));
    return;
  }

  if (req.method === "DELETE") {
    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "No session to delete" }));
    return;
  }

  let capturedSid: string | undefined;
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => {
      capturedSid = randomUUID();
      return capturedSid;
    },
  });

  const server = createServer();
  await server.connect(transport);
  await transport.handleRequest(req, res);

  if (capturedSid) {
    sessions.set(capturedSid, { transport, lastActivity: Date.now() });
    transport.onclose = () => {
      sessions.delete(capturedSid!);
    };
  }
}

function handleRequest(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, mcp-session-id");
  res.setHeader("Access-Control-Expose-Headers", "mcp-session-id");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (url.pathname === "/mcp") {
    handleMcp(req, res).catch((err) => {
      console.error("MCP error:", err);
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Internal server error" }));
      }
    });
    return;
  }

  if (url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", version: OPENPGX_VERSION, sessions: sessions.size }));
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found. Use POST /mcp for MCP protocol." }));
}

const httpServer = createHttpServer(handleRequest);

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`OpenPGx MCP server v${OPENPGX_VERSION} running on http://0.0.0.0:${PORT}/mcp`);
});
