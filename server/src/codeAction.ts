import {
  CodeAction,
  CodeActionKind,
  CodeActionParams,
  Command,
  Diagnostic,
  TextDocuments,
} from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { commandIdentifierForAutocorrect } from "./executeCommand";
import { Settings } from "./settings";

export function codeActionRequestHandler(
  _settings: Settings,
  params: CodeActionParams,
  documents: TextDocuments<TextDocument>
): CodeAction[] | undefined {
  const textDocument = documents.get(params.textDocument.uri);
  if (!textDocument) {
    return;
  }

  return params.context.diagnostics.filter(toCorrectable).map(toCodeAction);
}

function toCodeAction(diagnostic: Diagnostic): CodeAction {
  return {
    command: Command.create(
      toCodeActionTitle(diagnostic),
      commandIdentifierForAutocorrect,
      diagnostic.data
    ),
    diagnostics: [diagnostic],
    isPreferred: true,
    kind: CodeActionKind.QuickFix,
    title: toCodeActionTitle(diagnostic),
  };
}

function toCodeActionTitle(diagnostic: Diagnostic): string {
  return `Autocorrect ${toCopName(diagnostic)}`;
}

function toCopName(diagnostic: Diagnostic): string {
  return diagnostic.code as string;
}

function toCorrectable(diagnostic: Diagnostic): boolean {
  return diagnostic.data == null ? false : (diagnostic.data as any).correctable;
}
