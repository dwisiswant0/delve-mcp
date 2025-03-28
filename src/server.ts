import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { sessions } from "./session.js";
import { handleDebugCommands } from "./handlers/debug.js";
import { handleControlCommands } from "./handlers/control.js";
import { handleConfigCommands } from "./handlers/config.js";

/**
 * Create an MCP server with debugger capabilities
 */
export const server = new Server(
  { name: "delve-mcp", version: "0.1.0" },
  { capabilities: { resources: {}, tools: {} } }
);

/**
 * Handler for listing debug sessions as resources
 */
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: Array.from(sessions.entries()).map(([id, session]) => ({
      uri: `delve:///${id}`,
      mimeType: "application/json",
      name: `${session.type} - ${session.target}`,
      description: `Delve debug session for ${session.target} (${session.type})`
    }))
  };
});

/**
 * Handler for reading debug session details
 */
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const url = new URL(request.params.uri);
  const id = url.pathname.replace(/^\//, '');
  const session = sessions.get(id);

  if (!session) {
    throw new Error(`Debug session ${id} not found`);
  }

  return {
    contents: [{
      uri: request.params.uri,
      mimeType: "application/json",
      text: JSON.stringify({
        id: session.id,
        type: session.type,
        target: session.target,
        port: session.port
      }, null, 2)
    }]
  };
});

