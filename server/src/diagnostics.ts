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
} from "./rubocop";

export async function diagnosticsRequestHandler(
  event: TextDocumentChangeEvent<TextDocument>,
  documents: TextDocuments<TextDocument>,
  connection: Connection
): Promise<void> {
  const uri = event.document.uri;
  const textDocument = documents.get(uri);
  if (!textDocument) {
    return;
  }

  const path = URI.parse(uri).fsPath;
  const offenses = await runRuboCopLint({
    code: textDocument.getText(),
    path,
  });
  connection.sendDiagnostics({
    uri,
    diagnostics: offenses.map((offense) => toVscodeDiagnostic(offense, uri)),
  });
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
