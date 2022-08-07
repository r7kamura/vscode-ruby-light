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

const connection = createConnection(ProposedFeatures.all);

const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

connection.onInitialize(async (_params: InitializeParams) => {
  await initializeParser();

  return {
    capabilities: {
      documentHighlightProvider: true,
      selectionRangeProvider: true,
      textDocumentSync: TextDocumentSyncKind.Incremental,
    },
  };
});

connection.onInitialized(() => {
  connection.onDocumentHighlight(({ position, textDocument }) => {
    const document = documents.get(textDocument.uri);
    if (!document) {
      return [];
    }

    return documentHighlightProvider(
      parse(document.getText()),
      Position.fromVscodePosition(position)
    );
  });

  connection.onSelectionRanges(({ positions, textDocument }) => {
    const document = documents.get(textDocument.uri);
    if (!document) {
      return [];
    }

    return selectionRangesProvider(
      parse(document.getText()),
      positions.map(Position.fromVscodePosition)
    );
  });
});

documents.listen(connection);

connection.listen();
