"use strict";

import { describe, it, expect } from "vitest";
import { filterScanDir, filterScanDirSync } from "../../src/index.ts";

describe("exports", function () {
  it("should have proper exports", async () => {
    expect(typeof filterScanDir).toBe("function");
    expect(typeof filterScanDirSync).toBe("function");
  });

  it("should scan files", async () => {
    const files = await filterScanDir("test/fixture-2");
    expect(files).toEqual(["bar.js", "blah.txt", "foo.js"]);
  });

  it("should scan files with sync api", async () => {
    const sfiles = filterScanDirSync("test/fixture-2");
    expect(sfiles).toEqual(["bar.js", "blah.txt", "foo.js"]);
  });
});
