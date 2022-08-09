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
import {
  provideSemanticTokens,
  semanticTokenModifiers,
  semanticTokenTypes,
} from "./semanticTokensProvider";

const connection = createConnection(ProposedFeatures.all);

const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

connection.onInitialize(async (_params: InitializeParams) => {
  await initializeParser();

  return {
    capabilities: {
      documentHighlightProvider: true,
      documentSymbolProvider: true,
      selectionRangeProvider: true,
      semanticTokensProvider: {
        legend: {
          tokenTypes: semanticTokenTypes,
          tokenModifiers: semanticTokenModifiers,
        },
        range: false,
        full: true,
      },
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

  connection.onDocumentSymbol(({ textDocument }) => {
    const document = documents.get(textDocument.uri);
    if (!document) {
      return [];
    }

    return documentSymbolProvider(parse(document.getText()));
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

  connection.languages.semanticTokens.on(({ textDocument }) => {
    const document = documents.get(textDocument.uri);
    return provideSemanticTokens(parse(document!.getText()));
  });
});

documents.listen(connection);

connection.listen();
