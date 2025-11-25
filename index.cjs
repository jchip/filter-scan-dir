"use strict";

const x = require("./dist-cjs/index.cjs");

function filterScanDir(...args) {
  return x.filterScanDir(...args);
}

module.exports = filterScanDir;

filterScanDir.filterScanDir = x.filterScanDir;
filterScanDir.filterScanDirSync = x.filterScanDirSync;
