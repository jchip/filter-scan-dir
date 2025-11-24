import Path from "path";
import { filterScanDir, filterScanDirSync } from "../../src/index.ts";
import { describe, it, expect } from "vitest";

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
      expect(files1).toEqual(expectFiles);
    });

    it("should handle passing no options", async () => {
      const save = process.cwd();

      try {
        const files1 = filterScanDirSync("test/fixture-1");
        process.chdir("test/fixture-1");

        const files2 = filterScanDirSync();
        expect(files2).toEqual(files1);
      } finally {
        process.chdir(save);
      }
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
      expect(files1).toEqual(expectFiles);
      const files2 = filterScanDirSync({ prefix: "test/fixture-1" });
      expect(files2).toEqual(expectFiles);
    });

    it("should scan all up to maxLevel", () => {
      const expectFiles = ["a.js", "a.json", "c.js"];
      const files2 = filterScanDirSync({ cwd: "test/fixture-1", maxLevel: 0 });
      expect(files2).toEqual(expectFiles);
    });

    it("should async scan all up to maxLevel", async () => {
      const expectFiles = ["a.js", "a.json", "c.js"];
      const files2 = await filterScanDir({ cwd: "test/fixture-1", maxLevel: 0 });
      expect(files2).toEqual(expectFiles);
    });

    it("should return empty [] when no files found", () => {
      const files2 = filterScanDirSync({ cwd: "test", filter: () => false });
      expect(files2).toEqual([]);
    });

    it("should convert \\ in dir to /", () => {
      const files = filterScanDirSync({
        cwd: "test\\fixture-2",
        prependCwd: true,
        filter: () => true,
      });
      expect(files).toEqual([
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
      expect(files).toEqual(expectFiles);
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
      expect(files).toEqual(expectFiles);
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
      expect(files).toEqual(expectFiles);
    });

    it("should ignore and filter exts", () => {
      const files = filterScanDirSync({
        cwd: "test",
        includeDir: true,
        ignoreExt: [".opts"],
        filterExt: ["*.json"],
        filterDir: (dir) => !dir.startsWith("fixture-symlink"), // Skip symlink fixture
      });
      expect(files).toEqual([
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
      expect(files).toEqual(["a.json"]);
    });

    it("should skip dir if filterDir return false", () => {
      const files = filterScanDirSync({
        cwd: "test/fixture-1",
        filterDir: () => false,
      });
      // call .sort to make TS verify that files is string[]
      expect(files.sort()).toEqual(["a.js", "a.json", "c.js"]);
    });

    it("should recuse dir if filterDir return true", () => {
      const files = filterScanDirSync({
        cwd: "test/fixture-1",
        filterDir: () => true,
      });
      expect(files).toEqual(["a.js", "a.json", "c.js", "dir1/b.blah", "dir1/b.js", "dir1/d.json"]);
    });

    it("should stop scanning when filter callback return stop true", () => {
      const files = filterScanDirSync({
        cwd: "test",
        filterDir: (dir) => {
          if (dir === "fixture-symlink") return { skip: true }; // Skip symlink fixture
          return {
            stop: dir === "spec",
          };
        },
      });
      expect(files).toEqual([
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
      expect(files).toEqual(["a.js", "c.js", "dir1/b.blah", "dir1/b.js", "dir1/d.json"]);
    });

    it("should filter files by noExt", () => {
      const files = filterScanDirSync({
        cwd: "test/fixture-1",
        filter: (file, path, e) => e.noExt !== "b",
      });
      expect(files).toEqual(["a.js", "a.json", "c.js", "dir1/d.json"]);
    });

    it("should group entries if filter return string", () => {
      const grouped = filterScanDirSync({
        cwd: "test/fixture-1",
        grouping: true,
        filter: (f, p, extras) => (extras.noExt === "b" ? true : extras.noExt),
      });
      const files = grouped.files.sort();
      expect(files).toEqual(["dir1/b.blah", "dir1/b.js"]);
      expect(grouped).toEqual({
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
        }),
      ).toEqual([]);
    });

    it("should rethrow errors", () => {
      expect(() => {
        return filterScanDirSync({
          cwd: "blah-blah",
          rethrowError: true,
        });
      }).toThrow("no such file or directory");
    });
  });

  describe("async", function () {
    it("should scan all files", async () => {
      const expectFiles = ["a.js", "a.json", "c.js", "dir1/b.blah", "dir1/b.js", "dir1/d.json"];
      const files1 = await filterScanDir("test/fixture-1");

      expect(files1).toEqual(expectFiles);
      const files2 = await filterScanDir({ cwd: "test/fixture-1" });
      expect(files2).toEqual(expectFiles);
    });

    it("should handle passing no options", async () => {
      const save = process.cwd();

      try {
        const files1 = await filterScanDir("test/fixture-1");
        process.chdir("test/fixture-1");

        const files2 = await filterScanDir();
        expect(files2).toEqual(files1);
      } finally {
        process.chdir(save);
      }
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
      expect(files1).toEqual(expectFiles);
      const files2 = await filterScanDir({ cwd: "test", prefix: "fixture-1" });
      expect(files2).toEqual(expectFiles);
    });

    it("should support concurrency 1", async () => {
      const files1 = await filterScanDir({ cwd: "test", sortFiles: true });
      const files2 = await filterScanDir({ cwd: "test", concurrency: 1, sortFiles: true });
      expect((files2 as string[]).sort()).toEqual((files1 as string[]).sort());
    });

    it("should support concurrency 2", async () => {
      const files1 = await filterScanDir("test");
      const files2 = await filterScanDir({ cwd: "test", concurrency: 2 });
      expect((files2 as string[]).sort()).toEqual((files1 as string[]).sort());
    });

    it("should stop scanning when filter return stop flag", async () => {
      const files = await filterScanDir({
        cwd: "test/fixture-1",
        filterDir: (dir) => {
          return { stop: dir === "dir1" };
        },
      });
      expect(files).toEqual(["a.js", "a.json", "c.js"]);
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
      expect(files).toEqual(expectFiles);
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
      expect(files).toEqual(expectFiles);
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
      expect(files).toEqual(expectFiles);
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
      expect(files).toEqual(expectFiles);
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
      expect(files).toEqual(expectFiles);
    });

    it("should ignore and filter exts", async () => {
      const files = await filterScanDir({
        cwd: "test/fixture-1",
        includeDir: true,
        ignoreExt: ["blah"],
        filterExt: ["js", "*.json"],
      });

      expect(files).toEqual(["a.js", "a.json", "c.js", "dir1", "dir1/b.js", "dir1/d.json"]);
    });

    it("should returns only files match filterExt as a string", async () => {
      const files = await filterScanDir({
        cwd: "test/fixture-1",
        ignoreExt: ".blah",
        filterExt: ".json",
      });
      expect(files).toEqual(["a.json", "dir1/d.json"]);
    });

    it("should group directories", async () => {
      const files = await filterScanDir({
        cwd: "test/fixture-1",
        includeDir: true,
        grouping: true,
        filterDir: () => "dir",
        rethrowError: true,
      });
      expect(files).toEqual({
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
      expect(files).toEqual({
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
        }),
      ).toEqual([]);
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
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toContain("no such file or directory");
    });
  });

  describe("symlink handling", function () {
    it("should exclude symlinks to directories when includeDir is false and includeSymlink is not set", () => {
      // This tests the uncovered lines 245-246 in processFile
      const files = filterScanDirSync({
        cwd: "test/fixture-symlink",
        includeDir: false, // Don't include directories
        // includeSymlink is not set (defaults to false/undefined)
      });

      // Should include regular files but not symlinks to directories
      expect(files).toContain("regular.txt");
      expect(files).toContain("subdir/file.js");
      expect(files).not.toContain("link-to-dir"); // symlink to directory should be excluded
      expect(files).not.toContain("link-to-file.txt"); // symlink to file should also be excluded when includeSymlink is not true
    });

    it("should include symlinks when includeSymlink is true", () => {
      const files = filterScanDirSync({
        cwd: "test/fixture-symlink",
        includeDir: false,
        includeSymlink: true, // Explicitly include symlinks
      });

      // Should include regular files and symlinks to files
      expect(files).toContain("regular.txt");
      expect(files).toContain("subdir/file.js");
      expect(files).toContain("link-to-file.txt"); // symlink to file should be included
      // Note: link-to-dir is still excluded because includeDir is false
    });

    it("should handle symlinks with async version", async () => {
      const files = await filterScanDir({
        cwd: "test/fixture-symlink",
        includeDir: false,
        includeSymlink: false, // Explicitly set to false
      });

      // Should include only regular files
      expect(files).toContain("regular.txt");
      expect(files).toContain("subdir/file.js");
      expect(files).not.toContain("link-to-dir");
      expect(files).not.toContain("link-to-file.txt");
    });

    it("should include symlink to directory when includeDir is true", () => {
      const files = filterScanDirSync({
        cwd: "test/fixture-symlink",
        includeDir: true, // Include directories
        includeSymlink: true, // Include symlinks
      });

      // Should include everything
      expect(files).toContain("regular.txt");
      expect(files).toContain("subdir");
      expect(files).toContain("subdir/file.js");
      expect(files).toContain("link-to-dir"); // symlink to directory included
      expect(files).toContain("link-to-file.txt"); // symlink to file included
    });
  });
});
