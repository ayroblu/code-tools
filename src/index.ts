import Parser from "tree-sitter";
import ts from "tree-sitter-typescript";
const { tsx } = ts;

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

type TraverseQuery = {
  [nodeType: string]: (node: Parser.SyntaxNode) => void;
};
function traverse(node: Parser.SyntaxNode, query: TraverseQuery): void {
  query[node.type]?.(node);
  for (const child of node.namedChildren) {
    traverse(child, query);
  }
}

// type TreeSitterQueryItem<Capture extends string = string> =
//   | string
//   | {
//       type: string;
//       capture?: Capture;
//       fields?: ReadonlyArray<{
//         name: string;
//         capture?: Capture;
//         item?: TreeSitterQueryItem<Capture>;
//       }>;
//     };
type TreeSitterQuerySubItem<Capture extends string = string> =
  | {
      type: string;
      items?: ReadonlyArray<TreeSitterQuerySubItem<Capture>>;
      capture?: Capture;
    }
  | { wildcard: true; capture?: Capture }
  | {
      field: string;
      items?: ReadonlyArray<TreeSitterQuerySubItem<Capture>>;
      capture?: Capture;
    };
type TreeSitterQueryItem<Capture extends string = string> = {
  type: string;
  capture?: Capture;
  items?: ReadonlyArray<TreeSitterQuerySubItem<Capture>>;
};
type QueryCaptures<T extends TreeSitterQueryItem> =
  T extends TreeSitterQueryItem<infer Captures> ? Captures : never;

function buildTraverseQuery<QueryItem extends TreeSitterQueryItem>(
  queryItem: QueryItem,
  callback: (params: {
    [captures in QueryCaptures<QueryItem>]: Parser.SyntaxNode;
  }) => void,
): TraverseQuery {
  function onNode(node: Parser.SyntaxNode) {
    function matchSubRecursive(
      node: Parser.SyntaxNode,
      subQueryItem: TreeSitterQuerySubItem,
      captures: Record<string, Parser.SyntaxNode>,
    ): boolean {
      if ("type" in subQueryItem) {
        if (subQueryItem.type !== node.type) {
          return false;
        }
      } else if ("field" in subQueryItem) {
        if (!getField(node, subQueryItem.field)) {
          return false;
        }
      } else if ("wildcard" in subQueryItem) {
      } else {
        const exhaustiveCheck: never = subQueryItem;
        throw new Error(`Unhandled case: ${exhaustiveCheck}`);
      }

      if (subQueryItem.capture) {
        if (captures[subQueryItem.capture as any]) {
          throw new Error(
            "duplicate capture name found: " + subQueryItem.capture,
          );
        }
        captures = {
          ...captures,
          [subQueryItem.capture as any]: node,
        };
      }

      const items = "items" in subQueryItem ? subQueryItem.items : undefined;
      if (!items) {
        return true;
      } else {
        return items.every((item) => {
          for (const child of node.namedChildren) {
            if (matchSubRecursive(child, item, captures)) {
              return true;
            }
          }
          return false;
        });
      }
    }
    if (queryItem.type === node.type) {
      const captures = {
        [queryItem.type]: node,
      };
      if (!queryItem.items) {
        return captures;
      }
      const isMatch = queryItem.items.every((item) =>
        matchSubRecursive(node, item, captures),
      );
      if (isMatch) {
        callback(captures as any);
      }
    }
  }
  return {
    [queryItem.type]: onNode,
  };
}

function getField(
  node: Parser.SyntaxNode,
  fieldName: string,
): Parser.SyntaxNode | void {
  // Also get all fields with node.fields
  const resolvedFieldName = fieldName.endsWith("Node")
    ? fieldName
    : fieldName + "Node";
  // @ts-expect-error - https://github.com/tree-sitter/node-tree-sitter/issues/54
  return node[resolvedFieldName];
}