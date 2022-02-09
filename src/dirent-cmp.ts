import { Dirent } from "fs";

/**
 * compare Dirent for sorting
 *
 * @param a
 * @param b
 * @returns
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
