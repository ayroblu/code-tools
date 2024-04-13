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

export function traverseWithCursor(
  cursor: Parser.TreeCursor,
  ...queries: TraverseQuery[]
): void {
  for (const query of queries) {
    const result = query[cursor.nodeType]?.(cursor.currentNode);
    if (result?.skip) return;
  }
  if (cursor.gotoFirstChild()) {
    do {
      traverseWithCursor(cursor, ...queries);
    } while (cursor.gotoNextSibling());
    cursor.gotoParent();
  }
}