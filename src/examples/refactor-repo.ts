/**
 * list all git files:
 *  $ git ls-files {directory}
 * for all files:
 *  read file
 *    $ fs.readFileSync(filePath)
 *  perform codemod
 *    $ runCodemod(...)
 *  save resulting file
 *    $ fs.writeFileSync(filePath, source)
 */

import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { runCodemod } from "../codemod";

if (require.main === module) {
  // execSync -> await shell
  const gitFilesOutput = execSync("git ls-files $DIRECTORY", {
    env: { DIRECTORY: "." },
    encoding: "utf8",
  });
  const filePaths = gitFilesOutput
    .split("\n")
    .filter(
      (filePath) =>
        filePath &&
        (filePath.endsWith(".ts") || filePath.endsWith(".tsx")) &&
        existsSync(filePath),
    );
  for (const filePath of filePaths) {
    const source = readFileSync(filePath, { encoding: "utf8" });
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
    const result = runCodemod({
      source,
      query,
      onCapture: (captures) => {
        return {
          startIndex: captures.callName.startIndex,
          endIndex: captures.callName.endIndex,
          newText: "logger.info",
        };
      },
    });
    writeFileSync(filePath, result);
  }
}
