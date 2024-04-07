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
import { runCodemod } from "../codemod.js";
import { isMainScript } from "../misc-utils.js";

if (isMainScript(import.meta.url)) {
  const startTime = performance.now();
  // execSync -> await shell
  const gitFilesOutput = execSync("git ls-files $DIRECTORY", {
    env: { DIRECTORY: "." },
    encoding: "utf8",
  });
  const time2 = performance.now();
  console.log(
    "git ls-files finished in",
    (time2 - startTime).toLocaleString(),
    "ms",
  );
  // const extensions = [".ts", ".tsx"];
  const extensions = [".js"];
  const filePaths = gitFilesOutput
    .split("\n")
    .filter(
      (filePath) =>
        filePath &&
        extensions.some((extension) => filePath.endsWith(extension)) &&
        existsSync(filePath),
    );
  for (const filePath of filePaths) {
    const source = readFileSync(filePath, { encoding: "utf8" });
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
    const result = runCodemod({
      source,
      query,
      onCapture: (captures) => {
        return {
          startIndex: captures.identifier.startIndex,
          endIndex: captures.identifier.endIndex,
          newText: "aria-label",
        };
      },
    });
    writeFileSync(filePath, result);
  }
  console.log(
    "finished processing",
    filePaths.length,
    "files in:",
    (performance.now() - time2).toLocaleString(),
    "ms",
  );
}
