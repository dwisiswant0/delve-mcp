import { sessions, startDebugSession, sendDelveCommand } from '../session.js';

/**
 * Handle debug-related commands
 */
export async function handleDebugCommands(name: string, args: any) {
  switch (name) {
    case "debug": {
      const pkg = (args?.package as string) || ".";
      const buildFlags = args?.buildFlags as string | undefined;
      const cmdArgs: string[] = [];
      
      if (buildFlags) {
        cmdArgs.push("--build-flags", buildFlags);
      }

      const session = await startDebugSession("debug", pkg, cmdArgs);
      return {
        content: [{
          type: "text",
          text: `Started debug session ${session.id} for package ${pkg}`
        }]
      };
    }

    case "attach": {
      const pid = Number(args?.pid);
      if (!pid) {
        throw new Error("Process ID is required");
      }

      const session = await startDebugSession("attach", pid.toString());
      return {
        content: [{
          type: "text",
          text: `Attached to process ${pid} with session ${session.id}`
        }]
      };
    }

    case "exec": {
      const binary = String(args?.binary);
      const cmdArgs = (args?.args as string[]) || [];

      const session = await startDebugSession("exec", binary, cmdArgs);
      return {
        content: [{
          type: "text",
          text: `Started debug session ${session.id} for binary ${binary}`
        }]
      };
    }

    case "test": {
      const pkg = (args?.package as string) || ".";
      const testFlags = (args?.testFlags as string[]) || [];

      const session = await startDebugSession("test", pkg, ["--", ...testFlags]);
      return {
        content: [{
          type: "text",
          text: `Started test debug session ${session.id} for package ${pkg}`
        }]
      };
    }

    case "core": {
      const { executable, corePath } = args;
      const session = await startDebugSession("core", executable, [corePath]);
      return {
        content: [{
          type: "text",
          text: `Started core dump analysis session ${session.id} for ${executable} with core ${corePath}`
        }]
      };
    }

    case "dap": {
      const { clientAddr } = args;
      const cmdArgs = clientAddr ? ["--client-addr", clientAddr] : [];
      
      const session = await startDebugSession("dap", "", cmdArgs);
      return {
        content: [{
          type: "text",
          text: `Started DAP server session ${session.id}${clientAddr ? ` connecting to ${clientAddr}` : ''}`
        }]
      };
    }

    default:
      throw new Error("Unknown debug command");
  }
}