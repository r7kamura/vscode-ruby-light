import {
  Connection,
  ExecuteCommandParams,
  TextDocumentEdit,
  TextDocuments,
} from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { URI } from "vscode-uri";
import { runRuboCopAutocorrect } from "./rubocop";
import { Settings } from "./settings";
import { fromDiff } from "./textEdit";

export const commandIdentifierForAutocorrect = "RubyLight.Autocorrect";

export const commandIdentifiers = [commandIdentifierForAutocorrect];

export async function executeCommandRequestHandler(
  _settings: Settings,
  params: ExecuteCommandParams,
  documents: TextDocuments<TextDocument>,
  connection: Connection
): Promise<void> {
  switch (params.command) {
    case commandIdentifierForAutocorrect:
      try {
        await executeAutocorrect(params, documents, connection);
      } catch (error) {
        connection.console.error((error as Error).message);
      }
      break;
  }
}

export async function executeAutocorrect(
  params: ExecuteCommandParams,
  documents: TextDocuments<TextDocument>,
  connection: Connection
): Promise<void> {
  const { copName, range, uri } = params.arguments![0];
  const textDocument = documents.get(uri);
  if (!textDocument) {
    return;
  }

  const code = textDocument.getText();
  const path = URI.parse(uri).fsPath;
  const correctedCode = await runRuboCopAutocorrect({ code, copName, path });
  const textEdits = fromDiff({
    textDocument,
    textAfter: correctedCode,
    range,
  });

  connection.workspace.applyEdit({
    documentChanges: [
      TextDocumentEdit.create(
        { uri: textDocument.uri, version: textDocument.version },
        textEdits
      ),
    ],
  });
}
