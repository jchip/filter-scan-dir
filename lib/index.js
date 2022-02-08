const fsd = require("../dist/filter-scan-dir");

const asyncApi = (options) => fsd.filterScanDir(options);
Object.defineProperties(asyncApi, {
  sync: { value: fsd.filterScanDirSync },
  filterScanDir: { value: fsd.filterScanDir },
  filterScanDirSync: { value: fsd.filterScanDirSync },
});
module.exports = asyncApi;
