import { ChildProcess } from "child_process";

/**
 * Interface representing a breakpoint
 */
export interface Breakpoint {
  id: number;
  file: string;
  line: number;
  condition?: string;
}

/**
 * Interface representing a debug session
 */
export interface DebugSession {
  id: string;
  type: string; // 'debug' | 'attach' | 'exec' | 'test' | 'core' | 'replay' | 'trace' | 'dap'
  target: string;
  process?: ChildProcess;
  port: number;
  breakpoints: Map<number, Breakpoint>;
  logOutput?: string[];
  backend?: string;
}