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
