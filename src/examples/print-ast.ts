import Parser from "tree-sitter";
import ts from "tree-sitter-typescript";
import { isMainScript } from "../misc-utils.js";
import { traverseWithCursor } from "../traverse.js";
import { getField } from "../query.js";
const { tsx } = ts;

if (isMainScript(import.meta.url)) {
  const parser = new Parser();
  parser.setLanguage(tsx);

  const sourceCodes = [
    `
function a(param: string, opt?: {} = {}) {
  //todo
}
a('123');
b.a('123');
`,
    `
const a = (param: string) => {
  //todo
}
`,
  ];
  for (const sourceCode of sourceCodes) {
    const tree = parser.parse(sourceCode);
    console.log(tree.rootNode.toString());
    traverseWithCursor(tree.walk(), {
      for_statement: (node) => {
        console.log(getField(node, "initializer")?.text);
      },
    });
  }
}