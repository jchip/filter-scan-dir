"use strict";

/* eslint-disable max-statements, complexity */

const Fs = require("fs");
const Path = require("path");
const Util = require("util");

function process(file, options, extras) {
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

  const add = result => {
    const group =
      (options.grouping && typeof result === "string"
        ? result
        : result && result.group) || "files";

    if (!options.result[group]) {
      options.result[group] = [];
    }

    options.result[group].push(options.includeRoot ? extras.fullFile : dirFile);
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
    const files = Fs.readdirSync(dir);

    for (const file of files) {
      const fullFile = options._path.join(dir, file);
      const stat = Fs.statSync(fullFile);
      const result = process(file, options, { path, stat, fullFile });

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
    // console.log(err);
  }

  return getResult(options);
}

const asyncReaddir = Util.promisify(Fs.readdir);
const asyncStat = Util.promisify(Fs.stat);

async function walk(path, options, level = 0) {
  try {
    const dir = options._path.join(options.dir, path);
    const files = await asyncReaddir(dir);

    for (const file of files) {
      const fullFile = options._path.join(dir, file);
      const stat = await asyncStat(fullFile);
      const result = process(file, options, { path, stat, fullFile });

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
    // console.log(err);
  }

  return getResult(options);
}

function makeOptions(options) {
  let dir = typeof options === "string" ? options : options.dir;

  if (!options._path && dir.indexOf("\\") >= 0) {
    dir = dir.replace(/\\/g, "/");
  }

  const cleanExt = ext => {
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

  return Object.assign({ _path: Path.posix, maxLevel: Infinity }, options, {
    dir,
    result: {},
    ignoreExt: []
      .concat(options.ignoreExt)
      .map(cleanExt)
      .filter(x => x),
    filterExt: []
      .concat(options.filterExt)
      .map(cleanExt)
      .filter(x => x)
  });
}

function filterScanDir(options) {
  return walk("", makeOptions(options));
}

filterScanDir.sync = function filterScanDirSync(options) {
  return walkSync("", makeOptions(options));
};

module.exports = filterScanDir;
