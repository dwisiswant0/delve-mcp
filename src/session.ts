import { spawn } from "child_process";
import { createServer } from "net";
import { promisify } from "util";
import { exec as execCb } from "child_process";
import { DebugSession } from "./types.js";

const exec = promisify(execCb);

/**
 * Active debug sessions
 */
export const sessions: Map<string, DebugSession> = new Map();

/**
 * Get an available port by attempting to create a server
 */
export async function getAvailablePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.listen(0, () => {
      const address = server.address();
      if (address && typeof address === 'object') {
        const port = address.port;
        server.close(() => resolve(port));
      } else {
        reject(new Error('Could not get server address'));
      }
    });
  });
}

/**
 * Start a new debug session
 */
export async function startDebugSession(type: string, target: string, args: string[] = []): Promise<DebugSession> {
  const port = await getAvailablePort();
  const id = Math.random().toString(36).substring(7);
  
  const dlvArgs = [
    type,
    "--headless",
    `--listen=:${port}`,
    "--accept-multiclient",
    "--api-version=2",
    target,
    ...args
  ];

  const process = spawn("dlv", dlvArgs, {
    stdio: ["pipe", "pipe", "pipe"]
  });

  const session: DebugSession = {
    id,
    type,
    target,
    process,
    port,
    breakpoints: new Map()
  };

  sessions.set(id, session);
  return session;
}

/**
 * Send API command to a running delve session
 */
export async function sendDelveCommand(session: DebugSession, command: string, args: any = {}): Promise<any> {
  const { stdout } = await exec(`curl -s -X POST http://localhost:${session.port}/api/v2/${command} -d '${JSON.stringify(args)}'`);
  return JSON.parse(stdout);
}