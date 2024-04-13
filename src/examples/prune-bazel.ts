/**
 * For some bazel file, find all it's scala files, find all its imports
 * Also for some bazel file, traverse all its dependencies to find all their scala files and what they import
 * If scala file does not import a dependency specified in bazel, remove it from bazel
 * It's possible that a imports b imports c. b never uses c but a uses c - I need the whole bazel graph
 *
 * 1. List all BUILD bazel files
 * 2. For each bazel file determine the list of imports and transitive imports and exports
 * 3. Import / export is `com.package.ClassName`
 * 4. Filter out imports that you don't depend on AND your children don't depend on
 */

import { existsSync, readFileSync } from "node:fs";
import { isMainScript } from "../misc-utils.js";
import { shell } from "./utils/shell.js";
import Parser from "tree-sitter";
import ts from "tree-sitter-starlark";
import { buildTraverseQuery } from "../query.js";
import { traverseWithCursor } from "../traverse.js";

const parser = new Parser();
parser.setLanguage(ts);

if (isMainScript(import.meta.url)) {
  const time1 = performance.now();
  const { stdout: gitFilesOutput } = await shell("git ls-files BUILD");
  const time2 = performance.now();
  const extensions = ["BUILD", "BUILD.bazel"];
  const filePaths = gitFilesOutput
    .split("\n")
    .filter(
      (filePath) =>
        filePath &&
        extensions.some((extension) => filePath.endsWith(extension)) &&
        existsSync(filePath),
    );

  const timings: Record<string, number>[] = [];
  const results: Result[] = [];
  for (const filePath of filePaths) {
    const time1 = performance.now();
    const source = readFileSync(filePath, { encoding: "utf8" });
    const time2 = performance.now();
    if (!source.includes("accessibilityLabel")) {
      timings.push({
        read: time2 - time1,
      });
      continue;
    }
    const query = {
      type: ["jsx_self_closing_element", "jsx_opening_element"],
      items: [
        {
          field: "name",
          text: /^(View|Image|Button|Icon\w+)$/,
        },
        {
          type: "jsx_attribute",
          items: [
            {
              type: "property_identifier",
              capture: "identifier",
              text: "accessibilityLabel",
            },
          ],
        },
      ],
    } as const;

    const time3 = performance.now();
    const tree = parser.parse(source);
    const traverseQuery = buildTraverseQuery(query, (captures) => {
      const pos = captures.identifier.startPosition;
      results.push({ filename: filePath, line: pos.row, column: pos.column });
      return { skip: true };
    });
    const time4 = performance.now();
    traverseWithCursor(tree.walk(), traverseQuery);
    const time5 = performance.now();
    const timing = {
      read: time2 - time1,
      parse: time4 - time3,
      traverse: time5 - time4,
    };
    timings.push(timing);
  }
  for (const { filename, line, column } of results) {
    console.log(`${filename}:${line}:${column}`);
  }
  console.error("git ls-files", (time2 - time1).toLocaleString(), "ms");
  Object.entries(aggregateTiming(timings)).forEach(([key, value]) => {
    console.error(key, value.toLocaleString(), "ms");
  });
}

function aggregateTiming(
  timings: Record<string, number>[],
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const timing of timings) {
    Object.entries(timing).forEach(([key, value]) => {
      result[key] = (result[key] ?? 0) + value;
    });
  }
  return result;
}

function readBazelImports(filepath: string) {
  // fs.readFileSync(filepath, 'utf8')
  // parse and extract all dependencies (list of build targets)
}
function readBazelScalaExports(filepath: string) {
  // read bazel file
  // get sources
  // list all files that match sources
  // read scala files and list all imports
}

type Result = {
  filename: string;
  line: number;
  column: number;
};
