import { Range, SelectionRange } from "vscode-languageserver";
import Parser = require("web-tree-sitter");
import Position from "./Position";

export default function selectionRangesProvider(
  rootNode: Parser.SyntaxNode,
  positions: Position[]
): SelectionRange[] {
  return positions.map((position) => {
    return toSelectionRange(currentNode(rootNode, position));
  });
}

function currentNode(
  rootNode: Parser.SyntaxNode,
  position: Position
): Parser.SyntaxNode {
  return rootNode.descendantForPosition(position.toTreeSitterPosition());
}

function ancestors(node: Parser.SyntaxNode): Parser.SyntaxNode[] {
  const ancestors: Parser.SyntaxNode[] = [];
  let current = node.parent;
  while (current) {
    ancestors.push(current);
    current = current.parent;
  }
  return ancestors;
}

function selfAndAnsestors(node: Parser.SyntaxNode): Parser.SyntaxNode[] {
  return [node, ...ancestors(node)];
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
      return [toOuterRange(node)];
  }
}

// To ignore do nodes of do-less `while` and do-less `until`.
function toDoRanges(node: Parser.SyntaxNode): Range[] {
  if (isDoLessDo(node)) {
    return [];
  } else {
    return [toOuterRange(node)];
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
    return [toOuterRange(node)];
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
    toOuterRange(node),
  ];
}

// %q(a b c)
//    ^^^^^
// ^^^^^^^^^
function toInnerAndOuterRanges(node: Parser.SyntaxNode): Range[] {
  return [toInnerRange(node), toOuterRange(node)];
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

function toOuterRange(node: Parser.SyntaxNode): Range {
  return Range.create(
    Position.fromTreeSitterPosition(node.startPosition).toVscodePosition(),
    Position.fromTreeSitterPosition(node.endPosition).toVscodePosition()
  );
}

function toSelectionRange(node: Parser.SyntaxNode): SelectionRange {
  let result: SelectionRange;
  selfAndAnsestors(node)
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
