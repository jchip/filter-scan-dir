import { expect } from "chai";
import { direntCmp } from "../../src/dirent-cmp";

describe("dirent-cmp", function () {
  it("should compare elements", () => {
    expect(direntCmp({ name: "abc" } as any, { name: "abc" } as any)).equal(0);
    expect(direntCmp({ name: "xyz" } as any, { name: "abc" } as any)).equal(1);
    expect(direntCmp({ name: "abc" } as any, { name: "xyz" } as any)).equal(-1);
  });
});
