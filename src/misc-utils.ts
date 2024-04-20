import * as url from "node:url";

export function isMainScript(importMetaUrl: string) {
  if (importMetaUrl.startsWith("file:")) {
    const modulePath = url.fileURLToPath(importMetaUrl);
    return process.argv[1] === modulePath;
  }
}

export function pred<T>(value: T, f: (v: T) => unknown) {
  return f(value) ? value : undefined;
}
