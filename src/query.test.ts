import Parser from "tree-sitter";
import ts from "tree-sitter-typescript";
import { buildTraverseQuery } from "./query.js";
import { traverse, traverseWithCursor } from "./traverse.js";
const { tsx } = ts;

describe("query", () => {
  it("should match valid expression", () => {
    expect(runTest()).to.deep.equal(["expression", "callName"]);
  });

  it("should match more generalised expression", () => {
    expect(runGeneralTest()).to.deep.equal([
      ["identifier"],
      ["identifier"],
      ["identifier"],
    ]);
  });

  it("should match each sub item", () => {
    expect(runMultiMatchTest()).to.deep.equal([
      { key: "key1", value: "'first'" },
      { key: "key2", value: "'second'" },
      { key: "key3", value: "'third'" },
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
  // traverse(tree.rootNode, traverseQuery);
  traverseWithCursor(tree.walk(), traverseQuery);
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

function runMultiMatchTest() {
  const sourceCode = `
const a = {
  key1: 'first',
  key2: 'second',
  key3: 'third',
}
  `.trim();
  const tree = parser.parse(sourceCode);
  const query = {
    type: "object",
    items: [
      {
        type: "pair",
        items: [
          { field: "key", capture: "key" },
          { field: "value", capture: "value" },
        ],
      },
    ],
  } as const;

  const results: { key: string; value: string }[] = [];
  const traverseQuery = buildTraverseQuery(query, (captures) => {
    const key = captures.key.text;
    const value = captures.value.text;
    results.push({ key, value });
  });
  traverse(tree.rootNode, traverseQuery);
  return results;
}