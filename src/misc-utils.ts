import * as url from "node:url";

export function isMainScript(currentFile: string) {
  if (currentFile.startsWith("file:")) {
    const modulePath = url.fileURLToPath(currentFile);
    return process.argv[1] === modulePath;
  }
}
