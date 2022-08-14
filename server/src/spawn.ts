import { spawn } from "child_process";
import { inBundlerDirectory } from "./bundler";

export async function runCommandWithOrWithoutBundler(
  command: string,
  args: string[],
  input: string
): Promise<RunCommandResult> {
  if (await inBundlerDirectory()) {
    return runCommandWithBundler(command, args, input);
  } else {
    return runCommand(command, args, input);
  }
}

function runCommandWithBundler(
  command: string,
  args: string[],
  input: string
): Promise<RunCommandResult> {
  return runCommand("bundler", ["exec", command, ...args], input);
}

export type RunCommandResult = {
  code: number | null;
  stderr: string;
  stdout: string;
};

async function runCommand(
  command: string,
  args: string[],
  input: string
): Promise<RunCommandResult> {
  const childProcess = spawn(command, args);
  childProcess.stdin.write(input);
  childProcess.stdin.end();
  let stdout = "";
  for await (const chunk of childProcess.stdout) {
    stdout += chunk.toString();
  }
  let stderr = "";
  for await (const chunk of childProcess.stderr) {
    stderr += chunk.toString();
  }
  const code: number | null = await new Promise((resolve, _reject) => {
    childProcess.on("close", (code) => {
      resolve(code);
    });
  });
  return {
    code,
    stderr,
    stdout,
  };
}
