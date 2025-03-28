# delve-mcp

MCP server for Delve debugger integration

This is a TypeScript-based MCP server that provides a complete interface to the Delve debugger for Go programs. It implements all major Delve commands and capabilities through MCP tools.

## Features

### Resources

- List and access debug sessions via `delve://` URIs
- Each session has metadata about its type, target, and port
- JSON representation for session details and state

### Tools

Debug, trace, and analyze Go programs with:
- Debug commands (`debug`, `attach`, `exec`, `test`)
- Core dump analysis
- Program tracing
- Replay debugging with `rr`
- DAP server support
- Breakpoint management with conditions
- Execution control (`continue`, `step`, `next`)
- Variable inspection and evaluation
- Backend selection (`native`, `lldb`, `rr`)
- Logging configuration
- Session management

### Environment Setup

The server requires:

- Go installed with Delve (`go install github.com/go-delve/delve/cmd/dlv@latest`)
- For replay functionality: Mozilla `rr` (https://github.com/mozilla/rr)
- Node.js and npm

## Installation

To install Delve MCP server:

```bash
npm install @dwisiswant0/delve-mcp
```

## Development

Install dependencies:

```bash
npm install
```

Build the server:

```bash
npm run build
```

For development with auto-rebuild:

```bash
npm run watch
```

### Configuration

To use with Claude Desktop, add the server config:

* On Linux: `~/.config/Claude/claude_desktop_config.json`.
* On MacOS: `~/Library/Application Support/Claude/claude_desktop_config.json`.
* On Windows: `%APPDATA%/Claude/claude_desktop_config.json`.

```json
{
  "mcpServers": {
    "delve-mcp": {
      "command": "/path/to/delve-mcp/build/index.js"
    }
  }
}
```

## Available Tools

### Debug Commands

- **`debug`** - Debug a Go package in current directory or specified package
- **`attach`** - Attach to a running process by PID
- **`exec`** - Execute and debug a precompiled binary
- **`test`** - Debug tests in current package or specified package
- **`core`** - Examine a core dump file with associated executable
- **`dap`** - Start a Debug Adapter Protocol (DAP) server
- **`replay`** - Replay an rr trace recording
- **`trace`** - Trace program execution with function matching

### Control Commands

- **`setBreakpoint`** - Set a breakpoint with optional condition
- **`removeBreakpoint`** - Remove an existing breakpoint
- **`continue`** - Continue program execution
- **`next`** - Step over to next line
- **`step`** - Step into function call
- **`stepout`** - Step out of current function
- **`variables`** - List local variables in current scope
- **`evaluate`** - Evaluate expression in current scope

### Configuration Commands

- **`version`** - Get Delve version information
- **`setBackend`** - Configure debug backend (`native`, `lldb`, `rr`)
- **`configureLogging`** - Configure debug logging components

## Usage Examples

### Starting a Debug Session

```typescript
// Debug current package
{ name: "debug" }

// Debug with specific package and build flags
{
  name: "debug",
  arguments: {
    package: "./cmd/myapp",
    buildFlags: "-tags=integration"
  }
}
```

### Managing Breakpoints

```typescript
// Set a breakpoint
{
  name: "setBreakpoint",
  arguments: {
    sessionId: "abc123",
    file: "main.go",
    line: 42,
    condition: "count > 5"
  }
}
```

### Inspecting State

```typescript
// List variables
{
  name: "variables",
  arguments: {
    sessionId: "abc123"
  }
}

// Evaluate expression
{
  name: "evaluate",
  arguments: {
    sessionId: "abc123",
    expr: "myVar.Field"
  }
}
```

## License

MIT.
