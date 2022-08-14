import { runCommandWithOrWithoutBundler } from "./spawn";

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
    ["--force-exclusion", "--format", "json", "--stdin", path],
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
  const args = ["--force-exclusion", "--autocorrect-all", "--stdin"];
  if (path) {
    args.push(path);
  }
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
  return JSON.parse(ruboCopOutput).files[0].offenses;
}
