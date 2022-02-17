/* eslint-disable max-statements, complexity, comma-dangle, max-params, max-depth */

import Fs, { Dirent, Stats } from "fs";
import Path from "path";
import Util from "util";
import { direntCmp } from "./dirent-cmp";

/**
 * type of the 3rd argument for the filter callback
 */
export type ExtrasData = {
  /** name of the file being considered */
  file: string;
  /** path to the directory being processed that contains the file  */
  path: string;
  /** result from fs.lstat or readdir */
  stat: Dirent | Stats;
  /** full path with cwd + path + file  */
  fullFile: string;
  /** path to file without cwd: path + file */
  dirFile: string;
  /** extsion of the file, ie: `.js` */
  ext: string;
  /** file name without the extension */
  noExt: string;
};

/**
 * Info from the filter callback to indicate what to do next
 */
export type FilterInfo = {
  /** name of the group to add the file or directory (if grouping is enabled) */
  group?: string;
  /** if `true` then skip the file or directory, else add it */
  skip?: boolean;
  /** stop the scanning and return the result immediately. */
  stop?: boolean;
  /** if not `undefined`, then use this as the value to add to the output */
  formatName?: string;
};

/**
 * result from the filter callback
 * - `false` or `undefined` - skip the file or directory
 * - `true` - include the file in the default result
 * - _string_ - name of the group to add the file or directory (if grouping is enabled)
 * - _FilterInfo_ - see type {@link FilterInfo} for details
 */
export type FilterResult = boolean | string | FilterInfo;

/**
 * filter callback for file or directory entry
 * @param file - name of the file/dir being considered
 * @param path - path to the directory containing the file. Not the full path,
 *    just the relative path from CWD.  It's empty string for the files in the
 *    first level directory.
 * @param extras - extras data
 */
export type FilterCallback = (file: string, path: string, extras: ExtrasData) => FilterResult;

/**
 * Options for filterScanDir
 */
export type Options = {
  /** current working directory to start scanning */
  cwd?: string;
  /**
   * prefix to add to the paths to scan.  It's applied after `cwd`.
   * - The `prefix` will be in the resulting paths.  Useful if you want
   *   to scan a dir further down from `cwd` but you don't want to prepend
   *   CWD to the resulting paths.
   */
  prefix?: string;
  /** prepend CWD to paths returned */
  prependCwd?: boolean;
  /** sort files from each dir */
  sortFiles?: boolean;
  /** include directories in result */
  includeDir?: boolean;
  /** zero base max level of directories to recurse into. Default: `Infinity`  */
  maxLevel?: number;
  /**
   * use `fs.lstat` to get stat of each file, instead of `readir`'s `withFileTypes` option.
   *
   * - *Default*: `true` - for significant performance improvement, set this to `false`
   *
   */
  fullStat?: boolean;
  /**
   * for async version only - numer of directories to process concurrently. *Default*: `50`
   *
   * - Set this to `0` or `1` to disable concurrent mode
   *
   * NOTE: setting this to a very large number, or `Infinity`, could potentially
   * increase performance very significantly, however, there is a dimishing return
   * and more memory usage, so the default is already fairly good.
   */
  concurrency?: number;
  /** set to `true` to throw errors instead of ignoring them */
  rethrowError?: boolean;
  /** callback to filter files. */
  filter?: FilterCallback;
  /** callback to filter directories. */
  filterDir?: FilterCallback;
  /** array or string of extensions to ignore. ext must include `.`, ie: `".js"` */
  ignoreExt?: string | string[];
  /** array or string of extensions to include only, apply after `ignoreExt` */
  filterExt?: string | string[];
  /**
   * path separator to use to join entries
   *
   * - *Default*: `path.posix.sep`
   * - If you didn't specify this, then `cwd` is automatically converted to use `/`.
   */
  pathSep?: string;
};

/**
 * options specifically to set grouping flag `true` to enable grouping of files
 */
export type GroupingOptions = {
  /**
   * enable grouping of files
   * This is default to disabled, so it's only expecting `true` to enable it.
   */
  grouping: true;
} & Options;

/** internal options and data */
type InternalOpts = GroupingOptions & {
  _concurrentCount?: number;
  /** join two paths together */
  _join2: (a: string, b: string) => string;
  result: Record<string, string[]>;
  readdirOpts: any;
  dir: string;
};

/**
 * create a new ExtrasData object
 *
 * @param file
 * @param fullFile
 * @param path
 * @param stat
 * @param options
 * @returns
 */
