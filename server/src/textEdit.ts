import {
  DIFF_DELETE,
  DIFF_EQUAL,
  DIFF_INSERT,
  diff_match_patch,
} from "diff-match-patch";
import { Position, Range, TextEdit } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";

export function fromDiff({
  textDocument,
  textAfter,
  range,
}: {
  textDocument: TextDocument;
  textAfter: string;
  range?: Range;
}): TextEdit[] {
  const textBefore = textDocument.getText();

  const differ = new diff_match_patch();
  const diffs = differ.diff_main(textBefore, textAfter);
  const textEdits: TextEdit[] = [];
  let currentIndex = 0;
  diffs.forEach((diff) => {
    const [kind, string] = diff;
    const position = textDocument.positionAt(currentIndex);
    switch (kind) {
      case DIFF_EQUAL:
        currentIndex += string.length;
        break;
      case DIFF_INSERT:
        if (inRange(position, range)) {
          textEdits.push({
            newText: string,
            range: {
              start: position,
              end: position,
            },
          });
        }
        break;
      case DIFF_DELETE:
        if (inRange(position, range)) {
          textEdits.push({
            newText: "",
            range: {
              start: position,
              end: textDocument.positionAt(currentIndex + string.length),
            },
          });
        }
        currentIndex += string.length;
        break;
    }
  });

  return textEdits;
}

function inRange(position: Position, range?: Range): boolean {
  if (!range) {
    return true;
  }

  if (position.line < range.start.line) {
    return false;
  }
  if (position.line > range.end.line) {
    return false;
  }
  if (
    position.line === range.start.line &&
    position.character < range.start.character
  ) {
    return false;
  }
  if (
    position.line === range.end.line &&
    position.character > range.end.character
  ) {
    return false;
  }
  return true;
}
