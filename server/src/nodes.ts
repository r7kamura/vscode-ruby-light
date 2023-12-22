import {
  ArrayNode as PrismArrayNode,
  BeginNode as PrismBeginNode,
  BlockNode as PrismBlockNode,
  CallNode as PrismCallNode,
  CaseNode as PrismCaseNode,
  ClassNode as PrismClassNode,
  ConstantReadNode as PrismConstantReadNode,
  ConstantWriteNode as PrismConstantWriteNode,
  DefNode as PrismDefNode,
  ElseNode as PrismElseNode,
  ForNode as PrismForNode,
  IfNode as PrismIfNode,
  ModuleNode as PrismModuleNode,
  Node as PrismNode,
  SingletonClassNode as PrismSingletonClassNode,
  StringNode as PrismStringNode,
  SymbolNode as PrismSymbolNode,
  UnlessNode as PrismUnlessNode,
  WhenNode as PrismWhenNode,
  WhileNode as PrismWhileNode,
} from "@ruby/prism/src/nodes.js";
import { Range } from "vscode-languageserver";
import Location from "./Location.js";

export class Node {
  public parent: Node | undefined;
  public prismNode: PrismNode;
  public source: string;

  public static instantiateProperNode(
    prismNode: PrismNode,
    parent: Node | undefined,
    source: string
  ): Node {
    switch (prismNode.constructor.name) {
      case "ArrayNode":
        return new ArrayNode(prismNode as PrismArrayNode, parent, source);
      case "BeginNode":
        return new BeginNode(prismNode as PrismBeginNode, parent, source);
      case "BlockNode":
        return new BlockNode(prismNode as PrismBlockNode, parent, source);
      case "CallNode":
        return new CallNode(prismNode as PrismCallNode, parent, source);
      case "CaseNode":
        return new CaseNode(prismNode as PrismCaseNode, parent, source);
      case "ClassNode":
        return new ClassNode(prismNode as PrismClassNode, parent, source);
      case "ConstantReadNode":
        return new ConstantReadNode(
          prismNode as PrismConstantReadNode,
          parent,
          source
        );
      case "ConstantWriteNode":
        return new ConstantWriteNode(
          prismNode as PrismConstantWriteNode,
          parent,
          source
        );
      case "DefNode":
        return new DefNode(prismNode as PrismDefNode, parent, source);
      case "ElseNode":
        return new ElseNode(prismNode as PrismElseNode, parent, source);
      case "ForNode":
        return new ForNode(prismNode as PrismForNode, parent, source);
      case "IfNode":
        return new IfNode(prismNode as PrismIfNode, parent, source);
      case "ModuleNode":
        return new ModuleNode(prismNode as PrismModuleNode, parent, source);
      case "RescueNode":
        return new RescueNode(prismNode as PrismNode, parent, source);
      case "SingletonClassNode":
        return new SingletonClassNode(
          prismNode as PrismSingletonClassNode,
          parent,
          source
        );
      case "StringNode":
        return new StringNode(prismNode as PrismStringNode, parent, source);
      case "SymbolNode":
        return new SymbolNode(prismNode as PrismSymbolNode, parent, source);
      case "UnlessNode":
        return new UnlessNode(prismNode as PrismUnlessNode, parent, source);
      case "WhenNode":
        return new WhenNode(prismNode as PrismWhenNode, parent, source);
      case "WhileNode":
        return new WhileNode(prismNode as PrismWhileNode, parent, source);
      default:
        return new Node(prismNode, parent, source);
    }
  }

  constructor(prismNode: PrismNode, parent: Node | undefined, source: string) {
    this.prismNode = prismNode;
    this.parent = parent;
    this.source = source;
  }

  public children(): Node[] {
    return this.prismNode.compactChildNodes().map((childNode: PrismNode) => {
      return Node.instantiateProperNode(childNode, this, this.source);
    });
  }

  public ancestors(): Node[] {
    const nodes: Node[] = [];
    let current = this.parent;
    while (current) {
      nodes.push(current);
      current = current.parent;
    }
    return nodes;
  }

