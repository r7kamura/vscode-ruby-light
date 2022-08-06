import {
  createConnection,
  InitializeParams,
  ProposedFeatures,
  TextDocuments,
  TextDocumentSyncKind,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import * as Parser from "web-tree-sitter";
import * as path from "path";
import documentHighlightProvider from "./documentHighlightProvider";

const connection = createConnection(ProposedFeatures.all);

const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

const TREE_SITTER_RUBY_WASM_PATH = path.resolve(
  __dirname,
  "tree-sitter-ruby.wasm"
);

let treeSitterParser: Parser;

connection.onInitialize(async (_params: InitializeParams) => {
  await initializeParser();

  return {
    capabilities: {
      documentHighlightProvider: true,
      textDocumentSync: TextDocumentSyncKind.Incremental,
    },
  };
});

connection.onInitialized(() => {
  connection.onDocumentHighlight((params) => {
    return documentHighlightProvider(treeSitterParser, documents, params);
  });
});

documents.listen(connection);

connection.listen();

async function initializeParser() {
  await Parser.init();
  treeSitterParser = new Parser();
  const treeSitterLanguage = await Parser.Language.load(
    TREE_SITTER_RUBY_WASM_PATH
  );
  treeSitterParser.setLanguage(treeSitterLanguage);
}
