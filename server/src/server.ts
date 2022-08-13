import {
  createConnection,
  InitializeParams,
  ProposedFeatures,
  TextDocuments,
  TextDocumentSyncKind,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { initializeParser, parse } from "./parser";
import documentHighlightProvider from "./documentHighlightProvider";
import selectionRangesProvider from "./selectionRangesProvider";
import Position from "./Position";
import { documentSymbolProvider } from "./documentSymbolProvider";

const connection = createConnection(ProposedFeatures.all);

const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

connection.onInitialize(async (_params: InitializeParams) => {
  await initializeParser();

  return {
    capabilities: {
      documentHighlightProvider: true,
      documentSymbolProvider: true,
      selectionRangeProvider: true,
      textDocumentSync: TextDocumentSyncKind.Incremental,
    },
  };
});

connection.onInitialized(() => {
  connection.onDocumentHighlight((params) => {
    const textDocument = documents.get(params.textDocument.uri);
    if (!textDocument) {
      return [];
    }

    return documentHighlightProvider(
      parse(textDocument.getText()),
      Position.fromVscodePosition(params.position)
    );
  });

  connection.onDocumentSymbol((params) => {
    const textDocument = documents.get(params.textDocument.uri);
    if (!textDocument) {
      return [];
    }

    return documentSymbolProvider(parse(textDocument.getText()));
  });

  connection.onSelectionRanges((params) => {
    const textDocument = documents.get(params.textDocument.uri);
    if (!textDocument) {
      return [];
    }

    return selectionRangesProvider(
      parse(textDocument.getText()),
      params.positions.map(Position.fromVscodePosition)
    );
  });
});

documents.listen(connection);

connection.listen();
