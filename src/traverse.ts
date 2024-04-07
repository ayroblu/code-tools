import Parser from "tree-sitter";

export type TraverseQuery = {
  [nodeType: string]: (node: Parser.SyntaxNode) => void | { skip: boolean };
};
export function traverse(node: Parser.SyntaxNode, query: TraverseQuery): void {
  const result = query[node.type]?.(node);
  if (result?.skip) return;
  for (const child of node.namedChildren) {
    traverse(child, query);
  }
}