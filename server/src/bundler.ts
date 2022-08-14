import { existsSync } from "fs";
import { readlink } from "fs/promises";
import path = require("path");

export async function inBundlerDirectory(): Promise<boolean> {
  const directories = await currentOrAncestorDirectories();
  return directories.some(hasGemfileOrGemsRb);
}

async function currentOrAncestorDirectories(): Promise<Array<string>> {
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

function hasGemfileOrGemsRb(directory: string): boolean {
  return hasGemfile(directory) || hasGemsRb(directory);
}

function hasGemfile(directory: string): boolean {
  return existsSync(path.join(directory, "Gemfile"));
}

function hasGemsRb(directory: string): boolean {
  return existsSync(path.join(directory, "gems.rb"));
}
