import { Range } from "vscode-languageserver";
import Parser = require("web-tree-sitter");
import Position from "./Position";

export function ancestors(node: Parser.SyntaxNode): Parser.SyntaxNode[] {
  const ancestors: Parser.SyntaxNode[] = [];
  let current = node.parent;
  while (current) {
    ancestors.push(current);
    current = current.parent;
  }
  return ancestors;
}

export function selfAndAncestors(node: Parser.SyntaxNode): Parser.SyntaxNode[] {
  return [node, ...ancestors(node)];
}

export function currentNode(
  rootNode: Parser.SyntaxNode,
  position: Position
): Parser.SyntaxNode {
  return rootNode.descendantForPosition(position.toTreeSitterPosition());
}

export function toRange(
  startNode: Parser.SyntaxNode,
  endNode = startNode
): Range {
  return Range.create(
    Position.fromTreeSitterPosition(startNode.startPosition).toVscodePosition(),
    Position.fromTreeSitterPosition(endNode.endPosition).toVscodePosition()
  );
}
