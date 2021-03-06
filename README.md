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

| name           | description                                                                | default         |
| -------------- | -------------------------------------------------------------------------- | --------------- |
| `cwd`          | current working directory to start scanning                                | `process.cwd()` |
| `prefix`       | prefix to add to the paths to scan                                         |                 |
| `prependCwd`   | prepend CWD to paths returned                                              | `false`         |
| `filter`       | callback to filter files. it should return filter result.                  |                 |
| `ignoreExt`    | array or string of extensions to ignore. ext must include `.`, ie: `".js"` |                 |
| `filterExt`    | array or string of extensions to include only, apply after `ignoreExt`.    |                 |
| `filterDir`    | callback to filter directories. it should return filter result             |                 |
| `includeDir`   | include directories in result if `true`                                    |                 |
| `grouping`     | enable [grouping](#grouping) if `true`                                     |                 |
| `maxLevel`     | zero base max level of directories to recurse into                         | `Infinity`      |
| `rethrowError` | set to `true` to throw errors instead of ignoring them                     | `false`         |

`filterDir` and `filter` callback signature:

```js
function filter(file, path, extras) {}
```

params:

| name              | description                                    |
| ----------------- | ---------------------------------------------- |
| `file`            | name of the file being considered              |
| `path`            | path to directory being processed              |
| `extras.stat`     | result of `fs.stat` on the file                |
| `extras.dirFile`  | `Path.join(path, file)`                        |
| `extras.ext`      | extension of the file including `.`, ie: `.js` |
| `extras.noExt`    | file name without the extension                |
| `extras.fullFile` | `Path.join(cwd, path, file)`                   |

should return filter result:

- `false` - skip the file or directory
- _string_ - name of the group to add the file or directory (need to enable [grouping](#grouping))
- _object_ - `{ group, skip, stop }` where:
  - `group` - name of the group to add the file or directory (need to enable [grouping](#grouping))
  - `skip` - if `true` then skip the file or directory, else add it.
  - `stop` - stop the scanning and return the result immediately

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

## Path Separator

By default all paths generated always use forward slash `/` as separator, even on Windows.

If you really want to force using Windows `\`, then you can pass in `options._path`:

```js
const path = require("path");
scanDir({ dir: "test", _path: path });
```

> Internally this is default to `require("path").posix`.

If you only want to keep `\` in the dir you passed in, then you can just set `_path` to `path.posix`.

# License

Licensed under the [Apache License, Version 2.0](https://www.apache.org/licenses/LICENSE-2.0)
