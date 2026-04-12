#!/usr/bin/env node
/**
 * OpenPGx MCP Server v0.4.0 — Talk to your DNA.
 *
 * An open-source MCP Server that transforms raw genetic data into
 * genomic intelligence using the OpenPGx standard format.
 *
 * Modules:
 * 1. Medications (PGx) — drug-gene interactions
 * 2. Risks — disease predisposition
 * 3. Traits — observable characteristics
 *
 * Usage: npx openpgx
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { createServer, OPENPGX_VERSION } from "./server-core.js";

// === Entry point (stdio for npx / local MCP clients) ===
async function main() {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`OpenPGx MCP server v${OPENPGX_VERSION} running via stdio`);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
