"use strict";

/* eslint-disable max-statements, complexity, comma-dangle */

const Fs = require("fs");
const Path = require("path");
const Util = require("util");

function processFile(file, options, extras) {
  let dirFile = options._path.join(extras.path, file);

  const ix = file.lastIndexOf(".");

  if (ix > 0) {
    extras.ext = file.substr(ix);
    extras.noExt = file.substring(0, ix);
  } else {
    extras.ext = "";
    extras.noExt = file;
  }

  extras.dirFile = dirFile;

  const add = (result) => {
    const group =
      (options.grouping && typeof result === "string"
        ? result
        : result && result.group) || "files";

    if (!options.result[group]) {
      options.result[group] = [];
    }

    if (result.formatName !== undefined) {
      options.result[group].push(result.formatName);
    } else {
      options.result[group].push(
        options.prependCwd ? extras.fullFile : dirFile
      );
    }
  };

  let filterResult;

  if (extras.stat.isDirectory()) {
    if (options.filterDir) {
      filterResult = options.filterDir(file, extras.path, extras);
    } else {
      filterResult = true;
    }

    if (filterResult && filterResult.skip !== true) {
      if (options.includeDir) {
        add(filterResult);
      }
    } else {
      dirFile = undefined;
    }
  } else {
    if (
      options.ignoreExt.length > 0 &&
      options.ignoreExt.indexOf(extras.ext) >= 0
    ) {
      return false;
    }
    if (
      options.filterExt.length > 0 &&
      options.filterExt.indexOf(extras.ext) < 0
    ) {
      return false;
    }

    if (options.filter) {
      filterResult = options.filter(file, extras.path, extras);
    } else {
      filterResult = true;
    }

    if (filterResult && filterResult.skip !== true) {
      add(filterResult);
    }

    dirFile = undefined;
  }

  return { dirFile, stop: filterResult && filterResult.stop };
}

function getResult(options) {
  return options.grouping
    ? Object.assign({ files: [] }, options.result)
    : options.result.files || [];
}

function walkSync(path, options, level = 0) {
  try {
    const dir = options._path.join(options.dir, path);
    let files = Fs.readdirSync(dir);

    if (options.sortFiles) {
      files = files.sort();
    }

    for (const file of files) {
      const fullFile = options._path.join(dir, file);
      const stat = Fs.statSync(fullFile);
      const result = processFile(file, options, { path, stat, fullFile });

      if (result) {
        if (result.stop) {
          break;
        }

        if (result.dirFile && level < options.maxLevel) {
          walkSync(result.dirFile, options, level + 1);
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
const asyncStat = Util.promisify(Fs.stat);

async function walk(path, options, level = 0) {
  try {
    const dir = options._path.join(options.dir, path);
    let files = await asyncReaddir(dir);

    if (options.sortFiles) {
      files = files.sort();
    }

    for (const file of files) {
      const fullFile = options._path.join(dir, file);
      const stat = await asyncStat(fullFile);
      const result = processFile(file, options, { path, stat, fullFile });

      if (result) {
        if (result.stop) {
          break;
        }

        if (result.dirFile && level < options.maxLevel) {
          await walk(result.dirFile, options, level + 1);
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

function makeOptions(options) {
  let cwd =
    (typeof options === "string" ? options : options.cwd || options.dir) ||
    process.cwd();

  if (!options._path && cwd.indexOf("\\") >= 0) {
    cwd = cwd.replace(/\\/g, "/");
  }

  const cleanExt = (ext) => {
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

  const prependCwd =
    (options.hasOwnProperty("includeRoot")
      ? options.includeRoot
      : options.prependCwd) || false;

  return Object.assign(
    { _path: Path.posix, maxLevel: Infinity, prefix: "", prependCwd },
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
    }
  );
}

function filterScanDir(options) {
  const options2 = makeOptions(options);
  return walk(options2.prefix, options2);
}

filterScanDir.sync = function filterScanDirSync(options) {
  const options2 = makeOptions(options);
  return walkSync(options2.prefix, options2);
};

module.exports = filterScanDir;
