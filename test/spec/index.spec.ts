"use strict";

import { expect } from "chai";
import fsd from "../..";
import { filterScanDir, filterScanDirSync } from "../..";

describe("commonjs export", function () {
  it("should have proper exports", async () => {
    expect(fsd).to.be.a("function");
    expect(fsd.sync).to.be.a("function");
    expect(fsd.filterScanDir).to.be.a("function");
    expect(fsd.filterScanDirSync).to.be.a("function");
    expect(filterScanDir).to.be.a("function");
    expect(filterScanDirSync).to.be.a("function");
    expect(fsd.filterScanDir).to.equal(filterScanDir);
    expect(fsd.filterScanDirSync).to.equal(filterScanDirSync);
  });

  it("should scan files", async () => {
    const files = await fsd("test/fixture-2");
    expect(files).to.deep.equal(["bar.js", "blah.txt", "foo.js"]);
  });
});
