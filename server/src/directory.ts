import { readlink } from "fs/promises";
import * as path from "path";

export async function currentOrAncestorDirectories(): Promise<Array<string>> {
  const directories = [];
  let directory: string | null = currentDirectory();
  while (directory) {
    directories.push(directory);
    try {
      directory = await parentDirectory(directory);
    } catch (error) {
      directory = null;
    }
  }
  return directories;
}

function currentDirectory(): string {
  return process.cwd();
}

async function parentDirectory(directory: string): Promise<string> {
  const parent = await readlink(path.join(directory, ".."));
  return path.join(directory, parent);
}
