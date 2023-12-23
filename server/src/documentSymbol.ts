import {
  DocumentSymbol,
  DocumentSymbolParams,
  SymbolKind,
  TextDocuments,
} from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import * as Parser from "web-tree-sitter";
import { selfAndAncestors, toRange } from "./node.js";
import { parse } from "./parser.js";
import { Settings } from "./settings.js";

export function documentSymbolRequestHandler(
  settings: Settings,
  params: DocumentSymbolParams,
  documents: TextDocuments<TextDocument>
): DocumentSymbol[] | undefined {
  if (!settings.documentSymbol.enabled) {
    return;
  }

  const textDocument = documents.get(params.textDocument.uri);
  if (!textDocument) {
    return;
  }

  return new Walker().walk(parse(textDocument.getText()));
}

class Walker {
  private documentSymbolStack: DocumentSymbol[];

  private singletonClassNameStack: string[];

  private FIELD_METHOD_NAMES = new Set([
    "attr_accessor",
    "attr_reader",
    "attr_writer",
  ]);

  constructor() {
    this.documentSymbolStack = [this.createDummyDocumentSymbol()];
    this.singletonClassNameStack = [];
  }

  walk(rootNode: Parser.SyntaxNode): DocumentSymbol[] {
    this.step(rootNode);
    return this.documentSymbolStack[0].children!;
  }

  private step(node: Parser.SyntaxNode) {
    const documentSymbols = this.createDocumentSymbols(node);
    const singletonClassName = extractSingletonClassName(node);
    this.pushDocumentSymbols(documentSymbols);
    if (singletonClassName) {
      this.pushSingletonClassName(singletonClassName);
    }
    node.children.forEach((child) => {
      this.step(child);
    });
    if (singletonClassName) {
      this.popSingletonClassName();
    }
    if (documentSymbols.length > 0) {
      this.popDocumentSymbol();
    }
  }

  private createDummyDocumentSymbol(): DocumentSymbol {
    return {
      name: "",
      kind: 1,
      children: [],
      range: {
        start: { line: 0, character: 0 },
        end: { line: 0, character: 0 },
      },
      selectionRange: {
        start: { line: 0, character: 0 },
        end: { line: 0, character: 0 },
      },
    };
  }

  private pushDocumentSymbols(documentSymbols: DocumentSymbol[]) {
    this.documentSymbolStack[
      this.documentSymbolStack.length - 1
    ].children!.push(...documentSymbols);
    if (documentSymbols.length > 0) {
      this.documentSymbolStack.push(documentSymbols[0]);
    }
  }

  private pushSingletonClassName(singletonClassName: string) {
    this.singletonClassNameStack.push(singletonClassName);
  }

  private popDocumentSymbol() {
    this.documentSymbolStack.pop();
  }

  private popSingletonClassName() {
    this.singletonClassNameStack.pop();
  }

  private createDocumentSymbols(node: Parser.SyntaxNode): DocumentSymbol[] {
    if (!node.isNamed()) {
      return [];
    }

    switch (node.type) {
      case "class":
        return this.createDocumentSymbolsForClass(node);
      case "call":
        return this.createDocumentSymbolsForCall(node);
      case "module":
        return this.createDocumentSymbolsForModule(node);
      case "assignment":
        return this.createDocumentSymbolsForAssignment(node);
      case "method":
        return this.createDocumentSymbolsForMethod(node);
      case "singleton_method":
        return this.createDocumentSymbolsForSingletonMethod(node);
      default:
        return [];
    }
  }

  private createDocumentSymbolsForAssignment(
    node: Parser.SyntaxNode
  ): DocumentSymbol[] {
    if (node.firstChild?.type !== "constant") {
      return [];
    }
    return [
      {
        name: fullQualifiedConstantName(node.firstChild!),
        kind: SymbolKind.Constant,
        children: [],
        range: toRange(node.firstChild!),
        selectionRange: toRange(node.firstChild!),
      },
    ];
  }

  private createDocumentSymbolsForClass(
    node: Parser.SyntaxNode
  ): DocumentSymbol[] {
    return [
      {
        name: fullQualifiedConstantName(node),
        kind: SymbolKind.Class,
        children: [],
        range: toRange(node),
        selectionRange: toRange(node.firstNamedChild!),
      },
    ];
  }

  private createDocumentSymbolsForCall(
    node: Parser.SyntaxNode
  ): DocumentSymbol[] {
    if (!this.FIELD_METHOD_NAMES.has(node.firstNamedChild!.text!)) {
      return [];
    }

    const availableArgumentNodeTypes = new Set(["simple_symbol", "string"]);
    return node
      .lastChild!.children.filter((node) => {
        return availableArgumentNodeTypes.has(node.type);
      })
      .map((argumentNode) => {
        const name =
          argumentNode.type === "simple_symbol"
            ? argumentNode.text!.slice(1)
            : argumentNode.text!.slice(1, -1);
        return {
          name,
          kind: SymbolKind.Field,
          children: [],
          range: toRange(node),
          selectionRange: toRange(argumentNode),
        };
      });
  }

  private createDocumentSymbolsForMethod(
    node: Parser.SyntaxNode
  ): DocumentSymbol[] {
    return [
      {
        name: methodNameSignature(
          this.singletonClassNameStack[this.singletonClassNameStack.length - 1],
          node.firstNamedChild!.text
        ),
        kind: SymbolKind.Method,
        children: [],
        range: toRange(node),
        selectionRange: toRange(node.firstNamedChild!),
      },
    ];
  }

  private createDocumentSymbolsForModule(
    node: Parser.SyntaxNode
  ): DocumentSymbol[] {
    return [
      {
        name: fullQualifiedConstantName(node),
        kind: SymbolKind.Module,
        children: [],
        range: toRange(node),
        selectionRange: toRange(node.firstNamedChild!),
      },
    ];
  }

  private createDocumentSymbolsForSingletonMethod(
    node: Parser.SyntaxNode
  ): DocumentSymbol[] {
    return [
      {
        name: methodNameSignature(node.child(1)!.text, node.child(3)!.text),
        kind: SymbolKind.Method,
        children: [],
        range: toRange(node),
        selectionRange: toRange(node.child(1)!, node.child(3)!),
      },
    ];
  }
}

function extractSingletonClassName(
  node: Parser.SyntaxNode
): string | undefined {
  if (node.type !== "singleton_class") {
    return;
  }

  return node.firstNamedChild!.text;
}

function methodNameSignature(
  singletonClassName: string | undefined,
  methodName: string
): string {
  if (singletonClassName === "self") {
    return `.${methodName}`;
  } else if (singletonClassName) {
    return `${singletonClassName}.${methodName}`;
  } else {
    return `#${methodName}`;
  }
}

function fullQualifiedConstantName(node: Parser.SyntaxNode): string {
  const moduleNestableTypes = new Set(["class", "constant", "module"]);
  return selfAndAncestors(node)
    .filter((ancestor) => {
      return moduleNestableTypes.has(ancestor.type);
    })
    .map((ancestor) => {
      switch (ancestor.type) {
        case "class":
        case "module":
          return ancestor.firstNamedChild!.text;
        case "constant":
          return ancestor.text;
      }
    })
    .reverse()
    .join("::");
}
