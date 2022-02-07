"use strict";

/* eslint-disable max-statements, complexity, comma-dangle, max-params */

const Fs = require("fs");
const Path = require("path");
const Util = require("util");

function makeExtrasData(file, fullFile, path, stat, options) {
  const dirFile = options._path.join(path, file);
  const ix = file.lastIndexOf(".");

  if (ix > 0) {
    return {
      file,
      path,
      stat,
      fullFile,
      dirFile,
      ext: file.substr(ix),
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

function addResult(result, options, extras) {
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
      options.prependCwd ? extras.fullFile : extras.dirFile
    );
  }
}

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

function processFile(options, extras) {
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

  const filterResult = options.filter
    ? options.filter(extras.file, extras.path, extras)
    : true; // default to include

  if (filterResult) {
    if (filterResult.skip !== true) {
      addResult(filterResult, options, extras);
    }
    return filterResult.stop;
  }

  return false;
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

    const dirs = [];
    let stop = false;

    // process files first
    for (let ix = 0; !stop && ix < files.length; ix++) {
      const file = files[ix];
      const fullFile = options._path.join(dir, file);
      const stat = Fs.lstatSync(fullFile);

      const extras = makeExtrasData(file, fullFile, path, stat, options);

      if (stat.isDirectory()) {
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

async function walk(path, options, level = 0) {
  try {
    const dir = options._path.join(options.dir, path);
    let files = await asyncReaddir(dir);

    if (options.sortFiles) {
      files = files.sort();
    }

    const dirs = [];
    let stop = false;

    // process files first
    for (let ix = 0; !stop && ix < files.length; ix++) {
      const file = files[ix];
      const fullFile = options._path.join(dir, file);

      const stat = await asyncLStat(fullFile);
      const extras = makeExtrasData(file, fullFile, path, stat, options);
      if (stat.isDirectory()) {
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
          await walk(extras.dirFile, options, level + 1);
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
