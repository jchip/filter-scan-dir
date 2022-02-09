# filter-scan-dir

[![License][license-image]][license-url]
[![build][build-image]][build-url]
[![coverage][coverage-image]][coverage-url]

[![Downloads][downloads-image]][downloads-url]

[![npm badge][npm-badge-png]][package-url]

Recursively scan and filter directory for a flat array of files.

- Supports super fast concurrent mode in async version.

- **[API Docs]**
- **[Github]**

# Install

```bash
npm install --save filter-scan-dir
```

# Usage

```ts
import { filterScanDir, filterScanDirSync } from "filter-scan-dir";

// sync
console.log(filterScanDirSync({ cwd: "test" }));

// async
console.log(await filterScanDir({ cwd: "test" }));
```

- **[API Docs]**

# License

Licensed under the [Apache License, Version 2.0](https://www.apache.org/licenses/LICENSE-2.0)

[npm-version-svg]: https://badge.fury.io/js/filter-scan-dir.svg
[package-url]: https://npmjs.com/package/filter-scan-dir
[deps-svg]: https://david-dm.org/filter-scan-dir.svg
[deps-url]: https://david-dm.org/filter-scan-dir
[dev-deps-svg]: https://david-dm.org/filter-scan-dir/dev-status.svg
[dev-deps-url]: https://david-dm.org/filter-scan-dir#info=devDependencies
[license-image]: https://img.shields.io/npm/l/filter-scan-dir.svg
[license-url]: LICENSE
[build-image]: https://github.com/jchip/filter-scan-dir/actions/workflows/node.js.yml/badge.svg
[build-url]: https://github.com/jchip/filter-scan-dir/actions/workflows/node.js.yml
[coverage-image]: https://coveralls.io/repos/github/jchip/filter-scan-dir/badge.svg?branch=main
[coverage-url]: https://coveralls.io/github/jchip/filter-scan-dir?branch=main
[downloads-image]: https://img.shields.io/npm/dm/filter-scan-dir.svg
[downloads-url]: https://npm-stat.com/charts.html?package=filter-scan-dir
[npm-badge-png]: https://nodei.co/npm/filter-scan-dir.png?downloads=true&stars=true
[api docs]: https://jchip.github.io/filter-scan-dir/modules.html#filterScanDir
[github]: https://github.com/jchip/filter-scan-dir
