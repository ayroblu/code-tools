import Parser from "tree-sitter";

export type TraverseQuery = {
  [nodeType: string]: (node: Parser.SyntaxNode) => void;
};
export function traverse(node: Parser.SyntaxNode, query: TraverseQuery): void {
  query[node.type]?.(node);
  for (const child of node.namedChildren) {
    traverse(child, query);
  }
}