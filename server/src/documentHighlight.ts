import {
  DocumentHighlight,
  DocumentHighlightKind,
  DocumentHighlightParams,
  Range,
  TextDocuments,
} from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { parse } from "./parser.js";
import {
  BeginNode,
  BlockNode,
  CaseNode,
  ClassNode,
  DefNode,
  ElseNode,
  ForNode,
  IfNode,
  ModuleNode,
  Node,
  RescueNode,
  UnlessNode,
  WhileNode,
} from "./nodes.js";
import { Settings } from "./settings.js";
import Location from "./Location.js";

export function documentHighlightRequestHandler(
  settings: Settings,
  params: DocumentHighlightParams,
  documents: TextDocuments<TextDocument>
): DocumentHighlight[] | undefined {
  if (!settings.documentHighlight.enabled) {
    return;
  }

  const textDocument = documents.get(params.textDocument.uri);
  if (!textDocument) {
    return;
  }

  const source = textDocument.getText();
  const node = parse(source).descendantForLocation(
    Location.fromPosition(source, params.position)
  );
  if (!node) {
    return;
  }

  return highlights(node);
}

// TODO: Support CaseMatchNode for pattern-matching.
// TODO: Support SingletonClassNode for `class << self ... end`.
function highlights(node: Node): DocumentHighlight[] {
  switch (node.type) {
    case "BeginNode":
      return highlightsForBeginNode(node as BeginNode);
    case "BlockNode":
      return highlightsForBlockNode(node as BlockNode);
    case "CaseNode":
      return highlightsForCaseNode(node as CaseNode);
    case "ClassNode":
      return highlightsForClassNode(node as ClassNode);
    case "DefNode":
      return highlightsForDefNode(node as DefNode);
    case "ElseNode":
      return highlightsForElseNode(node as ElseNode);
    case "ForNode":
      return highlightsForForNode(node as ForNode);
    case "IfNode":
      return highlightsForIfNode(node as IfNode);
    case "UnlessNode":
      return highlightsForUnlessNode(node as UnlessNode);
    case "ModuleNode":
      return highlightsForModuleNode(node as ModuleNode);
    case "RescueNode":
      return highlightsForRescueNode(node as RescueNode);
    case "UntilNode":
    case "WhileNode":
      return highlightsForWhileNode(node as WhileNode);
    default:
      return [];
  }
}

function highlightsForBeginChildNode(node: Node): DocumentHighlight[] {
  return highlights(node.parent!);
}

function highlightsForBlockNode(node: BlockNode): DocumentHighlight[] {
  return [toHighlight(node.openingRange()!), toHighlight(node.closingRange()!)];
}

// TODO: Support `then`.
function highlightsForCaseNode(
  node: CaseNode,
  highlightWhen = true,
  highlightConsequent = true
): DocumentHighlight[] {
  let elements = [node.caseKeywordRange(), node.endKeywordRange()]
    .filter((element) => element)
    .map((element) => toHighlight(element!));
  if (highlightWhen) {
    elements = elements.concat(
      node.conditionNodes()!.map((child) => toHighlight(child.keywordRange()!))
    );
  }
  if (highlightConsequent && node.consequent()) {
    elements = elements.concat(highlights(node.consequent()!));
  }
  return elements;
}

function highlightsForBeginNode(node: BeginNode): DocumentHighlight[] {
  const ranges = [
    node.beginKeywordRange(),
    node.rescueKeywordRange(),
    node.elseKeywordRange(),
    node.ensureKeywordRange(),
    node.endKeywordRange(),
  ];
  if (node.parent?.type === "DefNode") {
    const parent = node.parent as DefNode;
    if (parent.isBeginlessDefNode()) {
      ranges.push(parent.defKeywordRange());
    }
  }
  return ranges
    .filter((element) => element)
    .map((element) => toHighlight(element!));
}

function highlightsForClassNode(node: ClassNode): DocumentHighlight[] {
  return [
    toHighlight(node.classKeywordRange()!),
    toHighlight(node.endKeywordRange()!),
  ];
}

function highlightsForDefNode(node: DefNode): DocumentHighlight[] {
  if (node.isBeginlessDefNode()) {
    const children = node.children();
    if (children[0]) {
      return highlights(children[0]);
    } else {
      return [];
    }
  } else {
    return [
      toHighlight(node.defKeywordRange()!),
      toHighlight(node.endKeywordRange()!),
    ];
  }
}

function highlightsForElseNode(node: ElseNode): DocumentHighlight[] {
  switch (node.parent?.type) {
    case "BeginNode":
      return highlightsForBeginChildNode(node);
    case "CaseNode":
      return [toHighlight(node.elseKeywordRange()!)].concat(
        highlightsForCaseNode(node.parent! as CaseNode, true, false)
      );
    case "IfNode":
    case "UnlessNode":
      return [toHighlight(node.elseKeywordRange()!)].concat(
        highlightsForIfNode(node.parent! as IfNode, false)
      );
    default:
      return [];
  }
}

function highlightsForForNode(node: ForNode): DocumentHighlight[] {
  return [
    node.forKeywordRange(),
    node.inKeywordRange(),
    node.doKeywordRange(),
    node.endKeywordRange(),
  ]
    .filter((element) => element)
    .map((element) => toHighlight(element!));
}

function highlightsForIfNode(
  node: IfNode,
  highlightConsequent = true
): DocumentHighlight[] {
  let elements = [
    node.ifKeywordRange(),
    node.thenKeywordRange(),
    node.endKeywordRange(),
  ]
    .filter((element) => element)
    .map((element) => toHighlight(element!));
  if (highlightConsequent && node.consequent()) {
    elements = elements.concat(highlights(node.consequent()!));
  }
  if (node.isElsifNode()) {
    elements = elements.concat(
      highlightsForIfNode(node.parent! as IfNode, false)
    );
  }
  return elements;
}

function highlightsForModuleNode(node: ModuleNode): DocumentHighlight[] {
  return [
    toHighlight(node.moduleKeywordRange()!),
    toHighlight(node.endKeywordRange()!),
  ];
}

function highlightsForRescueNode(node: Node): DocumentHighlight[] {
  return highlightsForBeginChildNode(node);
}

function highlightsForUnlessNode(
  node: UnlessNode,
  highlightConsequent = true
): DocumentHighlight[] {
  let elements = [
    node.keywordRange(),
    node.thenKeywordRange(),
    node.endKeywordRange(),
  ]
    .filter((element) => element)
    .map((element) => toHighlight(element!));
  if (highlightConsequent && node.consequent()) {
    elements = elements.concat(highlights(node.consequent()!));
  }
  return elements;
}

function highlightsForWhileNode(node: WhileNode): DocumentHighlight[] {
  return [node.keywordRange(), node.closingRange()]
    .filter((element) => element)
    .map((element) => toHighlight(element!));
}

function toHighlight(range: Range): DocumentHighlight {
  return DocumentHighlight.create(range, DocumentHighlightKind.Text);
}
