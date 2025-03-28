#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { server } from "./server.js";
import { sessions } from "./session.js";

/**
 * Start the server using stdio transport
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Cleanup sessions on exit
  process.on("exit", () => {
    for (const session of sessions.values()) {
      if (session.process) {
        session.process.kill();
      }
    }
  });
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
