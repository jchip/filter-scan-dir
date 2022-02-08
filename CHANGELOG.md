# v1.5.0

- add `fullStat` option to allow enable using the `withFileTypes` option of readdir for huge performance boost (requires node.js 10.10+) [node.js docs](https://nodejs.org/api/fs.html#fsreaddirpath-options-callback).
- add `concurrency` option to allow using concurrent mode in async version for massive performance boost.
- convert to typescript

# v1.4.1

- use fs.lstat instead of fs.stat

# v1.4.0

- process files before directories

# v1.3.0

- `sortFiles` option
- support filter callbacks returning `result.formatName`
- CI
- readme badges
