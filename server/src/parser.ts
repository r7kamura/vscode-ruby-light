import * as path from "path";
import * as Parser from "web-tree-sitter";

export function parse(code: string): Parser.SyntaxNode {
  try {
    return treeSitterParser.parse(code).rootNode;
  } catch (e) {
    return treeSitterParser.parse("").rootNode;
  }
}

export async function initializeParser() {
  await Parser.init();
  treeSitterParser = new Parser();
  const treeSitterLanguage = await Parser.Language.load(
    TREE_SITTER_RUBY_WASM_PATH
  );
  treeSitterParser.setLanguage(treeSitterLanguage);
}

const TREE_SITTER_RUBY_WASM_PATH = path.resolve(
  __dirname,
  "tree-sitter-ruby.wasm"
);

let treeSitterParser: Parser;
