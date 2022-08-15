import { existsSync } from "fs";
import path = require("path");
import { currentOrAncestorDirectories } from "./directory";
import { runCommandWithOrWithoutBundler } from "./spawn";

export async function inRuboCopDirectory(): Promise<boolean> {
  const directories = await currentOrAncestorDirectories();
  return directories.some(hasRuboCopYml);
}

export type RuboCopOffense = {
  cop_name: string;
  correctable: boolean;
  corrected: boolean;
  location: RuboCopLocation;
  message: string;
  severity: RuboCopSeverity;
};

export type RuboCopSeverity =
  | "convention"
  | "error"
  | "fatal"
  | "info"
  | "refactor"
  | "warning";

export type RuboCopLocation = {
  column: number;
  last_column: number;
  last_line: number;
  length: number;
  line: number;
  start_column: number;
  start_line: number;
};

export async function runRuboCopLint({
  code,
  path,
}: {
  code: string;
  path: string;
}): Promise<Array<RuboCopOffense>> {
  const result = await runCommandWithOrWithoutBundler(
    "rubocop",
    [
      "--force-exclusion",
      "--format",
      "json",
      "--stdin",
      modifyUntitledPath(path),
    ],
    code
  );
  if (result.code && result.stderr) {
    throw new Error(result.stderr);
  }
  return toOffenses(result.stdout);
}

export async function runRuboCopAutocorrect({
  code,
  path,
  copName,
}: {
  code: string;
  copName?: string;
  path: string;
}): Promise<string> {
  const args = ["--force-exclusion", "--auto-correct-all", "--stdin", path];
  if (copName) {
    args.push("--only", copName);
  }
  const result = await runCommandWithOrWithoutBundler("rubocop", args, code);
  if (result.code && result.stderr) {
    throw new Error(result.stderr);
  }
  return toCorrectedCode(result.stdout);
}

function toCorrectedCode(ruboCopOutput: string): string {
  const separator = "====================";
  const index = ruboCopOutput.search(new RegExp(`^${separator}$`, "m"));
  return ruboCopOutput.substring(index + separator.length).trimStart();
}

function toOffenses(ruboCopOutput: string): Array<RuboCopOffense> {
  return JSON.parse(ruboCopOutput).files[0]?.offenses || [];
}

function hasRuboCopYml(directory: string): boolean {
  return existsSync(path.join(directory, ".rubocop.yml"));
}

// To avoid Naming/FileName cop.
function modifyUntitledPath(path: string): string {
  return path.replace(/^Untitled-(\d+)$/, "untitled_$1");
}
