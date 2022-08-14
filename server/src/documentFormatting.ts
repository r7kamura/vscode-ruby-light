import {
  Connection,
  DocumentFormattingParams,
  TextDocuments,
  TextEdit,
} from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { URI } from "vscode-uri";
import { runRuboCopAutocorrect } from "./rubocop";
import { Settings } from "./settings";
import { fromDiff } from "./textEdit";

export async function documentFormattingRequestHandler(
  settings: Settings,
  params: DocumentFormattingParams,
  documents: TextDocuments<TextDocument>,
  connection: Connection
): Promise<TextEdit[] | undefined> {
  if (!settings.documentFormatting.enabled) {
    return;
  }

  const textDocument = documents.get(params.textDocument.uri);
  if (!textDocument) {
    return;
  }

  let textAfter;
  try {
    textAfter = await runRuboCopAutocorrect({
      code: textDocument.getText(),
      path: URI.parse(textDocument.uri).fsPath,
    });
  } catch (error) {
    connection.console.error((error as Error).message);
    return;
  }

  return fromDiff({
    textDocument,
    textAfter,
  });
}
