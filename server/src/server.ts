import {
  createConnection,
  InitializeParams,
  ProposedFeatures,
  TextDocuments,
  TextDocumentSyncKind,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { initializeParser } from "./parser";
import { documentHighlightRequestHandler } from "./documentHighlight";
import { selectionRangesRequestHandler } from "./selectionRanges";
import { documentSymbolRequestHandler } from "./documentSymbol";
import { codeActionRequestHandler } from "./codeAction";
import { documentFormattingRequestHandler } from "./documentFormatting";
import { diagnosticsRequestHandler } from "./diagnostics";
import {
  commandIdentifiers,
  executeCommandRequestHandler,
} from "./executeCommand";

const connection = createConnection(ProposedFeatures.all);

const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

connection.onInitialize(async (_params: InitializeParams) => {
  await initializeParser();

  return {
    capabilities: {
      codeActionProvider: true,
      documentFormattingProvider: true,
      documentHighlightProvider: true,
      documentSymbolProvider: true,
      executeCommandProvider: {
        commands: commandIdentifiers,
      },
      selectionRangeProvider: true,
      textDocumentSync: TextDocumentSyncKind.Incremental,
    },
  };
});

connection.onInitialized(() => {
  connection.onDocumentFormatting((params) => {
    try {
      return documentFormattingRequestHandler(params, documents);
    } catch (e) {
      connection.console.error((e as Error).message);
    }
  });

  connection.onDocumentHighlight((params) => {
    return documentHighlightRequestHandler(params, documents);
  });

  connection.onDocumentSymbol((params) => {
    return documentSymbolRequestHandler(params, documents);
  });

  connection.onSelectionRanges((params) => {
    return selectionRangesRequestHandler(params, documents);
  });
});

connection.onCodeAction((params) => {
  return codeActionRequestHandler(params, documents);
});

connection.onExecuteCommand(async (params) => {
  try {
    return await executeCommandRequestHandler(params, documents, connection);
  } catch (e) {
    connection.console.error((e as Error).message);
  }
});

documents.onDidChangeContent(async (event) => {
  try {
    await diagnosticsRequestHandler(event, documents, connection);
  } catch (e) {
    connection.console.error((e as Error).message);
  }
});

documents.listen(connection);

connection.listen();
