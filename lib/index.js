"use strict";

/* eslint-disable max-statements, complexity */

const Fs = require("fs");
const Path = require("path");
const Util = require("util");

function process(file, options, extras) {
  const dirFile = options._path.join(extras.path, file);

  const ix = file.lastIndexOf(".");

  if (ix > 0) {
    extras.ext = file.substr(ix);
    extras.noExt = file.substring(0, ix);
  } else {
    extras.ext = "";
    extras.noExt = file;
  }

  extras.dirFile = dirFile;

  const add = group => {
    if (!options.grouping || typeof group !== "string") {
      group = "files";
    }

    if (!options.result[group]) {
      options.result[group] = [];
    }

    options.result[group].push(options.includeRoot ? extras.fullFile : dirFile);
  };

  if (extras.stat.isDirectory()) {
    let group;

    if (options.filterDir) {
      group = options.filterDir(file, extras.path, extras);
      if (!group) return false;
    } else {
      group = "files";
    }

    if (options.includeDir) {
      add(group);
    }

    return dirFile;
  } else {
    if (options.ignoreExt && options.ignoreExt.indexOf(extras.ext) >= 0) return false;
    if (options.filterExt && options.filterExt.indexOf(extras.ext) < 0) return false;

    let group;

    if (options.filter) {
      group = options.filter(file, extras.path, extras);
      if (!group) return false;
    } else {
      group = "files";
    }

    add(group);
  }

  return false;
}

function getResult(options) {
  return options.grouping
    ? Object.assign({ files: [] }, options.result)
    : options.result.files || [];
}

function walkSync(path, options, level = 0) {
  const files = Fs.readdirSync(Path.join(options.dir, path));

  for (const file of files) {
    const fullFile = Path.join(options.dir, path, file);
    const stat = Fs.statSync(fullFile);
    const dirFile = process(file, options, { path, stat, fullFile });
    if (dirFile && level < options.maxLevel) {
      walkSync(dirFile, options, level + 1);
    }
  }

  return getResult(options);
}

const asyncReaddir = Util.promisify(Fs.readdir);
const asyncStat = Util.promisify(Fs.stat);

async function walk(path, options, level = 0) {
  const files = await asyncReaddir(Path.join(options.dir, path));

  for (const file of files) {
    const fullFile = Path.join(options.dir, path, file);
    const stat = await asyncStat(fullFile);
    const dirFile = process(file, options, { path, stat, fullFile });
    if (dirFile && level < options.maxLevel) {
      await walkSync(dirFile, options, level + 1);
    }
  }

  return getResult(options);
}

function makeOptions(options) {
  if (typeof options === "string") options = { dir: options };
  return Object.assign({ maxLevel: Infinity }, options, {
    result: {},
    _path: Path
  });
}

function filterScanDir(options) {
  return walk("", makeOptions(options));
}

filterScanDir.sync = function filterScanDirSync(options) {
  return walkSync("", makeOptions(options));
};

module.exports = filterScanDir;
