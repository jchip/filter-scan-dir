import Path from "path";
import { describe, it, expect } from "vitest";
import { direntCmp, join2 } from "../../src/util.ts";

describe("dirent-cmp", function () {
  it("should compare elements", () => {
    expect(direntCmp({ name: "abc" } as any, { name: "abc" } as any)).toBe(0);
    expect(direntCmp({ name: "xyz" } as any, { name: "abc" } as any)).toBe(1);
    expect(direntCmp({ name: "abc" } as any, { name: "xyz" } as any)).toBe(-1);
  });
});

describe("join2", function () {
  it("should join simple paths", () => {
    expect(join2(Path.sep, "x", "y")).toBe(Path.join("x", "y"));
    expect(join2("/", "a/b", "c")).toBe("a/b/c");
    expect(join2("\\", "a\\b", "c")).toBe("a\\b\\c");
  });

  it("should handle edge cases", () => {
    expect(join2("/", "", "x")).toBe("x");
    expect(join2("/", "x", "")).toBe("x");
    expect(join2("/", ".", "x")).toBe("x");
    expect(join2("/", "x", ".")).toBe("x");
    expect(join2("/")).toBe(".");
    expect(join2("/", "")).toBe(".");
    expect(join2("/", ".")).toBe(".");
  });

  it("should handle normalized paths", () => {
    expect(join2("/", "/absolute/path", "file.txt")).toBe("/absolute/path/file.txt");
    expect(join2("/", "relative/path", "file.txt")).toBe("relative/path/file.txt");
  });
});
