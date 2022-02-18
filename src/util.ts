import Path from "path";

import { Dirent } from "fs";

/* @ignore */

/**
 * compare Dirent for sorting
 *
 * @param a
 * @param b
 * @returns
 * @ignore
 */
export const direntCmp = (a: Dirent, b: Dirent): number => {
  if (a.name === b.name) {
    return 0;
  } else if (a.name > b.name) {
    return 1;
  } else {
    return -1;
  }
};

/**
 * Make a specialized and simple but faster version of path.join that handles just 2 args
 */
export const makePathJoin2 = (sep: string, cwd: string, prefix: string) => {
  // user passed cwd or prefix that contains ../ or ..\\, which only path.join
  // can handle
  if (
    ["../", "..\\"].find((s) => cwd.includes(s) || prefix.includes(s)) ||
    (cwd.startsWith(".") && cwd.length > 1) ||
    (prefix.startsWith(".") && prefix.length > 1)
  ) {
    return Path.join;
  }

  return (a?: string, b?: string) => {
    if (a === ".") {
      return b || a;
    } else if (b === ".") {
      return a || b;
    } else if (a && b) {
      return a + sep + b;
    } else {
      return a || b || ".";
    }
  };
};
