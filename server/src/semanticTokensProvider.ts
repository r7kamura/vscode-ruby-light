import { SemanticTokens, SemanticTokensBuilder } from "vscode-languageserver";
import Parser = require("web-tree-sitter");

enum SemanticTokenModifiers {}

enum SemanticTokenTypes {
  MetaBrace = "metaBrace",
  MetaComma = "metaComma",
  MetaDot = "metaDot",
  HeredocBeginning = "heredocBeginning",
  HeredocContent = "heredocContent",
  HeredocEnding = "heredocEnding",
  Identifier = "identifier",
  Method = "method",
}

export const semanticTokenModifiers = Object.values(SemanticTokenModifiers);

export const semanticTokenTypes = Object.values(SemanticTokenTypes);

export function provideSemanticTokens(
  rootNode: Parser.SyntaxNode
): SemanticTokens {
  const semanticTokens = new Walker().walk(rootNode);
  const builder = new SemanticTokensBuilder();
  semanticTokens.forEach((semanticToken) => {
    builder.push(
      semanticToken.line,
      semanticToken.column,
      semanticToken.length,
      semanticToken.encodedType,
      semanticToken.modifiers
    );
  });
  return builder.build();
}

class SemanticToken {
  private node: Parser.SyntaxNode;

  public type: SemanticTokenTypes;

  static encodingMap = new Map<string, number>(
    Object.values(SemanticTokenTypes).map((type, index) => [type, index])
  );

  constructor(type: SemanticTokenTypes, node: Parser.SyntaxNode) {
    this.node = node;
    this.type = type;
  }

  get line(): number {
    return this.node.startPosition.row;
  }

  get column(): number {
    return this.node.startPosition.column;
  }

  get length(): number {
    return this.node.endIndex - this.node.startIndex;
  }

  get encodedType(): number {
    const index = SemanticToken.encodingMap.get(this.type);
    return index === undefined ? -1 : index;
  }

  get modifiers(): number {
    return 0;
  }
}

class Walker {
  private tokens: SemanticToken[];

  constructor() {
    this.tokens = [];
  }

  walk(node: Parser.SyntaxNode): SemanticToken[] {
    this.step(node);
    return this.tokens;
  }

  private step(node: Parser.SyntaxNode) {
    switch (node.type) {
      case ",":
        this.pushToken(SemanticTokenTypes.MetaComma, node);
        break;
      case ".":
        this.pushToken(SemanticTokenTypes.MetaDot, node);
        break;
      case "(":
      case ")":
        this.pushToken(SemanticTokenTypes.MetaBrace, node);
        break;
      case "heredoc_beginning":
        this.pushToken(SemanticTokenTypes.HeredocBeginning, node);
        break;
      case "heredoc_content":
        // Defined but not used because token does not seem to be able to contain line-break.
        this.pushToken(SemanticTokenTypes.HeredocContent, node);
        break;
      case "heredoc_end":
        this.pushToken(SemanticTokenTypes.HeredocEnding, node);
        break;
      case "identifier":
        this.stepIdentifier(node);
        break;
      default:
        node.children.forEach((child) => {
          this.step(child);
        });
        break;
    }
  }

  private stepIdentifier(node: Parser.SyntaxNode) {
    if (
      node.parent?.type === "call" &&
      (node.parent?.childCount === 2 || node.parent?.firstChild?.id !== node.id)
    ) {
      this.pushToken(SemanticTokenTypes.Method, node);
    } else {
      this.pushToken(SemanticTokenTypes.Identifier, node);
    }
  }

  private pushToken(type: SemanticTokenTypes, node: Parser.SyntaxNode) {
    this.tokens.push(new SemanticToken(type, node));
  }
}
