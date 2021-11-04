"use strict";

/* eslint-disable comma-dangle */

const Path = require("path");
const filterScanDir = require("../..");

describe("filter-scan-dir", function () {
  describe("sync", function () {
    it("should scan all files", () => {
      const expectFiles = [
        "fixture-1/a.js",
        "fixture-1/a.json",
        "fixture-1/c.js",
        "fixture-1/dir1/b.blah",
        "fixture-1/dir1/b.js",
        "fixture-1/dir1/d.json",
        "mocha.opts",
        "spec/index.spec.js",
      ];
      const files1 = filterScanDir.sync("test");
      expect(files1).to.deep.equal(expectFiles);
      const files2 = filterScanDir.sync({ dir: "test" });
      expect(files2).to.deep.equal(expectFiles);
    });

    it("should scan all files with prefix", () => {
      const expectFiles = [
        "test/fixture-1/a.js",
        "test/fixture-1/a.json",
        "test/fixture-1/c.js",
        "test/fixture-1/dir1/b.blah",
        "test/fixture-1/dir1/b.js",
        "test/fixture-1/dir1/d.json",
      ];
      const files1 = filterScanDir.sync({
        cwd: process.cwd(),
        prefix: "test/fixture-1",
      });
      expect(files1).to.deep.equal(expectFiles);
      const files2 = filterScanDir.sync({ prefix: "test/fixture-1" });
      expect(files2).to.deep.equal(expectFiles);
    });

    it("should scan all up to maxLevel", () => {
      const expectFiles = ["mocha.opts"];
      const files2 = filterScanDir.sync({ dir: "test", maxLevel: 0 });
      expect(files2).to.deep.equal(expectFiles);
    });

    it("should return empty [] when no files found", () => {
      const files2 = filterScanDir.sync({ dir: "test", filter: () => false });
      expect(files2).to.deep.equal([]);
    });

    it("should convert \\ in dir to /", () => {
      const files = filterScanDir.sync({
        dir: "test\\spec",
        includeRoot: true,
        filter: () => true,
      });
      expect(files).to.deep.equal(["test/spec/index.spec.js"]);
    });

    it("should scan all files and include root", () => {
      const expectFiles = [
        "test/fixture-1/a.js",
        "test/fixture-1/a.json",
        "test/fixture-1/c.js",
        "test/fixture-1/dir1",
        "test/fixture-1/dir1/b.blah",
        "test/fixture-1/dir1/b.js",
        "test/fixture-1/dir1/d.json",
      ];
      const files = filterScanDir.sync({
        dir: "test/fixture-1",
        includeDir: true,
        includeRoot: true,
      });
      expect(files).to.deep.equal(expectFiles);
    });

    it("should ignore and filter exts", () => {
      const files = filterScanDir.sync({
        dir: "test",
        includeDir: true,
        ignoreExt: [".opts"],
        filterExt: ["*.json"],
      });
      expect(files).to.deep.equal([
        "fixture-1",
        "fixture-1/a.json",
        "fixture-1/dir1",
        "fixture-1/dir1/d.json",
        "spec",
      ]);
    });

    it("should skip dir if filterDir return false", () => {
      const files = filterScanDir.sync({
        dir: "test",
        filterDir: () => false,
      });
      expect(files).to.deep.equal(["mocha.opts"]);
    });

    it("should recuse dir if filterDir return true", () => {
      const files = filterScanDir.sync({
        dir: "test/fixture-1",
        filterDir: () => true,
      });
      expect(files).to.deep.equal([
        "a.js",
        "a.json",
        "c.js",
        "dir1/b.blah",
        "dir1/b.js",
        "dir1/d.json",
      ]);
    });

    it("should stop scanning when filter callback return stop true", () => {
      const files = filterScanDir.sync({
        dir: "test",
        filterDir: (dir) => {
          return {
            stop: dir === "spec",
          };
        },
      });
      expect(files).to.deep.equal([
        "fixture-1/a.js",
        "fixture-1/a.json",
        "fixture-1/c.js",
        "fixture-1/dir1/b.blah",
        "fixture-1/dir1/b.js",
        "fixture-1/dir1/d.json",
        "mocha.opts",
      ]);
    });

    it("should filter files through filter callback", () => {
      const files = filterScanDir.sync({
        dir: "test/fixture-1",
        filter: (file) => file !== "a.json",
      });
      expect(files).to.deep.equal([
        "a.js",
        "c.js",
        "dir1/b.blah",
        "dir1/b.js",
        "dir1/d.json",
      ]);
    });

    it("should filter files by noExt", () => {
      const files = filterScanDir.sync({
        dir: "test/fixture-1",
        filter: (file, path, e) => e.noExt !== "b",
      });
      expect(files).to.deep.equal(["a.js", "a.json", "c.js", "dir1/d.json"]);
    });

    it("should group entries if filter return string", () => {
      const files = filterScanDir.sync({
        dir: "test/fixture-1",
        grouping: true,
        filter: (f, p, extras) => (extras.noExt === "b" ? true : extras.noExt),
      });
      expect(files).to.deep.equal({
        files: ["dir1/b.blah", "dir1/b.js"],
        a: ["a.js", "a.json"],
        c: ["c.js"],
        d: ["dir1/d.json"],
      });
    });

    it("should ignore errors if no rethrow", () => {
      expect(
        filterScanDir.sync({
          dir: "blah-blah",
        })
      ).to.deep.equal([]);
    });

    it("should rethrow errors", () => {
      expect(() => {
        return filterScanDir.sync({
          dir: "blah-blah",
          rethrowError: true,
        });
      }).to.throw("no such file or directory");
    });
  });

  describe("async", function () {
    it("should scan all files", async () => {
      const expectFiles = [
        "a.js",
        "a.json",
        "c.js",
        "dir1/b.blah",
        "dir1/b.js",
        "dir1/d.json",
      ];
      const files1 = await filterScanDir("test/fixture-1");

      expect(files1).to.deep.equal(expectFiles);
      const files2 = await filterScanDir({ dir: "test/fixture-1" });
      expect(files2).to.deep.equal(expectFiles);
    });

    it("should scan all files with prefix", async () => {
      const expectFiles = [
        "fixture-1/a.js",
        "fixture-1/a.json",
        "fixture-1/c.js",
        "fixture-1/dir1/b.blah",
        "fixture-1/dir1/b.js",
        "fixture-1/dir1/d.json",
      ];
      const files1 = await filterScanDir({
        cwd: Path.resolve("test"),
        prefix: "fixture-1",
      });
      expect(files1).to.deep.equal(expectFiles);
      const files2 = await filterScanDir({ dir: "test", prefix: "fixture-1" });
      expect(files2).to.deep.equal(expectFiles);
    });

    it("should stop scanning when filter return stop flag", async () => {
      const files = await filterScanDir({
        dir: "test/fixture-1",
        filterDir: (dir) => {
          return { stop: dir === "dir1" };
        },
      });
      expect(files).to.deep.equal(["a.js", "a.json", "c.js"]);
    });

    it("should scan all files and include root", async () => {
      const expectFiles = [
        "test/fixture-1/a.js",
        "test/fixture-1/a.json",
        "test/fixture-1/c.js",
        "test/fixture-1/dir1",
        "test/fixture-1/dir1/b.blah",
        "test/fixture-1/dir1/b.js",
        "test/fixture-1/dir1/d.json",
      ];
      const files = await filterScanDir({
        dir: "test/fixture-1",
        includeDir: true,
        includeRoot: true,
      });
      expect(files).to.deep.equal(expectFiles);
    });

    it("should use formatName in result", async () => {
      const expectFiles = [
        "blah-a.js-1635996305913.019-10",
        "blah-a.json-1635996314395.2065-3",
        "blah-c.js-1635996325259.463-15",
        "blah-dir1-1635995100304.094-160",
        "blah-dir1/b.blah-1635995100303.8376-0",
        "blah-dir1/b.js-1635995100303.9631-0",
        "blah-dir1/d.json-1635995100304.087-0",
      ];
      const filter = (file, path, extras) => {
        return {
          formatName: `blah-${extras.dirFile}-${extras.stat.mtimeMs}-${extras.stat.size}`,
        };
      };

      const files = await filterScanDir({
        dir: "test/fixture-1",
        filter,
        filterDir: filter,
        sortFiles: true,
        includeDir: true,
      });
      expect(files).to.deep.equal(expectFiles);
    });

    it("sync version should use formatName in result", async () => {
      const expectFiles = [
        "blah-a.js-1635996305913.019-10",
        "blah-a.json-1635996314395.2065-3",
        "blah-c.js-1635996325259.463-15",
        "blah-dir1-1635995100304.094-160",
        "blah-dir1/b.blah-1635995100303.8376-0",
        "blah-dir1/b.js-1635995100303.9631-0",
        "blah-dir1/d.json-1635995100304.087-0",
      ];
      const filter = (file, path, extras) => {
        return {
          formatName: `blah-${extras.dirFile}-${extras.stat.mtimeMs}-${extras.stat.size}`,
        };
      };

      const files = filterScanDir.sync({
        dir: "test/fixture-1",
        filter,
        filterDir: filter,
        sortFiles: true,
        includeDir: true,
      });
      expect(files).to.deep.equal(expectFiles);
    });

    it("should ignore and filter exts", async () => {
      const files = await filterScanDir({
        dir: "test/fixture-1",
        includeDir: true,
        ignoreExt: ["blah"],
        filterExt: ["js", "*.json"],
      });

      expect(files).to.deep.equal([
        "a.js",
        "a.json",
        "c.js",
        "dir1",
        "dir1/b.js",
        "dir1/d.json",
      ]);
    });

    it("should returns only files match filterExt as a string", async () => {
      const files = await filterScanDir({
        dir: "test/fixture-1",
        ignoreExt: ".blah",
        filterExt: ".json",
      });
      expect(files).to.deep.equal(["a.json", "dir1/d.json"]);
    });

    it("should group directories", async () => {
      const files = await filterScanDir({
        dir: "test/fixture-1",
        includeDir: true,
        grouping: true,
        filterDir: () => "dir",
      });
      expect(files).to.deep.equal({
        files: [
          "a.js",
          "a.json",
          "c.js",
          "dir1/b.blah",
          "dir1/b.js",
          "dir1/d.json",
        ],
        dir: ["dir1"],
      });
    });

    it("should group entries if filter return string", async () => {
      const files = await filterScanDir({
        dir: "test/fixture-1",
        grouping: true,
        filter: (f, p, extras) =>
          extras.noExt === "b" ? "files" : extras.noExt,
      });
      expect(files).to.deep.equal({
        files: ["dir1/b.blah", "dir1/b.js"],
        a: ["a.js", "a.json"],
        c: ["c.js"],
        d: ["dir1/d.json"],
      });
    });

    it("should ignore errors if no rethrow", async () => {
      expect(
        await filterScanDir({
          dir: "blah-blah",
        })
      ).to.deep.equal([]);
    });

    it("should rethrow errors", async () => {
      let err;
      try {
        await filterScanDir({
          dir: "blah-blah",
          rethrowError: true,
        });
      } catch (e) {
        err = e;
      }
      expect(err).to.be.an("Error");
      expect(err.message).contains("no such file or directory");
    });
  });
});
