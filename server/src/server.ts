import {
  createConnection,
  DidChangeConfigurationNotification,
  InitializeParams,
  ProposedFeatures,
  TextDocuments,
  TextDocumentSyncKind,
} from "vscode-languageserver/node.js";
import { TextDocument } from "vscode-languageserver-textdocument";
import { initializeParser } from "./parser.js";
import { documentHighlightRequestHandler } from "./documentHighlight.js";
import { selectionRangesRequestHandler } from "./selectionRanges.js";
import { documentSymbolRequestHandler } from "./documentSymbol.js";
import { codeActionRequestHandler } from "./codeAction.js";
import { documentFormattingRequestHandler } from "./documentFormatting.js";
import {
  commandIdentifiers,
  executeCommandRequestHandler,
} from "./executeCommand.js";
import { defaultSettings, getSettings, Settings } from "./settings.js";
import {
  diagnosticsRequestHandler,
  refreshAllDocumentsDiagnostics,
} from "./diagnostics.js";
import { documentRangeFormattingRequestHandler } from "./documentRangeFormatting.js";

const connection = createConnection(ProposedFeatures.all);

const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let settings: Settings = defaultSettings;

connection.onInitialize(async (_params: InitializeParams) => {
  await initializeParser();

  return {
    capabilities: {
      codeActionProvider: true,
      documentFormattingProvider: true,
      documentHighlightProvider: true,
      documentSymbolProvider: true,
      documentRangeFormattingProvider: true,
      executeCommandProvider: {
        commands: commandIdentifiers,
      },
      selectionRangeProvider: true,
      textDocumentSync: TextDocumentSyncKind.Incremental,
    },
  };
});

connection.onInitialized(async () => {
  settings = await getSettings(connection);

  connection.client.register(DidChangeConfigurationNotification.type);

  connection.onDocumentFormatting((params) => {
    return documentFormattingRequestHandler(
      settings,
      params,
      documents,
      connection
    );
  });

  connection.onDocumentHighlight((params) => {
    return documentHighlightRequestHandler(settings, params, documents);
  });

  connection.onDocumentRangeFormatting((params) => {
    return documentRangeFormattingRequestHandler(
      settings,
      params,
      documents,
      connection
    );
  });

  connection.onDocumentSymbol((params) => {
    return documentSymbolRequestHandler(settings, params, documents);
  });

  connection.onSelectionRanges((params) => {
    return selectionRangesRequestHandler(settings, params, documents);
  });

  documents.onDidChangeContent(async (event) => {
    await diagnosticsRequestHandler(settings, event, documents, connection);
  });

  await refreshAllDocumentsDiagnostics(settings, documents, connection);
});

connection.onCodeAction((params) => {
  return codeActionRequestHandler(settings, params, documents);
});

connection.onExecuteCommand(async (params) => {
  return await executeCommandRequestHandler(
    settings,
    params,
    documents,
    connection
  );
});

connection.onDidChangeConfiguration(async (_params) => {
  settings = await getSettings(connection);
  await refreshAllDocumentsDiagnostics(settings, documents, connection);
});

documents.listen(connection);

connection.listen();
