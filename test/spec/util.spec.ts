import Path from "path";
import { expect } from "chai";
import { direntCmp, makePathJoin2 } from "../../src/util";

describe("dirent-cmp", function () {
  it("should compare elements", () => {
    expect(direntCmp({ name: "abc" } as any, { name: "abc" } as any)).equal(0);
    expect(direntCmp({ name: "xyz" } as any, { name: "abc" } as any)).equal(1);
    expect(direntCmp({ name: "abc" } as any, { name: "xyz" } as any)).equal(-1);
  });
});

describe("path join2", function () {
  it("should behave like path.join", () => {
    const join2 = makePathJoin2(Path.sep, "", "");
    expect(join2()).to.equal(Path.join());
    expect(join2("")).to.equal(Path.join(""));
    expect(join2(".")).to.equal(Path.join("."));
    expect(join2("..")).to.equal(Path.join(".."));
    expect(join2("x")).to.equal(Path.join("x"));
    expect(join2(".", ".")).to.equal(Path.join(".", "."));
    expect(join2("", ".")).to.equal(Path.join("", "."));
    expect(join2("..", ".")).to.equal(Path.join("..", "."));
    expect(join2(".", "..")).to.equal(Path.join(".", ".."));
    expect(join2("x", "y")).to.equal(Path.join("x", "y"));
  });

  it("should use path.join for special cwd or prefix", () => {
    expect(makePathJoin2(Path.sep, "./", "")).to.equal(Path.join);
    expect(makePathJoin2(Path.sep, "", "./")).to.equal(Path.join);
    expect(makePathJoin2(Path.sep, "../", "./")).to.equal(Path.join);
    expect(makePathJoin2(Path.sep, "./", "../")).to.equal(Path.join);
  });
});
