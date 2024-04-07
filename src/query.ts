import Parser from "tree-sitter";
import type { TraverseQuery } from "./traverse";

type TreeSitterQuerySubItem<Capture extends string = string> = (
  | {
      type: string;
      items?: ReadonlyArray<TreeSitterQuerySubItem<Capture>>;
    }
  | { wildcard: true }
  | {
      field: string;
      items?: ReadonlyArray<TreeSitterQuerySubItem<Capture>>;
    }
) & {
  capture?: Capture;
  text?: string;
};
export type TreeSitterQueryItem<Capture extends string = string> = {
  type: string;
  capture?: Capture;
  items?: ReadonlyArray<TreeSitterQuerySubItem<Capture>>;
};
type QueryCapturesName<T extends TreeSitterQueryItem> =
  T extends TreeSitterQueryItem<infer Captures> ? Captures : never;
export type QueryCaptures<T extends TreeSitterQueryItem> = {
  [captures in QueryCapturesName<T>]: Parser.SyntaxNode;
};

export function buildTraverseQuery<QueryItem extends TreeSitterQueryItem>(
  queryItem: QueryItem,
  callback: (params: QueryCaptures<QueryItem>) => void | { skip: boolean },
): TraverseQuery {
  function onNode(node: Parser.SyntaxNode): void | { skip: boolean } {
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
        if (node.parent && !getField(node.parent, subQueryItem.field)) {
          return false;
        }
      } else if ("wildcard" in subQueryItem) {
      } else {
        const exhaustiveCheck: never = subQueryItem;
        throw new Error(`Unhandled case: ${exhaustiveCheck}`);
      }
      if (subQueryItem.text && node.text !== subQueryItem.text) {
        return false;
      }

      if (subQueryItem.capture) {
        if (captures[subQueryItem.capture as any]) {
          throw new Error(
            "duplicate capture name found: " + subQueryItem.capture,
          );
        }
        captures[subQueryItem.capture as any] = node;
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
      const captures: Record<string, Parser.SyntaxNode> = {};
      if (queryItem.capture) {
        captures[queryItem.capture] = node;
      }
      if (!queryItem.items) {
        return;
      }
      const isMatch = queryItem.items.every((item) =>
        node.namedChildren.some((child) =>
          matchSubRecursive(child, item, captures),
        ),
      );
      if (isMatch) {
        return callback(captures as any);
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