  public get type(): string {
    return this.prismNode.constructor.name;
  }

  public range(): Range {
    return this.createRangeFromOffsets(
      this.prismNode.location.startOffset,
      this.prismNode.location.startOffset + this.prismNode.location.length
    );
  }

  protected createRangeFromOffsets(
    startOffset: number,
    endOffset: number
  ): Range {
    const positions = [startOffset, endOffset].map((offset) => {
      return new Location(this.source, offset).position();
    });
    return Range.create(positions[0], positions[1]);
  }
}

export class ArrayNode extends Node {
  public prismNode: PrismArrayNode;

  constructor(
    prismNode: PrismArrayNode,
    parent: Node | undefined,
    source: string
  ) {
    super(prismNode, parent, source);
    this.prismNode = prismNode;
  }

  public elementsRange(): Range | undefined {
    if (this.prismNode.elements.length === 0) {
      return;
    }
    const firstElement = this.prismNode.elements[0];
    const lastElement =
      this.prismNode.elements[this.prismNode.elements.length - 1];
    return this.createRangeFromOffsets(
      firstElement.location.startOffset,
      lastElement.location.startOffset + lastElement.location.length
    );
  }
}

export class BeginNode extends Node {
  public prismNode: PrismBeginNode;

  constructor(
    prismNode: PrismBeginNode,
    parent: Node | undefined,
    source: string
  ) {
    super(prismNode, parent, source);
    this.prismNode = prismNode;
  }

  public beginKeywordRange(): Range | undefined {
    if (!this.prismNode.beginKeywordLoc) {
      return;
    }
    return this.createRangeFromOffsets(
      this.prismNode.beginKeywordLoc.startOffset,
      this.prismNode.beginKeywordLoc.startOffset +
        this.prismNode.beginKeywordLoc.length
    );
  }

  public elseKeywordRange(): Range | undefined {
    if (!this.prismNode.elseClause) {
      return;
    }
    return this.createRangeFromOffsets(
      this.prismNode.elseClause.elseKeywordLoc.startOffset,
      this.prismNode.elseClause.elseKeywordLoc.startOffset +
        this.prismNode.elseClause.elseKeywordLoc.length
    );
  }

  public endKeywordRange(): Range | undefined {
    if (!this.prismNode.endKeywordLoc) {
      return;
    }
    return this.createRangeFromOffsets(
      this.prismNode.endKeywordLoc.startOffset,
      this.prismNode.endKeywordLoc.startOffset +
        this.prismNode.endKeywordLoc.length
    );
  }

  public ensureKeywordRange(): Range | undefined {
    if (!this.prismNode.ensureClause) {
      return;
    }
    return this.createRangeFromOffsets(
      this.prismNode.ensureClause.ensureKeywordLoc.startOffset,
      this.prismNode.ensureClause.ensureKeywordLoc.startOffset +
        this.prismNode.ensureClause.ensureKeywordLoc.length
    );
  }

  public rescueKeywordRange(): Range | undefined {
    if (!this.prismNode.rescueClause) {
      return;
    }
    return this.createRangeFromOffsets(
      this.prismNode.rescueClause.keywordLoc.startOffset,
      this.prismNode.rescueClause.keywordLoc.startOffset +
        this.prismNode.rescueClause.keywordLoc.length
    );
  }

  public hasBeginKeyword(): boolean {
    return !!this.prismNode.beginKeywordLoc;
  }
}

export class BlockNode extends Node {
  public prismNode: PrismBlockNode;

  constructor(
    prismNode: PrismBlockNode,
    parent: Node | undefined,
    source: string
  ) {
    super(prismNode, parent, source);
    this.prismNode = prismNode;
  }

  public closingRange(): Range {
    return this.createRangeFromOffsets(
      this.prismNode.closingLoc.startOffset,
      this.prismNode.closingLoc.startOffset + this.prismNode.closingLoc.length
    );
  }

