import {
  DocumentHighlight,
  DocumentHighlightKind,
  Range,
} from "vscode-languageserver";
import Parser = require("web-tree-sitter");
import Position from "./Position";

export default function documentHighlightProvider(
  rootNode: Parser.SyntaxNode,
  position: Position
): DocumentHighlight[] {
  return highlights(currentNode(rootNode, position));
}

function currentNode(
  rootNode: Parser.SyntaxNode,
  position: Position
): Parser.SyntaxNode {
  return rootNode.descendantForPosition(position.toTreeSitterPosition());
}

function highlights(node: Parser.SyntaxNode): DocumentHighlight[] {
  if (node.isNamed()) {
    return [];
  }

  switch (node.type) {
    case "end":
      return highlightsForEndNode(node);
    case "else":
    case "elsif":
    case "ensure":
    case "in":
    case "rescue":
    case "then":
    case "when":
      return highlightsForConditionalBodyNode(node);
    case "case":
    case "for":
    case "if":
    case "unless":
    case "until":
    case "while":
      return highlightsForConditionalNode(node);
    case "class":
    case "module":
      return highlightsForPairNode(node);
    case "begin":
    case "def":
      return highlightsForRescuableNode(node);
    case "do":
      return highlightsForDoNode(node);
    default:
      return [];
  }
}

function highlightsForEndNode(
  endKeywordNode: Parser.SyntaxNode
): DocumentHighlight[] {
  if (
    endKeywordNode.parent?.type === "do" &&
    endKeywordNode.parent?.firstChild?.type !== "do"
  ) {
    // `end` for do-less `while`, `until`, or `for`.
    return highlights(endKeywordNode.parent!.parent!.firstChild!);
  } else {
    return highlights(endKeywordNode.parent!.firstChild!);
  }
}

function highlightsForDoNode(
  doKeywordNode: Parser.SyntaxNode
): DocumentHighlight[] {
  switch (doKeywordNode.parent?.parent?.type) {
    case "until":
    case "while":
      return highlights(doKeywordNode.parent!.parent!.firstChild!);
    default:
      return highlightsForPairNode(doKeywordNode);
  }
}

function highlightsForPairNode(
  keywordNode: Parser.SyntaxNode
): DocumentHighlight[] {
  const endNode = keywordNode.parent?.lastChild;
  if (!endNode) {
    return [];
  }

  return [toHighlight(keywordNode), toHighlight(endNode)];
}

function highlightsForConditionalBodyNode(
  bodyKeywordNode: Parser.SyntaxNode
): DocumentHighlight[] {
  return highlights(bodyKeywordNode.parent!.parent!.firstChild!);
}

function highlightsForConditionalNode(
  keywordNode: Parser.SyntaxNode
): DocumentHighlight[] {
  const keywordNodes: Parser.SyntaxNode[] = [];
  keywordNode.parent?.children.forEach((child) => {
    switch (child.type) {
      case "for":
      case "case":
      case "end":
      case "if":
      case "unless":
      case "until":
      case "while":
        keywordNodes.push(child);
        break;
      case "else":
      case "in":
      case "when":
        keywordNodes.push(child.firstChild!);
        break;
      case "elsif": {
        keywordNodes.push(...keywordNodesForElsifNode(child));
        break;
      }
      case "do":
        if (child.firstChild?.type == "do") {
          keywordNodes.push(child.firstChild!);
        }
        keywordNodes.push(child.lastChild!);
        break;
    }

    switch (child.type) {
      case "if":
      case "unless":
        if (
          child.parent?.children[2]?.type === "then" &&
          child.parent?.children[2]?.firstChild?.type === "then"
        ) {
          keywordNodes.push(child.parent.children[2].firstChild!);
        }
        break;
      case "elsif":
      case "when":
        if (
          child.children[2]?.type === "then" &&
          child.children[2]?.firstChild?.type === "then"
        ) {
          keywordNodes.push(child.children[2].firstChild!);
        }
        break;
    }
  });
  return keywordNodes.map(toHighlight);
}

function keywordNodesForElsifNode(
  elsifNode: Parser.SyntaxNode
): Parser.SyntaxNode[] {
  const keywordNodes: Parser.SyntaxNode[] = [];
  keywordNodes.push(elsifNode.firstChild!);
  if (elsifNode.lastChild?.type == "elsif") {
    keywordNodes.push(...keywordNodesForElsifNode(elsifNode.lastChild!));
  } else if (elsifNode.lastChild?.type == "else") {
    keywordNodes.push(elsifNode.lastChild!.firstChild!);
  }
  if (
    elsifNode.children[2]?.type == "then" &&
    elsifNode.children[2]?.firstChild?.type == "then"
  ) {
    keywordNodes.push(elsifNode.children[2].firstChild!);
  }
  return keywordNodes;
}

function highlightsForRescuableNode(
  keywordNode: Parser.SyntaxNode
): DocumentHighlight[] {
  const keywordNodes: Parser.SyntaxNode[] = [];
  keywordNode.parent?.children.forEach((child) => {
    switch (child.type) {
      case "def":
      case "end":
        keywordNodes.push(child);
        break;
      case "else":
      case "ensure":
      case "rescue":
        keywordNodes.push(child.firstChild!);
        break;
    }

    if (
      child.type === "rescue" &&
      child.children[3]?.type === "then" &&
      child.children[3]?.firstChild?.type === "then"
    ) {
      keywordNodes.push(child.children[3].firstChild!);
    }
  });
  return keywordNodes.map(toHighlight);
}

function toHighlight(node: Parser.SyntaxNode): DocumentHighlight {
  return DocumentHighlight.create(toRange(node), DocumentHighlightKind.Text);
}

function toRange(node: Parser.SyntaxNode): Range {
  return Range.create(
    Position.fromTreeSitterPosition(node.startPosition).toVscodePosition(),
    Position.fromTreeSitterPosition(node.endPosition).toVscodePosition()
  );
}
