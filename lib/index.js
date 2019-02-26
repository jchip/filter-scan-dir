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

  if (extras.stat.isDirectory()) {
    if (options.filterDir && !options.filterDir(file, extras.path, extras)) return false;
    if (options.includeDir) {
      options.result.push(dirFile);
    }
    return dirFile;
  } else {
    if (options.ignoreExt && options.ignoreExt.indexOf(extras.ext) >= 0) return false;
    if (options.filterExt && options.filterExt.indexOf(extras.ext) < 0) return false;
    if (options.filter && !options.filter(file, extras.path, extras)) return false;
    options.result.push(dirFile);
  }

  return false;
}

function walkSync(path, options) {
  const files = Fs.readdirSync(Path.join(options.dir, path));

  for (const file of files) {
    const fullFile = Path.join(options.dir, path, file);
    const stat = Fs.statSync(fullFile);
    const dirFile = process(file, options, { path, stat });
    if (dirFile) {
      walkSync(dirFile, options);
    }
  }

  return options.result;
}

const asyncReaddir = Util.promisify(Fs.readdir);
const asyncStat = Util.promisify(Fs.stat);

async function walk(path, options) {
  const files = await asyncReaddir(Path.join(options.dir, path));

  for (const file of files) {
    const fullFile = Path.join(options.dir, path, file);
    const stat = await asyncStat(fullFile);
    const dirFile = process(file, options, { path, stat, fullFile });
    if (dirFile) {
      await walkSync(dirFile, options);
    }
  }

  return options.result;
}

function filterScanDir(options) {
  if (typeof options === "string") options = { dir: options };
  return walk("", Object.assign({}, options, { result: [], _path: Path }));
}

filterScanDir.sync = function filterScanDirSync(options) {
  if (typeof options === "string") options = { dir: options };
  return walkSync("", Object.assign({}, options, { result: [], _path: Path }));
};

module.exports = filterScanDir;
