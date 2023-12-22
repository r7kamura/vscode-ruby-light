import {
  DocumentSymbol,
  DocumentSymbolParams,
  SymbolKind,
  TextDocuments,
} from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { ConstantReadNode as PrismConstantReadNode } from "@ruby/prism/src/nodes.js";
import {
  CallNode,
  ClassNode,
  ConstantReadNode,
  ConstantWriteNode,
  DefNode,
  ModuleNode,
  Node,
  ProgramNode,
  SingletonClassNode,
  StringNode,
  SymbolNode,
} from "./nodes.js";
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

const FIELD_METHOD_NAMES = new Set([
  "attr_accessor",
  "attr_reader",
  "attr_writer",
]);

const AVAILABLE_FIELD_NAME_TYPES = new Set(["StringNode", "SymbolNode"]);

class Walker {
  private documentSymbolStack: DocumentSymbol[];

  private singletonClassNameStack: string[];

  constructor() {
    this.documentSymbolStack = [this.createDummyDocumentSymbol()];
    this.singletonClassNameStack = [];
  }

  walk(rootNode: ProgramNode): DocumentSymbol[] {
    this.step(rootNode);
    return this.documentSymbolStack[0].children!;
  }

  private step(node: Node) {
    const documentSymbols = this.createDocumentSymbols(node);
    const singletonClassName = extractSingletonClassName(node);
    this.pushDocumentSymbols(documentSymbols);
    if (singletonClassName) {
      this.singletonClassNameStack.push(singletonClassName);
    }
    node.children().forEach((child: Node) => {
      this.step(child);
    });
    if (singletonClassName) {
      this.singletonClassNameStack.pop();
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

  private popDocumentSymbol() {
    this.documentSymbolStack.pop();
  }

  private createDocumentSymbols(node: Node): DocumentSymbol[] {
    switch (node.type) {
      case "ClassNode":
        return this.createDocumentSymbolsForClassNode(node as ClassNode);
      case "CallNode":
        return this.createDocumentSymbolsForCallNode(node as CallNode);
      case "ConstantWriteNode":
        return this.createDocumentSymbolsForConstantWriteNode(
          node as ConstantWriteNode
        );
      case "DefNode":
        return this.createDocumentSymbolsForDefNode(node as DefNode);
      case "ModuleNode":
        return this.createDocumentSymbolsForModuleNode(node as ModuleNode);
      default:
        return [];
    }
  }

  private createDocumentSymbolsForConstantWriteNode(
    node: ConstantWriteNode
  ): DocumentSymbol[] {
    return [
      {
        name: node.name(),
        kind: SymbolKind.Constant,
        children: [],
        range: node.range(),
        selectionRange: node.nameRange(),
      },
    ];
  }

  private createDocumentSymbolsForClassNode(node: ClassNode): DocumentSymbol[] {
    return [
      {
        name: node.name(),
        kind: SymbolKind.Class,
        children: [],
        range: node.range(),
        selectionRange: node.constantPathRange()!,
      },
    ];
  }

  private createDocumentSymbolsForCallNode(node: CallNode): DocumentSymbol[] {
    if (!FIELD_METHOD_NAMES.has(node.methodName())) {
      return [];
    }
    const argumentNodes = node.argumentNodes();
    if (!argumentNodes) {
      return [];
    }
    return argumentNodes
      .filter((node: Node) => {
        return AVAILABLE_FIELD_NAME_TYPES.has(node.constructor.name);
      })
      .map((node) => {
        return {
          name: (node as StringNode | SymbolNode).unescaped(),
          kind: SymbolKind.Field,
          children: [],
          range: node.range(),
          selectionRange: node.range(),
        };
      });
  }

  private createDocumentSymbolsForDefNode(node: DefNode): DocumentSymbol[] {
    const name = this.methodNameSignature(node);
    if (!name) {
      return [];
    }
    return [
      {
        name,
        kind: SymbolKind.Method,
        children: [],
        range: node.range(),
        selectionRange: node.nameRange()!,
      },
    ];
  }

  private createDocumentSymbolsForModuleNode(
    node: ModuleNode
  ): DocumentSymbol[] {
    return [
      {
        name: node.name(),
        kind: SymbolKind.Module,
        children: [],
        range: node.range(),
        selectionRange: node.constantPathRange()!,
      },
    ];
  }

  private methodNameSignature(node: DefNode): string | undefined {
    const methodName = node.name();
    const receiver = node.receiver();
    if (receiver) {
      if (receiver.type === "SelfNode") {
        return `.${methodName}`;
      } else if (receiver.type === "ConstantReadNode") {
        return `${(receiver as ConstantReadNode).name()}.${methodName}`;
      }
    } else if (this.singletonClassNameStack.length > 0) {
      if (
        this.singletonClassNameStack[
          this.singletonClassNameStack.length - 1
        ] === "self"
      ) {
        return `.${methodName}`;
      }
    } else {
      return `#${methodName}`;
    }
  }
}

// NOTE: Only `class << self` is supported for now.
function extractSingletonClassName(node: Node): string | undefined {
  if (node.constructor.name !== "SingletonClassNode") {
    return;
  }
  const castedNode = node as SingletonClassNode;
  if (castedNode.prismNode.expression.constructor.name === "SelfNode") {
    return "self";
  } else if (
    castedNode.prismNode.expression.constructor.name === "ConstantReadNode"
  ) {
    return (castedNode.prismNode.expression as PrismConstantReadNode).name;
  } else {
    return "unknown";
  }
}

// I can't decide if the constant symbol name should be a fully qualified name or not,
// so I will leave this implementation for now.
function fullQualifiedConstantName(node: Node): string {
  const moduleNestableTypes = new Set([
    "ClassNode",
    "ConstantWriteNode",
    "ModuleNode",
  ]);
  return [node, ...node.ancestors()]
    .filter((ancestor) => {
      return moduleNestableTypes.has(ancestor.type);
    })
    .map((ancestor) => {
      switch (ancestor.constructor.name) {
        case "ClassNode":
          return (ancestor as ClassNode).name();
        case "ModuleNode":
          return (ancestor as ModuleNode).name();
        case "ConstantWriteNode":
          return (ancestor as ConstantWriteNode).name();
      }
    })
    .reverse()
    .join("::");
}
