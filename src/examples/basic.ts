import Parser from "tree-sitter";
import ts from "tree-sitter-typescript";
import { traverse } from "../traverse";
import { buildTraverseQuery } from "../query";
import { isMainScript } from "../misc-utils";
const { tsx } = ts;

if (isMainScript(import.meta.url)) {
  const parser = new Parser();
  parser.setLanguage(tsx);

  const sourceCode = "let x = 1; console.log(x);";
  const tree = parser.parse(sourceCode);
  const query = {
    type: "expression_statement",
    capture: "expression",
    items: [
      {
        type: "call_expression",
        items: [{ field: "function", capture: "callName" }],
      },
    ],
  } as const;
  const traverseQuery = buildTraverseQuery(query, (captures) => {
    console.log(captures);
  });
  // console.log(tree.rootNode.toString());
  traverse(tree.rootNode, traverseQuery);
  // usecases:
  // 1. move code
  // 2. replace code
  // 3. query across files - find definition
  // 4. loop through all files, have mtimes changed, have sha changed. Find references
}