  public openingRange(): Range {
    return this.createRangeFromOffsets(
      this.prismNode.openingLoc.startOffset,
      this.prismNode.openingLoc.startOffset + this.prismNode.openingLoc.length
    );
  }
}

export class CallNode extends Node {
  public prismNode: PrismCallNode;

  constructor(
    prismNode: PrismCallNode,
    parent: Node | undefined,
    source: string
  ) {
    super(prismNode, parent, source);
    this.prismNode = prismNode;
  }

  public argumentNodes(): Node[] | undefined {
    if (!this.prismNode.arguments_) {
      return;
    }
    return this.prismNode.arguments_.arguments_.map((argument: PrismNode) => {
      return Node.instantiateProperNode(argument, this, this.source);
    });
  }

  public argumentsRange(): Range | undefined {
    if (!this.prismNode.arguments_) {
      return;
    }
    return this.createRangeFromOffsets(
      this.prismNode.arguments_.location.startOffset,
      this.prismNode.arguments_.location.startOffset +
        this.prismNode.arguments_.location.length
    );
  }

  public openingToClosingRange(): Range | undefined {
    if (!this.prismNode.openingLoc || !this.prismNode.closingLoc) {
      return;
    }
    return this.createRangeFromOffsets(
      this.prismNode.openingLoc.startOffset,
      this.prismNode.closingLoc.startOffset + this.prismNode.closingLoc.length
    );
  }

  public methodName(): string {
    return this.prismNode.name;
  }
}

export class CaseNode extends Node {
  public prismNode: PrismCaseNode;

  constructor(
    prismNode: PrismCaseNode,
    parent: Node | undefined,
    source: string
  ) {
    super(prismNode, parent, source);
    this.prismNode = prismNode;
  }

  public consequent(): Node | undefined {
    if (!this.prismNode.consequent) {
      return;
    }
    return new ElseNode(this.prismNode.consequent, this, this.source);
  }

  public caseKeywordRange(): Range {
    return this.createRangeFromOffsets(
      this.prismNode.caseKeywordLoc.startOffset,
      this.prismNode.caseKeywordLoc.startOffset +
        this.prismNode.caseKeywordLoc.length
    );
  }

  public conditionNodes(): WhenNode[] | undefined {
    return this.prismNode.conditions.map((condition: any) => {
      return new WhenNode(condition, this, this.source);
    });
  }

  public endKeywordRange(): Range {
    return this.createRangeFromOffsets(
      this.prismNode.endKeywordLoc.startOffset,
      this.prismNode.endKeywordLoc.startOffset +
        this.prismNode.endKeywordLoc.length
    );
  }
}

export class ClassNode extends Node {
  public prismNode: PrismClassNode;

  constructor(
    prismNode: PrismClassNode,
    parent: Node | undefined,
    source: string
  ) {
    super(prismNode, parent, source);
    this.prismNode = prismNode;
  }

  public classKeywordRange(): Range {
    return this.createRangeFromOffsets(
      this.prismNode.classKeywordLoc.startOffset,
      this.prismNode.classKeywordLoc.startOffset +
        this.prismNode.classKeywordLoc.length
    );
  }

  public constantPathRange(): Range | undefined {
    return Node.instantiateProperNode(
      this.prismNode.constantPath,
      undefined,
      this.source
    ).range();
  }

  public endKeywordRange(): Range {
    return this.createRangeFromOffsets(
      this.prismNode.endKeywordLoc.startOffset,
      this.prismNode.endKeywordLoc.startOffset +
        this.prismNode.endKeywordLoc.length
    );
  }

  public name(): string {
    return this.prismNode.name;
  }
}

export class ConstantReadNode extends Node {
  public prismNode: PrismConstantReadNode;

  constructor(
    prismNode: PrismConstantReadNode,
    parent: Node | undefined,
    source: string
  ) {
    super(prismNode, parent, source);
    this.prismNode = prismNode;
  }

  public name(): string {
    return this.prismNode.name;
  }
}

