import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { WASI } from "@bjorn3/browser_wasi_shim";
import { parsePrism } from "@ruby/prism/src/parsePrism.js";
import { ParseResult } from "@ruby/prism/src/deserialize.js";
import { ProgramNode } from "./nodes.js";

let parseByPrism: (source: string) => ParseResult;

export async function initializeParser(): Promise<void> {
  parseByPrism = await setupPrismParser();
}

export function parse(source: string): ProgramNode {
  return new ProgramNode(parseByPrism(source).value, undefined, source);
}

async function setupPrismParser(): Promise<(source: string) => ParseResult> {
  const instance = await createPrismWasmInstance();
  return function (source) {
    return parsePrism(instance.exports, source);
  };
}

function readPrismWasmBinary(): Buffer {
  return readFileSync(fileURLToPath(new URL("prism.wasm", import.meta.url)));
}

async function createPrismWasmInstance(): Promise<WebAssembly.Instance> {
  const wasmModule = await WebAssembly.compile(readPrismWasmBinary());
  const wasi = new WASI([], [], []);
  const instance = await WebAssembly.instantiate(wasmModule, {
    wasi_snapshot_preview1: wasi.wasiImport,
  });
  wasi.initialize(instance as any);
  return instance;
}
