import Path from "path";
import { filterScanDir, filterScanDirSync } from "../../src";
import { expect } from "chai";
import { asyncVerify, runFinally } from "run-verify";

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
      ];
      const filter = (file, path) => {
        return file === "fixture-1" || path.startsWith("fixture-1");
      };
      const files1 = filterScanDirSync({
        cwd: "test",
        filter,
        filterDir: filter,
      });
      expect(files1).to.deep.equal(expectFiles);
    });

    it("should handle passing no options", async () => {
      const save = process.cwd();

      return asyncVerify(
        () => {
          const files1 = filterScanDirSync("test/fixture-1");
          process.chdir("test/fixture-1");

          const files2 = filterScanDirSync();
          expect(files2).to.deep.equal(files1);
        },
        runFinally(() => process.chdir(save))
      );
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
      const files1 = filterScanDirSync({
        cwd: process.cwd(),
        prefix: "test/fixture-1",
      });
      expect(files1).to.deep.equal(expectFiles);
      const files2 = filterScanDirSync({ prefix: "test/fixture-1" });
      expect(files2).to.deep.equal(expectFiles);
    });

    it("should scan all up to maxLevel", () => {
      const expectFiles = ["a.js", "a.json", "c.js"];
      const files2 = filterScanDirSync({ cwd: "test/fixture-1", maxLevel: 0 });
      expect(files2).to.deep.equal(expectFiles);
    });

    it("should async scan all up to maxLevel", async () => {
      const expectFiles = ["a.js", "a.json", "c.js"];
      const files2 = await filterScanDir({ cwd: "test/fixture-1", maxLevel: 0 });
      expect(files2).to.deep.equal(expectFiles);
    });

    it("should return empty [] when no files found", () => {
      const files2 = filterScanDirSync({ cwd: "test", filter: () => false });
      expect(files2).to.deep.equal([]);
    });

    it("should convert \\ in dir to /", () => {
      const files = filterScanDirSync({
        cwd: "test\\fixture-2",
        prependCwd: true,
        filter: () => true,
      });
      expect(files).to.deep.equal([
        "test/fixture-2/bar.js",
        "test/fixture-2/blah.txt",
        "test/fixture-2/foo.js",
      ]);
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
      const files = filterScanDirSync({
        cwd: "test/fixture-1",
        includeDir: true,
        prependCwd: true,
      });
      expect(files).to.deep.equal(expectFiles);
    });

    it("should handle fullStat false", () => {
      const expectFiles = [
        "test/fixture-1/a.js",
        "test/fixture-1/a.json",
        "test/fixture-1/c.js",
        "test/fixture-1/dir1",
        "test/fixture-1/dir1/b.blah",
        "test/fixture-1/dir1/b.js",
        "test/fixture-1/dir1/d.json",
      ];
      const files = filterScanDirSync({
        cwd: "test/fixture-1",
        includeDir: true,
        prependCwd: true,
        fullStat: false,
      });
      expect(files).to.deep.equal(expectFiles);
    });

    it("should handle fullStat false with sortFiles", () => {
      const expectFiles = [
        "test/fixture-1/a.js",
        "test/fixture-1/a.json",
        "test/fixture-1/c.js",
        "test/fixture-1/dir1",
        "test/fixture-1/dir1/b.blah",
        "test/fixture-1/dir1/b.js",
        "test/fixture-1/dir1/d.json",
      ];
      const files = filterScanDirSync({
        cwd: "test/fixture-1",
        includeDir: true,
        prependCwd: true,
        fullStat: false,
        sortFiles: true,
      });
      expect(files).to.deep.equal(expectFiles);
    });

    it("should ignore and filter exts", () => {
      const files = filterScanDirSync({
        cwd: "test",
        includeDir: true,
        ignoreExt: [".opts"],
        filterExt: ["*.json"],
      });
      expect(files).to.deep.equal([
        "fixture-1",
        "fixture-1/a.json",
        "fixture-1/dir1",
        "fixture-1/dir1/d.json",
        "fixture-2",
        "spec",
      ]);
    });

    it("should skip file if filter return false", async () => {
      const files = await filterScanDir({
        cwd: "test/fixture-1",
        filter: (f) => {
          if (f === "a.json") {
            return true;
          }
          return { skip: true };
        },
      });
      expect(files).to.deep.equal(["a.json"]);
    });

    it("should skip dir if filterDir return false", () => {
      const files = filterScanDirSync({
        cwd: "test/fixture-1",
        filterDir: () => false,
      });
      expect(files).to.deep.equal(["a.js", "a.json", "c.js"]);
    });

    it("should recuse dir if filterDir return true", () => {
      const files = filterScanDirSync({
        cwd: "test/fixture-1",
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
      const files = filterScanDirSync({
        cwd: "test",
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
        "fixture-2/bar.js",
        "fixture-2/blah.txt",
        "fixture-2/foo.js",
      ]);
    });

    it("should filter files through filter callback", () => {
      const files = filterScanDirSync({
        cwd: "test/fixture-1",
        filter: (file) => file !== "a.json",
      });
      expect(files).to.deep.equal(["a.js", "c.js", "dir1/b.blah", "dir1/b.js", "dir1/d.json"]);
    });

    it("should filter files by noExt", () => {
      const files = filterScanDirSync({
        cwd: "test/fixture-1",
        filter: (file, path, e) => e.noExt !== "b",
      });
      expect(files).to.deep.equal(["a.js", "a.json", "c.js", "dir1/d.json"]);
    });

    it("should group entries if filter return string", () => {
      const files = filterScanDirSync({
        cwd: "test/fixture-1",
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
        filterScanDirSync({
          cwd: "blah-blah",
        })
      ).to.deep.equal([]);
    });

    it("should rethrow errors", () => {
      expect(() => {
        return filterScanDirSync({
          cwd: "blah-blah",
          rethrowError: true,
        });
      }).to.throw("no such file or directory");
    });
  });

  describe("async", function () {
    it("should scan all files", async () => {
      const expectFiles = ["a.js", "a.json", "c.js", "dir1/b.blah", "dir1/b.js", "dir1/d.json"];
      const files1 = await filterScanDir("test/fixture-1");

      expect(files1).to.deep.equal(expectFiles);
      const files2 = await filterScanDir({ cwd: "test/fixture-1" });
      expect(files2).to.deep.equal(expectFiles);
    });

    it("should handle passing no options", async () => {
      const save = process.cwd();

      return asyncVerify(
        async () => {
          const files1 = await filterScanDir("test/fixture-1");
          process.chdir("test/fixture-1");

          const files2 = await filterScanDir();
          expect(files2).to.deep.equal(files1);
        },
        runFinally(() => process.chdir(save))
      );
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
      const files2 = await filterScanDir({ cwd: "test", prefix: "fixture-1" });
      expect(files2).to.deep.equal(expectFiles);
    });

    it("should support concurrency 1", async () => {
      const files1 = await filterScanDir({ cwd: "test", sortFiles: true });
      const files2 = await filterScanDir({ cwd: "test", concurrency: 1, sortFiles: true });
      expect((files2 as string[]).sort()).to.deep.equal((files1 as string[]).sort());
    });

    it("should support concurrency 2", async () => {
      const files1 = await filterScanDir("test");
      const files2 = await filterScanDir({ cwd: "test", concurrency: 2 });
      expect((files2 as string[]).sort()).to.deep.equal((files1 as string[]).sort());
    });

    it("should stop scanning when filter return stop flag", async () => {
      const files = await filterScanDir({
        cwd: "test/fixture-1",
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
        cwd: "test/fixture-1",
        includeDir: true,
        prependCwd: true,
      });
      expect(files).to.deep.equal(expectFiles);
    });

    it("should handle fullStat false", async () => {
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
        cwd: "test/fixture-1",
        includeDir: true,
        prependCwd: true,
        fullStat: false,
      });
      expect(files).to.deep.equal(expectFiles);
    });

    it("should handle fullStat false and sortFiles", async () => {
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
        cwd: "test/fixture-1",
        includeDir: true,
        includeRoot: true, // test legacy option
        fullStat: false,
        sortFiles: true,
      } as any);
      expect(files).to.deep.equal(expectFiles);
    });

    it("should use formatName in result", async () => {
      const expectFiles = [
        "blah-a.js-10",
        "blah-a.json-3",
        "blah-c.js-15",
        "blah-dir1-dir",
        "blah-dir1/b.blah-0",
        "blah-dir1/b.js-0",
        "blah-dir1/d.json-0",
      ];

      const filterDir = (file, path, extras) => {
        return { formatName: `blah-${extras.dirFile}-dir` };
      };
      const filter = (file, path, extras) => {
        return {
          formatName: `blah-${extras.dirFile}-${extras.stat.size}`,
        };
      };

      const files = await filterScanDir({
        cwd: "test/fixture-1",
        filter,
        filterDir,
        sortFiles: true,
        includeDir: true,
      });
      expect(files).to.deep.equal(expectFiles);
    });

    it("sync version should use formatName in result", async () => {
      const expectFiles = [
        "blah-a.js-10",
        "blah-a.json-3",
        "blah-c.js-15",
        "blah-dir1-dir",
        "blah-dir1/b.blah-0",
        "blah-dir1/b.js-0",
        "blah-dir1/d.json-0",
      ];

      const filterDir = (file, path, extras) => {
        return { formatName: `blah-${extras.dirFile}-dir` };
      };
      const filter = (file, path, extras) => {
        return {
          formatName: `blah-${extras.dirFile}-${extras.stat.size}`,
        };
      };

      const files = filterScanDirSync({
        cwd: "test/fixture-1",
        filter,
        filterDir,
        sortFiles: true,
        includeDir: true,
      });
      expect(files).to.deep.equal(expectFiles);
    });

    it("should ignore and filter exts", async () => {
      const files = await filterScanDir({
        cwd: "test/fixture-1",
        includeDir: true,
        ignoreExt: ["blah"],
        filterExt: ["js", "*.json"],
      });

      expect(files).to.deep.equal(["a.js", "a.json", "c.js", "dir1", "dir1/b.js", "dir1/d.json"]);
    });

    it("should returns only files match filterExt as a string", async () => {
      const files = await filterScanDir({
        cwd: "test/fixture-1",
        ignoreExt: ".blah",
        filterExt: ".json",
      });
      expect(files).to.deep.equal(["a.json", "dir1/d.json"]);
    });

    it("should group directories", async () => {
      const files = await filterScanDir({
        cwd: "test/fixture-1",
        includeDir: true,
        grouping: true,
        filterDir: () => "dir",
        rethrowError: true,
      });
      expect(files).to.deep.equal({
        files: ["a.js", "a.json", "c.js", "dir1/b.blah", "dir1/b.js", "dir1/d.json"],
        dir: ["dir1"],
      });
    });

    it("should group entries if filter return string", async () => {
      const files = await filterScanDir({
        cwd: "test/fixture-1",
        grouping: true,
        filter: (f, p, extras) => (extras.noExt === "b" ? "files" : extras.noExt),
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
          cwd: "blah-blah",
        })
      ).to.deep.equal([]);
    });

    it("should rethrow errors", async () => {
      let err;
      try {
        await filterScanDir({
          cwd: "blah-blah",
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