export class ConstantWriteNode extends Node {
  public prismNode: PrismConstantWriteNode;

  constructor(
    prismNode: PrismConstantWriteNode,
    parent: Node | undefined,
    source: string
  ) {
    super(prismNode, parent, source);
    this.prismNode = prismNode;
  }

  public name(): string {
    return this.prismNode.name;
  }

  public nameRange(): Range {
    return this.createRangeFromOffsets(
      this.prismNode.nameLoc.startOffset,
      this.prismNode.nameLoc.startOffset + this.prismNode.nameLoc.length
    );
  }
}

export class DefNode extends Node {
  public prismNode: PrismDefNode;

  constructor(
    prismNode: PrismDefNode,
    parent: Node | undefined,
    source: string
  ) {
    super(prismNode, parent, source);
    this.prismNode = prismNode;
  }

  public name(): string {
    return this.prismNode.name;
  }

  public nameRange(): Range | undefined {
    return this.createRangeFromOffsets(
      this.prismNode.nameLoc.startOffset,
      this.prismNode.nameLoc.startOffset + this.prismNode.nameLoc.length
    );
  }

  public receiver(): Node | undefined {
    if (!this.prismNode.receiver) {
      return;
    }
    return Node.instantiateProperNode(
      this.prismNode.receiver,
      this,
      this.source
    );
  }

  // begin-less def-node example:
  //   def a
  //     b
  //   rescue
  //     c
  //   end
  public isBeginlessDefNode(): boolean {
    const firstChild = this.children()[0];
    return (
      firstChild?.type === "BeginNode" &&
      !(firstChild! as BeginNode).hasBeginKeyword()
    );
  }

  public defKeywordRange(): Range {
    return this.createRangeFromOffsets(
      this.prismNode.defKeywordLoc.startOffset,
      this.prismNode.defKeywordLoc.startOffset +
        this.prismNode.defKeywordLoc.length
    );
  }

  public endKeywordRange(): Range | undefined {
    if (!this.prismNode.endKeywordLoc) {
      return;
    }
    return this.createRangeFromOffsets(
      this.prismNode.endKeywordLoc.startOffset,
      this.prismNode.endKeywordLoc.startOffset +
        this.prismNode.endKeywordLoc.length
    );
  }
}

export class ElseNode extends Node {
  public prismNode: PrismElseNode;

  constructor(
    prismNode: PrismElseNode,
    parent: Node | undefined,
    source: string
  ) {
    super(prismNode, parent, source);
    this.prismNode = prismNode;
  }

  public elseKeywordRange(): Range {
    return this.createRangeFromOffsets(
      this.prismNode.elseKeywordLoc.startOffset,
      this.prismNode.elseKeywordLoc.startOffset +
        this.prismNode.elseKeywordLoc.length
    );
  }
}

export class ForNode extends Node {
  public prismNode: PrismForNode;

  constructor(
    prismNode: PrismForNode,
    parent: Node | undefined,
    source: string
  ) {
    super(prismNode, parent, source);
    this.prismNode = prismNode;
  }

  public doKeywordRange(): Range | undefined {
    if (!this.prismNode.doKeywordLoc) {
      return;
    }
    return this.createRangeFromOffsets(
      this.prismNode.doKeywordLoc.startOffset,
      this.prismNode.doKeywordLoc.startOffset +
        this.prismNode.doKeywordLoc.length
    );
  }

  public endKeywordRange(): Range {
    return this.createRangeFromOffsets(
      this.prismNode.endKeywordLoc.startOffset,
      this.prismNode.endKeywordLoc.startOffset +
        this.prismNode.endKeywordLoc.length
    );
  }

  public forKeywordRange(): Range {
    return this.createRangeFromOffsets(
      this.prismNode.forKeywordLoc.startOffset,
      this.prismNode.forKeywordLoc.startOffset +
        this.prismNode.forKeywordLoc.length
    );
  }

