"use strict";

const { expect } = require("chai");
const fsd = require("../..");

describe("commonjs export", function () {
  it("should have proper exports", () => {
    expect(fsd).to.be.a("function");
    expect(fsd.sync).to.be.a("function");
    expect(fsd.filterScanDir).to.be.a("function");
    expect(fsd.filterScanDirSync).to.be.a("function");
  });

  it("should scan files", async () => {
    const files = await fsd("test/fixture-2");
    expect(files).to.deep.equal(["bar.js", "blah.txt", "foo.js"]);
  });
});
