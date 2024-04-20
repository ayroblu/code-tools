import Parser from "tree-sitter";
import ts from "tree-sitter-typescript";
import { isMainScript } from "../misc-utils.js";
import { traverseWithCursor } from "../traverse.js";
import { getField } from "../query.js";
const { tsx } = ts;

if (isMainScript(import.meta.url)) {
  const parser = new Parser();
  parser.setLanguage(tsx);

  const sourceCode = `
let x = 1;
x = 2;
window.value = 2;
for (let i = 0; i < 5; ++i) {
  if (i > 2) {
    x + 1;
  }
}
function a() {
  // todo
}
const b = () => {
  // todo
}
while (false) {
  // todo
}
{
  console.log('hi');
}
(() => {
  // iife
})();
`.trim();
  const tree = parser.parse(sourceCode);
  console.log(tree.rootNode.toString());
  traverseWithCursor(tree.walk(), {
    for_statement: (node) => {
      console.log(getField(node, "initializer")?.text);
    },
  });
}