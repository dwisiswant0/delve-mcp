import { sessions, sendDelveCommand } from '../session.js';
import { Breakpoint } from '../types.js';

/**
 * Handle execution control commands
 */
export async function handleControlCommands(name: string, args: any) {
  const { sessionId } = args;
  const session = sessions.get(sessionId);
  if (!session) {
    throw new Error(`Debug session ${sessionId} not found`);
  }

  switch (name) {
    case "setBreakpoint": {
      const { file, line, condition } = args;
      const response = await sendDelveCommand(session, "CreateBreakpoint", {
        file,
        line,
        cond: condition
      });

      const bp: Breakpoint = {
        id: response.id,
        file,
        line,
        condition
      };
      session.breakpoints.set(bp.id, bp);

      return {
        content: [{
          type: "text",
          text: `Set breakpoint ${bp.id} at ${file}:${line}`
        }]
      };
    }

    case "removeBreakpoint": {
      const { breakpointId } = args;
      await sendDelveCommand(session, "ClearBreakpoint", { id: breakpointId });
      session.breakpoints.delete(breakpointId);

      return {
        content: [{
          type: "text",
          text: `Removed breakpoint ${breakpointId}`
        }]
      };
    }

    case "continue": {
      await sendDelveCommand(session, "Command", { name: "continue" });
      return {
        content: [{
          type: "text",
          text: "Continued execution"
        }]
      };
    }

    case "next": {
      await sendDelveCommand(session, "Command", { name: "next" });
      return {
        content: [{
          type: "text",
          text: "Stepped to next line"
        }]
      };
    }

    case "step": {
      await sendDelveCommand(session, "Command", { name: "step" });
      return {
        content: [{
          type: "text",
          text: "Stepped into function"
        }]
      };
    }

    case "stepout": {
      await sendDelveCommand(session, "Command", { name: "stepout" });
      return {
        content: [{
          type: "text",
          text: "Stepped out of function"
        }]
      };
    }

    case "variables": {
      const response = await sendDelveCommand(session, "ListLocalVars", {});
      return {
        content: [{
          type: "text",
          text: JSON.stringify(response.Variables, null, 2)
        }]
      };
    }

    case "evaluate": {
      const { expr } = args;
      const response = await sendDelveCommand(session, "Eval", { expr });
      return {
        content: [{
          type: "text",
          text: JSON.stringify(response.Variable, null, 2)
        }]
      };
    }

    default:
      throw new Error("Unknown control command");
  }
}