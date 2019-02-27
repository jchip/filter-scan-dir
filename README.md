# filter-scan-dir

Recursively scan and filter directory for a flat array of files.

# Install

```bash
npm install --save filter-scan-dir
```

# Usage

```js
const filterScanDir = require("filter-scan-dir");

// sync
const files = filterScanDir.sync({ dir: "test" });
console.log(files);

// async
filterScanDir({ dir: "test" }).then(files => {
  console.log(files);
});

console.log(await filterScanDir({ dir: "test" }));
```

## API

`filterScanDir(options)` or `filterScanDir(dir)`

Sync version: `filterScanDir.sync`

`options`:

- `dir` - directory to scan
- `includeRoot` - add the root dir passed in to the result
- `filter` - callback to filter files, `falsy` to skip, `truthy` to include file.
- `ignoreExt` - array of extensions to ignore. ext must include `.`, ie: `".js"`
- `filterExt` - array of extensions to include, apply after `ignoreExt`.
- `filterDir` - callback to filter directories. Directory is skipped if this returns `false`
- `includeDir` - include directories in result
- `grouping` - enable [grouping](#grouping) if `true`

`filterDir` and `filter` callback signature:

```js
function filter(file, path, extras) {}
```

- `file` - name of the file being considered
- `path` - path to directory being processed
- `extras.stat` - result of `fs.stat` on the file
- `extras.dirFile` - `Path.join(path, file)`
- `extras.ext` - extension of the file
- `extras.noExt` - file name without the extension
- `extras.fullFile` - `Path.join(rootDir, path, file)` - `rootDir` is dir passed in to `filterScanDir`

## grouping

If `grouping` is true, then the results will be grouped in an object.

The `filter` and `filterDir` callback can return a non-empty string as the label of a group.

Assuming `filter` returns `"group1"` and `"group2"` for some files, the return value will be an object:

```js
{
  // default group, when filter callback returns non-string truthy value
  files: [ "foo" ],
  // other groups
  group1: [ "file1" ],
  group2: [ "file2" ]
}
```

# License

Licensed under the [Apache License, Version 2.0](https://www.apache.org/licenses/LICENSE-2.0)
