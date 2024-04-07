import Parser from "tree-sitter";
import ts from "tree-sitter-typescript";
import {
  buildTraverseQuery,
  type QueryCaptures,
  type TreeSitterQueryItem,
} from "./query.js";
import { traverse } from "./traverse.js";
const { tsx } = ts;

export function runCodemod<QueryItem extends TreeSitterQueryItem>({
  source,
  query,
  onCapture,
}: {
  source: string;
  lang?: "tsx";
  query: QueryItem;
  onCapture: (captures: QueryCaptures<QueryItem>) => CodeEdit;
}) {
  const parser = new Parser();
  parser.setLanguage(tsx);

  const tree = parser.parse(source);

  const edits: CodeEdit[] = [];
  const traverseQuery = buildTraverseQuery(query, (captures) => {
    const edit = onCapture(captures);
    edits.push(edit);
    return { skip: true };
  });
  traverse(tree.rootNode, traverseQuery);

  return runEdits(source, edits);
}

/* Assumes edits are in ascending order */
function runEdits(source: string, edits: CodeEdit[]): string {
  let adjustment = 0;
  for (const { startIndex, endIndex, newText } of edits) {
    source =
      source.slice(0, startIndex + adjustment) +
      newText +
      source.slice(endIndex + adjustment);
    adjustment = newText.length - (endIndex - startIndex);
  }
  return source;
}

type CodeEdit = {
  startIndex: number;
  endIndex: number;
  newText: string;
};