  public inKeywordRange(): Range {
    return this.createRangeFromOffsets(
      this.prismNode.inKeywordLoc.startOffset,
      this.prismNode.inKeywordLoc.startOffset +
        this.prismNode.inKeywordLoc.length
    );
  }
}

export class IfNode extends Node {
  public prismNode: PrismIfNode;

  constructor(
    prismNode: PrismIfNode,
    parent: Node | undefined,
    source: string
  ) {
    super(prismNode, parent, source);
    this.prismNode = prismNode;
  }

  public consequent(): Node | undefined {
    if (!this.prismNode.consequent) {
      return;
    }
    return new ElseNode(
      this.prismNode.consequent as PrismElseNode,
      this,
      this.source
    );
  }

  public isElsifNode(): boolean {
    return this.prismNode.ifKeywordLoc!.length === 5;
  }

  public endKeywordRange(): Range | undefined {
    if (!this.prismNode.endKeywordLoc) {
      return;
    }
    return this.createRangeFromOffsets(
      this.prismNode.endKeywordLoc.startOffset,
      this.prismNode.endKeywordLoc.startOffset +
        this.prismNode.endKeywordLoc.length
    );
  }

  public ifKeywordRange(): Range | undefined {
    if (!this.prismNode.ifKeywordLoc) {
      return;
    }
    return this.createRangeFromOffsets(
      this.prismNode.ifKeywordLoc.startOffset,
      this.prismNode.ifKeywordLoc.startOffset +
        this.prismNode.ifKeywordLoc.length
    );
  }

  public thenKeywordRange(): Range | undefined {
    if (!this.prismNode.thenKeywordLoc) {
      return;
    }
    return this.createRangeFromOffsets(
      this.prismNode.thenKeywordLoc.startOffset,
      this.prismNode.thenKeywordLoc.startOffset +
        this.prismNode.thenKeywordLoc.length
    );
  }
}

export class ModuleNode extends Node {
  public prismNode: PrismModuleNode;

  constructor(
    prismNode: PrismModuleNode,
    parent: Node | undefined,
    source: string
  ) {
    super(prismNode, parent, source);
    this.prismNode = prismNode;
  }

  public constantPathRange(): Range | undefined {
    return Node.instantiateProperNode(
      this.prismNode.constantPath,
      undefined,
      this.source
    ).range();
  }

  public name(): string {
    return this.prismNode.name;
  }

  public endKeywordRange(): Range {
    return this.createRangeFromOffsets(
      this.prismNode.endKeywordLoc.startOffset,
      this.prismNode.endKeywordLoc.startOffset +
        this.prismNode.endKeywordLoc.length
    );
  }

  public moduleKeywordRange(): Range {
    return this.createRangeFromOffsets(
      this.prismNode.moduleKeywordLoc.startOffset,
      this.prismNode.moduleKeywordLoc.startOffset +
        this.prismNode.moduleKeywordLoc.length
    );
  }
}

export class ProgramNode extends Node {
  private static walk(node: Node, callback: (node: Node) => void) {
    callback(node);
    node.children().forEach((childNode: Node) => {
      this.walk(childNode, callback);
    });
  }

  public descendantForLocation(location: Location): Node {
    let currentNode: Node | undefined = undefined;
    ProgramNode.walk(this, (node: Node) => {
      if (
        !currentNode ||
        (node.prismNode.location.startOffset <= location.startOffset &&
          location.startOffset <=
            node.prismNode.location.startOffset +
              node.prismNode.location.length &&
          node.prismNode.location.length <=
            currentNode.prismNode.location.length)
      ) {
        currentNode = node;
      }
    });
    return currentNode || this;
  }
}

export class RescueNode extends Node {}

export class SingletonClassNode extends Node {
  public prismNode: PrismSingletonClassNode;

  constructor(
    prismNode: PrismSingletonClassNode,
    parent: Node | undefined,
    source: string
  ) {
    super(prismNode, parent, source);
    this.prismNode = prismNode;
  }

  public expression(): Node {
    return Node.instantiateProperNode(
      this.prismNode.expression,
      this,
      this.source
    );
  }
}

