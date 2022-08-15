import {
  Connection,
  DocumentRangeFormattingParams,
  TextDocuments,
  TextEdit,
} from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { URI } from "vscode-uri";
import { inRuboCopDirectory, runRuboCopAutocorrect } from "./rubocop";
import { Settings } from "./settings";
import { fromDiff } from "./textEdit";

export async function documentRangeFormattingRequestHandler(
  settings: Settings,
  params: DocumentRangeFormattingParams,
  documents: TextDocuments<TextDocument>,
  connection: Connection
): Promise<TextEdit[] | undefined> {
  if (!settings.documentFormatting.enabled) {
    return;
  }

  if (!(await inRuboCopDirectory())) {
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
    range: params.range,
    textDocument,
    textAfter,
  });
}
