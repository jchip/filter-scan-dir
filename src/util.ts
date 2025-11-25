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
 * Simple and fast path join for 2 arguments.
 * Assumes first argument is already normalized and second is a simple filename.
 *
 * @param sep - path separator to use
 * @param a - base path (should be normalized)
 * @param b - path component to append (typically a filename)
 * @returns joined path
 */
export const join2 = (sep: string, a?: string, b?: string): string => {
  if (!a || a === ".") {
    return b || a || ".";
  } else if (!b || b === ".") {
    return a;
  } else {
    return a + sep + b;
  }
};
