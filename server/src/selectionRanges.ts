import {
  Range,
  SelectionRange,
  SelectionRangeParams,
  TextDocuments,
} from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { ArrayNode, CallNode, Node, StringNode } from "./nodes.js";
import { parse } from "./parser.js";
import { Settings } from "./settings.js";
import Location from "./Location.js";

export function selectionRangesRequestHandler(
  settings: Settings,
  params: SelectionRangeParams,
  documents: TextDocuments<TextDocument>
): SelectionRange[] | undefined {
  if (!settings.selectionRanges.enabled) {
    return;
  }

  const textDocument = documents.get(params.textDocument.uri);
  if (!textDocument) {
    return;
  }

  const source = textDocument.getText();
  return params.positions.map((position) => {
    return toSelectionRange(
      parse(source).descendantForLocation(
        Location.fromPosition(source, position)
      )
    );
  });
}

function toRanges(node: Node): Range[] {
  switch (node.type) {
    case "ArrayNode":
      return toArrayNodeRanges(node as ArrayNode);
    case "CallNode":
      return toCallNodeRanges(node as CallNode);
    case "StringNode":
      return toStringNodeRanges(node as StringNode);
    default:
      return [node.range()];
  }
}

// [a, b, c]
//  ^^^^^^^
// ^^^^^^^^^
function toArrayNodeRanges(node: ArrayNode): Range[] {
  return [node.elementsRange(), node.range()].filter(
    (range) => range
  ) as Range[];
}

// foo(a, b, c)
//     ^^^^^^^
//    ^^^^^^^^^
// ^^^^^^^^^^^^
function toCallNodeRanges(node: CallNode): Range[] {
  return [
    node.argumentsRange(),
    node.openingToClosingRange(),
    node.range(),
  ].filter((range) => range) as Range[];
}

// "a b c"
//  ^^^^^
// ^^^^^^^
function toStringNodeRanges(node: StringNode): Range[] {
  return [node.contentRange(), node.openingToClosingRange()].filter(
    (range) => range
  ) as Range[];
}

function toSelectionRange(node: Node): SelectionRange {
  const ranges = [node, ...node.ancestors()]
    .map((node) => node)
    .flatMap(toRanges);
  const rangesIncludingCurrentNode: Range[] = [];
  ranges.forEach((range) => {
    if (
      rangesIncludingCurrentNode.length === 0 ||
      isRangeContained(
        range,
        rangesIncludingCurrentNode[rangesIncludingCurrentNode.length - 1]
      )
    ) {
      rangesIncludingCurrentNode.push(range);
    }
  });

  let result: SelectionRange;
  rangesIncludingCurrentNode.reverse().forEach((range) => {
    result = { range, parent: result };
  });
  return result!;
}

function isRangeContained(outer: Range, inner: Range): boolean {
  return (
    (outer.start.line < inner.start.line ||
      (outer.start.line === inner.start.line &&
        outer.start.character <= inner.start.character)) &&
    (outer.end.line > inner.end.line ||
      (outer.end.line === inner.end.line &&
        outer.end.character >= inner.end.character))
  );
}
