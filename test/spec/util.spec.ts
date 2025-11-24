import Path from "path";
import { describe, it, expect } from "vitest";
import { direntCmp, makePathJoin2 } from "../../src/util.ts";

describe("dirent-cmp", function () {
  it("should compare elements", () => {
    expect(direntCmp({ name: "abc" } as any, { name: "abc" } as any)).toBe(0);
    expect(direntCmp({ name: "xyz" } as any, { name: "abc" } as any)).toBe(1);
    expect(direntCmp({ name: "abc" } as any, { name: "xyz" } as any)).toBe(-1);
  });
});

describe("path join2", function () {
  it("should behave like path.join", () => {
    const join2 = makePathJoin2(Path.sep, "", "");
    expect(join2()).toBe(Path.join());
    expect(join2("")).toBe(Path.join(""));
    expect(join2(".")).toBe(Path.join("."));
    expect(join2("..")).toBe(Path.join(".."));
    expect(join2("x")).toBe(Path.join("x"));
    expect(join2(".", ".")).toBe(Path.join(".", "."));
    expect(join2("", ".")).toBe(Path.join("", "."));
    expect(join2("..", ".")).toBe(Path.join("..", "."));
    expect(join2(".", "..")).toBe(Path.join(".", ".."));
    expect(join2("x", "y")).toBe(Path.join("x", "y"));
  });

  it("should use path.join for special cwd or prefix", () => {
    expect(makePathJoin2(Path.sep, "./", "")).toBe(Path.join);
    expect(makePathJoin2(Path.sep, "", "./")).toBe(Path.join);
    expect(makePathJoin2(Path.sep, "../", "./")).toBe(Path.join);
    expect(makePathJoin2(Path.sep, "./", "../")).toBe(Path.join);
  });
});