function makeExtrasData(
  file: string,
  fullFile: string,
  path: string,
  stat: Dirent | Stats,
  options: InternalOpts
): ExtrasData {
  const dirFile: string = options._join2(path, file);
  const ix = file.lastIndexOf(".");

  if (ix > 0) {
    return {
      file,
      path,
      stat,
      fullFile,
      dirFile,
      ext: file.substring(ix),
      noExt: file.substring(0, ix),
    };
  } else {
    return {
      file,
      path,
      stat,
      fullFile,
      dirFile,
      ext: "",
      noExt: file,
    };
  }
}

/**
 * Add a file entry to the result
 *
 * @param result
 * @param options
 * @param extras
 */
function addResult(result, options: InternalOpts, extras: ExtrasData) {
  const group =
    (options.grouping && typeof result === "string" ? result : result && result.group) || "files";

  if (!options.result[group]) {
    options.result[group] = [];
  }

  if (result.formatName !== undefined) {
    options.result[group].push(result.formatName);
  } else {
    options.result[group].push(options.prependCwd ? extras.fullFile : extras.dirFile);
  }
}

/**
 * Process a directory entry
 *
 * @param options
 * @param extras
 * @returns
 */
function processDir(options, extras) {
  const filterResult = options.filterDir
    ? options.filterDir(extras.file, extras.path, extras)
    : true;

  if (filterResult) {
    if (filterResult.skip !== true && options.includeDir) {
      addResult(filterResult, options, extras);
    }
    return { stop: filterResult.stop, skip: filterResult.skip };
  }

  return { stop: false, skip: true };
}

/**
 * process a file entry
 *
 * @param options
 * @param extras
 * @returns
 */
function processFile(options, extras) {
  if (options.ignoreExt.length > 0 && options.ignoreExt.indexOf(extras.ext) >= 0) {
    return false;
  }

  if (options.filterExt.length > 0 && options.filterExt.indexOf(extras.ext) < 0) {
    return false;
  }

  const filterResult = options.filter ? options.filter(extras.file, extras.path, extras) : true; // default to include

  if (filterResult) {
    if (filterResult.skip !== true) {
      addResult(filterResult, options, extras);
    }
    return filterResult.stop;
  }

  return false;
}

/**
 * The scanned result if grouping is enabled.
 *
 * - The default `files` group will contain all files not assigned a group
 * - All other files with a group will be assigned to that field
 */
export type GroupingResult = { files: string[] } & Record<string, string[]>;

/**
 * get the result base on grouping enable flag
 *
 * @param options
 * @returns
 */
function getResult(options: InternalOpts): GroupingResult | string[] {
  return options.grouping
    ? Object.assign({ files: [] }, options.result)
    : options.result.files || [];
}

/**
 * sync version of directory walk
 *
 * @param path
 * @param options
 * @param level
 * @returns
 */
function walkSync(path: string, options: InternalOpts, level = 0) {
  try {
    const dir = options._join2(options.dir, path);
    let files: (string | Dirent)[] = Fs.readdirSync(dir, options.readdirOpts);

    if (options.sortFiles) {
      if (options.fullStat) {
        files = files.sort();
      } else {
        files = (files as Dirent[]).sort(direntCmp);
      }
    }

    const dirs = [];
    let stop = false;

    // process files first
    for (let ix = 0; !stop && ix < files.length; ix++) {
      const file = files[ix];
      let extras: ExtrasData;

      if (options.fullStat) {
        const fullFile = options._join2(dir, file as string);
        const stat = Fs.lstatSync(fullFile);
        extras = makeExtrasData(file as string, fullFile, path, stat, options);
      } else {
        const fullFile = options._join2(dir, (file as Dirent).name);
        extras = makeExtrasData((file as Dirent).name, fullFile, path, file as Dirent, options);
      }

      if (extras.stat.isDirectory()) {
        dirs.push(extras);
      } else {
        stop = processFile(options, extras);
      }
    }

    // now process dirs
    if (!stop && dirs.length > 0) {
      for (let ix = 0; ix < dirs.length; ix++) {
        const extras = dirs[ix];
        const flags = processDir(options, extras);
        if (flags.stop) {
          break;
        }
        if (!flags.skip && level < options.maxLevel) {
          walkSync(extras.dirFile, options, level + 1);
        }
      }
    }
  } catch (err) {
    if (options.rethrowError) {
      throw err;
    }
  }

  return getResult(options);
}

const asyncReaddir = Util.promisify(Fs.readdir);
const asyncLStat = Util.promisify(Fs.lstat);

/**
 * async version of dir walk
 *
 * @param path
 * @param options
 * @param level
 * @returns
 */