/**
 * Handler that lists available debug tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // Debug tools
      {
        name: "debug",
        description: "Start debugging a Go package",
        inputSchema: {
          type: "object",
          properties: {
            package: {
              type: "string",
              description: "Package to debug (defaults to current directory)"
            },
            buildFlags: {
              type: "string",
              description: "Build flags to pass to the compiler"
            }
          }
        }
      },
      {
        name: "attach",
        description: "Attach to a running process",
        inputSchema: {
          type: "object",
          properties: {
            pid: {
              type: "number",
              description: "Process ID to attach to"
            }
          },
          required: ["pid"]
        }
      },
      {
        name: "exec",
        description: "Debug a precompiled binary",
        inputSchema: {
          type: "object",
          properties: {
            binary: {
              type: "string",
              description: "Path to the binary"
            },
            args: {
              type: "array",
              items: { type: "string" },
              description: "Arguments to pass to the binary"
            }
          },
          required: ["binary"]
        }
      },
      {
        name: "test",
        description: "Debug tests in a package",
        inputSchema: {
          type: "object",
          properties: {
            package: {
              type: "string",
              description: "Package to test (defaults to current directory)"
            },
            testFlags: {
              type: "array",
              items: { type: "string" },
              description: "Flags to pass to go test"
            }
          }
        }
      },
      // Control tools
      {
        name: "setBreakpoint",
        description: "Set a breakpoint in the debugged program",
        inputSchema: {
          type: "object",
          properties: {
            sessionId: {
              type: "string",
              description: "ID of the debug session"
            },
            file: {
              type: "string",
              description: "File path where to set the breakpoint"
            },
            line: {
              type: "number",
              description: "Line number for the breakpoint"
            },
            condition: {
              type: "string",
              description: "Optional condition for the breakpoint"
            }
          },
          required: ["sessionId", "file", "line"]
        }
      },
      {
        name: "removeBreakpoint",
        description: "Remove a breakpoint",
        inputSchema: {
          type: "object",
          properties: {
            sessionId: {
              type: "string",
              description: "ID of the debug session"
            },
            breakpointId: {
              type: "number",
              description: "ID of the breakpoint to remove"
            }
          },
          required: ["sessionId", "breakpointId"]
        }
      },
      {
        name: "continue",
        description: "Continue program execution",
        inputSchema: {
          type: "object",
          properties: {
            sessionId: {
              type: "string",
              description: "ID of the debug session"
            }
          },
          required: ["sessionId"]
        }
      },
      {
        name: "next",
        description: "Step over to next line",
        inputSchema: {
          type: "object",
          properties: {
            sessionId: {
              type: "string",
              description: "ID of the debug session"
            }
          },
          required: ["sessionId"]
        }
      },
      {
        name: "step",
        description: "Step into function call",
        inputSchema: {
          type: "object",
          properties: {
            sessionId: {
              type: "string",
              description: "ID of the debug session"
            }
          },
          required: ["sessionId"]
        }
      },
      {
        name: "stepout",
        description: "Step out of current function",
        inputSchema: {
          type: "object",
          properties: {
            sessionId: {
              type: "string",
              description: "ID of the debug session"
            }
          },
          required: ["sessionId"]
        }
      },
      {
        name: "variables",
        description: "List local variables in current scope",
        inputSchema: {
          type: "object",
          properties: {
            sessionId: {
              type: "string",
              description: "ID of the debug session"
            }
          },
          required: ["sessionId"]
        }
      },
      {
        name: "evaluate",
        description: "Evaluate an expression in current scope",
        inputSchema: {
          type: "object",
          properties: {
            sessionId: {
              type: "string",
              description: "ID of the debug session"
            },
            expr: {
              type: "string", 
              description: "Expression to evaluate"
            }
          },
          required: ["sessionId", "expr"]
        }
      },
      // Advanced debug tools
      {
        name: "core",
        description: "Examine a core dump",
        inputSchema: {
          type: "object",
          properties: {
            executable: {
              type: "string",
              description: "Path to the executable that produced the core dump"
            },
            corePath: {
              type: "string",
              description: "Path to the core dump file"
            }
          },
          required: ["executable", "corePath"]
        }
      },
      {
        name: "dap",
        description: "Start a DAP (Debug Adapter Protocol) server",
        inputSchema: {
          type: "object",
          properties: {
            clientAddr: {
              type: "string",
              description: "Optional address where DAP client is waiting for connection"
            }
          }
        }
      },
      {
        name: "replay",
        description: "Replay an rr trace",
        inputSchema: {
          type: "object",
          properties: {
            tracePath: {
              type: "string",
              description: "Path to the rr trace directory"
            },
            onProcess: {
              type: "number",
              description: "Optional PID to pass to rr"
            }
          },
          required: ["tracePath"]
        }
      },
      {
        name: "trace",
        description: "Trace program execution",
        inputSchema: {
          type: "object",
          properties: {
            regexp: {
              type: "string",
              description: "Regular expression to match functions to trace"
            },
            pkg: {
              type: "string",
              description: "Package to trace (defaults to .)"
            },
            ebpf: {
              type: "boolean",
              description: "Use eBPF for tracing (experimental)"
            },
            stack: {
              type: "number",
              description: "Show stack trace with given depth"
            },
            pid: {
              type: "number",
              description: "Pid to attach to"
            }
          },
          required: ["regexp"]
        }
      },
      // Configuration tools
      {
        name: "version",
        description: "Get Delve version information",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "setBackend",
        description: "Set the backend for debugging",
        inputSchema: {
          type: "object",
          properties: {
            backend: {
              type: "string",
              description: "Backend to use (default, native, lldb, or rr)",
              enum: ["default", "native", "lldb", "rr"]
            }
          },
          required: ["backend"]
        }
      },
      {
        name: "configureLogging",
        description: "Configure debug logging",
        inputSchema: {
          type: "object",
          properties: {
            components: {
              type: "array",
              items: {
                type: "string",
                enum: ["debugger", "gdbwire", "lldbout", "debuglineerr", "rpc", "dap", "fncall", "minidump", "stack"]
              },
              description: "Components to enable logging for"
            },
            destination: {
              type: "string",
              description: "Log destination (file path or file descriptor)"
            }
          },
          required: ["components"]
        }
      }
    ]
  };
});

/**
 * Handler for debug tools
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  // Debug commands
  if (["debug", "attach", "exec", "test", "core", "dap", "replay", "trace"].includes(name)) {
    return handleDebugCommands(name, args);
  }

  // Control commands
  if (["setBreakpoint", "removeBreakpoint", "continue", "next", "step", "stepout", "variables", "evaluate"].includes(name)) {
    return handleControlCommands(name, args);
  }

  // Configuration commands
  if (["setBackend", "configureLogging", "version"].includes(name)) {
    return handleConfigCommands(name, args);
  }

  throw new Error("Unknown tool");
});