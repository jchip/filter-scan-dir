"use strict";

const filterScanDir = require("../..");

describe("filter-scan-dir", function() {
  describe("sync", function() {
    it("should scan all files", () => {
      const expectFiles = ["mocha.opts", "spec/index.spec.js"];
      const files1 = filterScanDir.sync("test");
      expect(files1).to.deep.equal(expectFiles);
      const files2 = filterScanDir.sync({ dir: "test" });
      expect(files2).to.deep.equal(expectFiles);
    });

    it("should ignore and filter exts", () => {
      const files = filterScanDir.sync({
        dir: "test",
        includeDir: true,
        ignoreExt: [".opts"],
        filterExt: []
      });
      expect(files).to.deep.equal(["spec"]);
    });

    it("should filterDir", () => {
      const files = filterScanDir.sync({
        dir: "test",
        filterDir: () => false
      });
      expect(files).to.deep.equal(["mocha.opts"]);
    });

    it("should filter files", () => {
      const files = filterScanDir.sync({
        dir: "test",
        filter: file => file !== "mocha.opts"
      });
      expect(files).to.deep.equal(["spec/index.spec.js"]);
    });

    it("should filter files by noExt", () => {
      const files = filterScanDir.sync({
        dir: "test",
        filter: (file, path, e) => e.noExt !== "mocha"
      });
      expect(files).to.deep.equal(["spec/index.spec.js"]);
    });
  });

  describe("async", function() {
    it("should scan all files", async () => {
      const expectFiles = ["mocha.opts", "spec/index.spec.js"];
      const files1 = await filterScanDir("test");
      expect(files1).to.deep.equal(expectFiles);
      const files2 = await filterScanDir({ dir: "test" });
      expect(files2).to.deep.equal(expectFiles);
    });
  });
});
