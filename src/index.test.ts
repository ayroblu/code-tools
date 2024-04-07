import Parser from "tree-sitter";
import ts from "tree-sitter-typescript";
import { buildTraverseQuery } from "./query.js";
import { traverse } from "./traverse.js";
const { tsx } = ts;

describe("query", () => {
  it("should match valid expression", function () {
    expect(runTest()).to.deep.equal(["expression", "callName"]);
  });
});

const parser = new Parser();
parser.setLanguage(tsx);

function runTest() {
  const sourceCode = "let x = 1;\nconsole.log(x);";
  const tree = parser.parse(sourceCode);
  const query = {
    type: "expression_statement",
    capture: "expression",
    items: [
      {
        type: "call_expression",
        items: [
          { field: "function", capture: "callName", text: "console.log" },
        ],
      },
    ],
  } as const;

  let capture = undefined;
  const traverseQuery = buildTraverseQuery(query, (captures) => {
    capture = Object.keys(captures);
  });
  traverse(tree.rootNode, traverseQuery);
  return capture;
}