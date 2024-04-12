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
  query: TraverseQuery,
): void {
  const result = query[cursor.nodeType]?.(cursor.currentNode);
  if (result?.skip) return;
  if (cursor.gotoFirstChild()) {
    do {
      traverseWithCursor(cursor, query);
    } while (cursor.gotoNextSibling());
    cursor.gotoParent();
  }
}