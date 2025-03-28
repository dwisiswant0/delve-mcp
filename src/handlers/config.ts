import { promisify } from "util";
import { exec as execCb } from "child_process";

const exec = promisify(execCb);

/**
 * Handle configuration commands
 */
export async function handleConfigCommands(name: string, args: any) {
  switch (name) {
    case "setBackend": {
      const { backend } = args;
      if (!["default", "native", "lldb", "rr"].includes(backend)) {
        throw new Error("Invalid backend specified");
      }

      process.env.DELVE_BACKEND = backend;
      return {
        content: [{
          type: "text",
          text: `Set Delve backend to ${backend}`
        }]
      };
    }

    case "configureLogging": {
      const { components, destination } = args;
      const validComponents = ["debugger", "gdbwire", "lldbout", "debuglineerr", "rpc", "dap", "fncall", "minidump", "stack"];
      
      for (const component of components) {
        if (!validComponents.includes(component)) {
          throw new Error(`Invalid log component: ${component}`);
        }
      }

      process.env.DELVE_LOG = "1";
      process.env.DELVE_LOG_OUTPUT = components.join(",");
      if (destination) {
        process.env.DELVE_LOG_DEST = destination;
      }

      return {
        content: [{
          type: "text",
          text: `Configured logging for components: ${components.join(", ")}`
        }]
      };
    }

    case "version": {
      const { stdout } = await exec("dlv version");
      return {
        content: [{
          type: "text",
          text: stdout
        }]
      };
    }

    default:
      throw new Error("Unknown configuration command");
  }
}