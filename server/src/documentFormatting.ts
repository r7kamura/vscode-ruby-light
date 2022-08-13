import {
  DocumentFormattingParams,
  TextDocuments,
  TextEdit,
} from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { URI } from "vscode-uri";
import { runRuboCopAutocorrect } from "./rubocop";
import { fromDiff } from "./textEdit";

export async function documentFormattingRequestHandler(
  params: DocumentFormattingParams,
  documents: TextDocuments<TextDocument>
): Promise<TextEdit[] | undefined> {
  const textDocument = documents.get(params.textDocument.uri);
  if (!textDocument) {
    return;
  }

  return fromDiff({
    textDocument,
    textAfter: await runRuboCopAutocorrect({
      code: textDocument.getText(),
      path: URI.parse(textDocument.uri).fsPath,
    }),
  });
}
