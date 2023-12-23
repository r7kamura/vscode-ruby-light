import { existsSync } from "fs";
import * as path from "path";
import { currentOrAncestorDirectories } from "./directory.js";

export async function inBundlerDirectory(): Promise<boolean> {
  const directories = await currentOrAncestorDirectories();
  return directories.some(hasGemfileOrGemsRb);
}

function hasGemfileOrGemsRb(directory: string): boolean {
  return hasGemfile(directory) || hasGemsRb(directory);
}

function hasGemfile(directory: string): boolean {
  return existsSync(path.join(directory, "Gemfile"));
}

function hasGemsRb(directory: string): boolean {
  return existsSync(path.join(directory, "gems.rb"));
}
