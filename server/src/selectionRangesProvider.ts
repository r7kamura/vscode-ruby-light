import { Range, SelectionRange } from "vscode-languageserver";
import Parser = require("web-tree-sitter");
import { currentNode, selfAndAncestors, toRange } from "./node";
import Position from "./Position";

export default function selectionRangesProvider(
  rootNode: Parser.SyntaxNode,
  positions: Position[]
): SelectionRange[] {
  return positions.map((position) => {
    return toSelectionRange(currentNode(rootNode, position));
  });
}

function toRanges(node: Parser.SyntaxNode): Range[] {
  switch (node.type) {
    case "string":
    case "string_array":
    case "symbol_array":
      return toInnerAndOuterRanges(node);
    case "element_reference":
      return toElementReferenceRanges(node);
    case "do":
      return toDoRanges(node);
    case "argument_list":
      return toArgumentListRanges(node);
    default:
      return [toRange(node)];
  }
}

// To ignore do nodes of do-less `while` and do-less `until`.
function toDoRanges(node: Parser.SyntaxNode): Range[] {
  if (isDoLessDo(node)) {
    return [];
  } else {
    return [toRange(node)];
  }
}

// a(b, c)
//   ^^^^
//  ^^^^^^
//
// a b, c
//   ^^^^
function toArgumentListRanges(node: Parser.SyntaxNode): Range[] {
  if (isParenthesesLessArgumentList(node)) {
    return [toRange(node)];
  } else {
    return toInnerAndOuterRanges(node);
  }
}

// Set[:a, :b, :c]
//     ^^^^^^^^^^
//    ^^^^^^^^^^^^
// ^^^^^^^^^^^^^^^
function toElementReferenceRanges(node: Parser.SyntaxNode): Range[] {
  return [
    Range.create(
      Position.fromTreeSitterPosition(
        node.children[1]!.endPosition
      ).toVscodePosition(),
      Position.fromTreeSitterPosition(
        node.lastChild!.startPosition
      ).toVscodePosition()
    ),
    Range.create(
      Position.fromTreeSitterPosition(
        node.children[1]!.startPosition
      ).toVscodePosition(),
      Position.fromTreeSitterPosition(
        node.lastChild!.endPosition
      ).toVscodePosition()
    ),
    toRange(node),
  ];
}

// %q(a b c)
//    ^^^^^
// ^^^^^^^^^
function toInnerAndOuterRanges(node: Parser.SyntaxNode): Range[] {
  return [toInnerRange(node), toRange(node)];
}

function toInnerRange(node: Parser.SyntaxNode): Range {
  return Range.create(
    Position.fromTreeSitterPosition(
      node.firstChild!.endPosition
    ).toVscodePosition(),
    Position.fromTreeSitterPosition(
      node.lastChild!.startPosition
    ).toVscodePosition()
  );
}

function toSelectionRange(node: Parser.SyntaxNode): SelectionRange {
  let result: SelectionRange;
  selfAndAncestors(node)
    .flatMap(toRanges)
    .reverse()
    .forEach((range) => {
      result = { range, parent: result };
    });
  return result!;
}

function isParenthesesLessArgumentList(node: Parser.SyntaxNode): boolean {
  return node.type === "argument_list" && node.firstChild?.type !== "(";
}

function isDoLessDo(node: Parser.SyntaxNode): boolean {
  return node.type === "do" && node.firstChild?.type !== "do";
}