export class StringNode extends Node {
  public prismNode: PrismStringNode;

  constructor(
    prismNode: PrismStringNode,
    parent: Node | undefined,
    source: string
  ) {
    super(prismNode, parent, source);
    this.prismNode = prismNode;
  }

  public contentRange(): Range {
    return this.createRangeFromOffsets(
      this.prismNode.contentLoc.startOffset,
      this.prismNode.contentLoc.startOffset + this.prismNode.contentLoc.length
    );
  }

  public openingToClosingRange(): Range | undefined {
    if (!this.prismNode.openingLoc || !this.prismNode.closingLoc) {
      return;
    }
    return this.createRangeFromOffsets(
      this.prismNode.openingLoc.startOffset,
      this.prismNode.closingLoc.startOffset + this.prismNode.closingLoc.length
    );
  }

  public unescaped(): string {
    return this.prismNode.unescaped;
  }
}

export class SymbolNode extends Node {
  public prismNode: PrismSymbolNode;

  constructor(
    prismNode: PrismSymbolNode,
    parent: Node | undefined,
    source: string
  ) {
    super(prismNode, parent, source);
    this.prismNode = prismNode;
  }

  public unescaped(): string {
    return this.prismNode.unescaped;
  }
}

export class UnlessNode extends Node {
  public prismNode: PrismUnlessNode;

  constructor(
    prismNode: PrismUnlessNode,
    parent: Node | undefined,
    source: string
  ) {
    super(prismNode, parent, source);
    this.prismNode = prismNode;
  }

  public consequent(): ElseNode | undefined {
    if (!this.prismNode.consequent) {
      return;
    }
    return new ElseNode(this.prismNode.consequent, this, this.source);
  }

  public endKeywordRange(): Range | undefined {
    if (!this.prismNode.endKeywordLoc) {
      return;
    }
    return this.createRangeFromOffsets(
      this.prismNode.endKeywordLoc.startOffset,
      this.prismNode.endKeywordLoc.startOffset +
        this.prismNode.endKeywordLoc.length
    );
  }

  public keywordRange(): Range {
    return this.createRangeFromOffsets(
      this.prismNode.keywordLoc.startOffset,
      this.prismNode.keywordLoc.startOffset + this.prismNode.keywordLoc.length
    );
  }

  public thenKeywordRange(): Range | undefined {
    if (!this.prismNode.thenKeywordLoc) {
      return;
    }
    return this.createRangeFromOffsets(
      this.prismNode.thenKeywordLoc.startOffset,
      this.prismNode.thenKeywordLoc.startOffset +
        this.prismNode.thenKeywordLoc.length
    );
  }
}

export class WhenNode extends Node {
  public prismNode: PrismWhenNode;

  constructor(
    prismNode: PrismWhenNode,
    parent: Node | undefined,
    source: string
  ) {
    super(prismNode, parent, source);
    this.prismNode = prismNode;
  }

  public keywordRange(): Range {
    return this.createRangeFromOffsets(
      this.prismNode.keywordLoc.startOffset,
      this.prismNode.keywordLoc.startOffset + this.prismNode.keywordLoc.length
    );
  }
}

export class WhileNode extends Node {
  public prismNode: PrismWhileNode;

  constructor(
    prismNode: PrismWhileNode,
    parent: Node | undefined,
    source: string
  ) {
    super(prismNode, parent, source);
    this.prismNode = prismNode;
  }

  public closingRange(): Range | undefined {
    if (!this.prismNode.closingLoc) {
      return;
    }
    return this.createRangeFromOffsets(
      this.prismNode.closingLoc.startOffset,
      this.prismNode.closingLoc.startOffset + this.prismNode.closingLoc.length
    );
  }

  public keywordRange(): Range {
    return this.createRangeFromOffsets(
      this.prismNode.keywordLoc.startOffset,
      this.prismNode.keywordLoc.startOffset + this.prismNode.keywordLoc.length
    );
  }
}