async function walk(path: string, options: InternalOpts, level = 0) {
  try {
    const dir = options._join2(options.dir, path);
    let files: (string | Dirent)[] = await asyncReaddir(dir, options.readdirOpts);

    if (options.sortFiles) {
      if (options.fullStat) {
        files = files.sort();
      } else {
        files = (files as Dirent[]).sort(direntCmp);
      }
    }

    const dirs = [];
    let stop = false;

    // process files first
    for (let ix = 0; !stop && ix < files.length; ix++) {
      const file = files[ix];
      let extras;

      if (options.fullStat) {
        const fullFile = options._join2(dir, file as string);
        const stat = await asyncLStat(fullFile);
        extras = makeExtrasData(file as string, fullFile, path, stat, options);
      } else {
        const fullFile = options._join2(dir, (file as Dirent).name);
        extras = makeExtrasData((file as Dirent).name, fullFile, path, file as Dirent, options);
      }

      if (extras.stat.isDirectory()) {
        dirs.push(extras);
      } else {
        stop = processFile(options, extras);
      }
    }

    // now process dirs
    if (!stop && dirs.length > 0) {
      let promises = [];

      for (let ix = 0; ix < dirs.length; ix++) {
        const extras = dirs[ix];
        const flags = processDir(options, extras);
        if (flags.stop) {
          break;
        }
        if (!flags.skip && level < options.maxLevel) {
          const walkP = walk(extras.dirFile, options, level + 1);
          if (options.concurrency > 1) {
            if (options._concurrentCount < options.concurrency) {
              options._concurrentCount++;
              promises.push(walkP);
            } else if (promises.length) {
              await Promise.all(promises);
              options._concurrentCount -= promises.length;
              promises = [walkP];
              options._concurrentCount++;
            } else {
              await walkP;
            }
          } else {
            await walkP;
          }
        }
      }

      if (promises.length) {
        await Promise.all(promises);
        options._concurrentCount -= promises.length;
        promises = [];
      }
    }
  } catch (err) {
    if (options.rethrowError) {
      throw err;
    }
  }

  return getResult(options);
}

/**
 * make a copy of the user's options with proper defaults
 *
 * @param opts
 * @returns
 */
function makeOptions(opts: string | Options): InternalOpts {
  const options = typeof opts === "string" ? { cwd: opts } : opts;

  const sep = options.pathSep || Path.posix.sep;

  let cwd = options.cwd || (options as any).dir || process.cwd();
  if (!options.hasOwnProperty("pathSep") && cwd.includes("\\")) {
    cwd = cwd.replace(/\\/g, "/");
  }

  const cleanExt = (ext: string) => {
    if (!ext) {
      return ext;
    }
    if (ext.startsWith("*.")) {
      return ext.substring(1);
    }
    if (!ext.startsWith(".")) {
      return `.${ext}`;
    }
    return ext;
  };

  // `includeRoot` was renamed to `prependCwd`, this avoid breaking code still using that
  const prependCwd =
    (options.hasOwnProperty("includeRoot") ? (options as any).includeRoot : options.prependCwd) ||
    false;

  // a simple and faster version of path.join that handles just 2
  // arguments using posix separator
  const _join2 = (a: string, b: string) => (a && b ? a + sep + b : a || b);

  const opts2: InternalOpts = Object.assign(
    {
      _join2,
      maxLevel: Infinity,
      prefix: "",
      prependCwd,
      fullStat: true,
      concurrency: 50,
      readdirOpts: undefined,
      grouping: undefined,
    },
    options,
    {
      dir: cwd,
      result: {},
      ignoreExt: []
        .concat(options.ignoreExt)
        .map(cleanExt)
        .filter((x) => x),
      filterExt: []
        .concat(options.filterExt)
        .map(cleanExt)
        .filter((x) => x),
      _concurrentCount: 0,
    }
  );

  if (!opts2.fullStat) {
    opts2.readdirOpts = { withFileTypes: true };
  }

  return opts2;
}

/**
 * async version of filter scan dir
 * @param options
 * @returns
 */
export function filterScanDir(options?: string): Promise<string[]>;
export function filterScanDir(options?: Options): Promise<string[]>;
export function filterScanDir(options?: GroupingOptions): Promise<GroupingResult>;
export function filterScanDir(options: string | Options = {}): Promise<string[] | GroupingResult> {
  const options2 = makeOptions(options);
  return walk(options2.prefix, options2);
}

/** sync version of filter scan dir */
export function filterScanDirSync(options?: string): string[];
export function filterScanDirSync(options?: Options): string[];
export function filterScanDirSync(options?: GroupingOptions): GroupingResult;
export function filterScanDirSync(options: string | Options = {}): string[] | GroupingResult {
  const options2 = makeOptions(options);
  return walkSync(options2.prefix, options2);
}
