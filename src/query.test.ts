import Parser from "tree-sitter";
import ts from "tree-sitter-typescript";
import { buildTraverseQuery } from "./query.js";
import { traverse } from "./traverse.js";
const { tsx } = ts;

describe("query", () => {
  it("should match valid expression", function () {
    expect(runTest()).to.deep.equal(["expression", "callName"]);
  });

  it("should match more generalised expression", function () {
    expect(runGeneralTest()).to.deep.equal([
      ["identifier"],
      ["identifier"],
      ["identifier"],
    ]);
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

function runGeneralTest() {
  const sourceCode = `
const first = <Component foo="string" bar="string" />;
const second = <Component foo="string" bar="string">{first}</Component>;
const third = <NestedComponent foo="string" bar="string">{first}</NestedComponent>;
const fourth = <MyComp foo="Component" bar="string">{first}</MyComp>;
  `;
  const tree = parser.parse(sourceCode);
  const query = {
    type: ["jsx_opening_element", "jsx_self_closing_element"],
    items: [
      {
        field: "name",
        text: /Component/,
      },
      {
        type: "jsx_attribute",
        items: [
          {
            type: "property_identifier",
            capture: "identifier",
            text: "foo",
          },
        ],
      },
    ],
  } as const;

  const results: string[][] = [];
  const traverseQuery = buildTraverseQuery(query, (captures) => {
    results.push(Object.keys(captures));
  });
  traverse(tree.rootNode, traverseQuery);
  return results;
}