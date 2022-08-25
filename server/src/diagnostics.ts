import {
  Connection,
  Diagnostic,
  DiagnosticSeverity,
  DocumentUri,
  TextDocumentChangeEvent,
  TextDocuments,
} from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { URI } from "vscode-uri";
import {
  runRuboCopLint,
  RuboCopLocation,
  RuboCopOffense,
  RuboCopSeverity,
  inRuboCopDirectory,
} from "./rubocop";
import { Settings } from "./settings";

export async function diagnosticsRequestHandler(
  settings: Settings,
  event: TextDocumentChangeEvent<TextDocument>,
  documents: TextDocuments<TextDocument>,
  connection: Connection
): Promise<void> {
  const uri = event.document.uri;
  const diagnostics = await investigateDiagnostics(
    settings,
    uri,
    documents,
    connection
  );
  connection.sendDiagnostics({
    uri,
    diagnostics,
  });
}

export async function refreshAllDocumentsDiagnostics(
  settings: Settings,
  documents: TextDocuments<TextDocument>,
  connection: Connection
): Promise<void[]> {
  return Promise.all(
    documents.all().map((textDocument) => {
      return diagnosticsRequestHandler(
        settings,
        {
          document: textDocument,
        },
        documents,
        connection
      );
    })
  );
}

async function investigateDiagnostics(
  settings: Settings,
  uri: DocumentUri,
  documents: TextDocuments<TextDocument>,
  connection: Connection
): Promise<Diagnostic[]> {
  if (!settings.diagnostics.enabled) {
    return [];
  }

  if (!(await inRuboCopDirectory())) {
    return [];
  }

  const textDocument = documents.get(uri);
  if (!textDocument) {
    return [];
  }

  const path = URI.parse(uri).fsPath;
  let offenses;
  try {
    offenses = await runRuboCopLint({
      code: textDocument.getText(),
      path,
    });
  } catch (error) {
    connection.console.error((error as Error).message);
    return [];
  }

  return offenses.map((offense) => toVscodeDiagnostic(offense, uri));
}

const DIAGNOSTIC_SEVERITIES = new Map<RuboCopSeverity, DiagnosticSeverity>([
  ["convention", DiagnosticSeverity.Information],
  ["error", DiagnosticSeverity.Error],
  ["fatal", DiagnosticSeverity.Error],
  ["info", DiagnosticSeverity.Information],
  ["refactor", DiagnosticSeverity.Hint],
  ["warning", DiagnosticSeverity.Warning],
]);

function toVscodeDiagnostic(
  ruboCopOffense: RuboCopOffense,
  uri: DocumentUri
): Diagnostic {
  const range = toVscodeRange(ruboCopOffense.location);
  return {
    code: ruboCopOffense.cop_name,
    data: {
      copName: ruboCopOffense.cop_name,
      correctable: ruboCopOffense.correctable,
      range,
      uri,
    },
    message: ruboCopOffense.message,
    range,
    severity: toVscodeSeverity(ruboCopOffense.severity),
    source: "RuboCop",
  };
}

function toVscodeRange(ruboCopLocation: RuboCopLocation) {
  return {
    start: {
      line: ruboCopLocation.start_line - 1,
      character: ruboCopLocation.start_column - 1,
    },
    end: {
      line: ruboCopLocation.last_line - 1,
      character: ruboCopLocation.last_column,
    },
  };
}

function toVscodeSeverity(
  rubocopSeverity: RuboCopSeverity
): DiagnosticSeverity {
  return DIAGNOSTIC_SEVERITIES.get(rubocopSeverity) || DiagnosticSeverity.Error;
}
