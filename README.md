## kx-file-lister-sync

Content listing in directories using Node.js. Supporting recursion, detailed output, blacklists, whitelists, size formatters.
Synchronous only.

## Example

Basic usage:

```javascript
const fl = new (require('kx-file-lister-sync'))();
const list = fl.listFiles('../some/folder', true); // true for RECURSIVE
console.log(list)
```
Output:
```
[ '..\\some\\backgorund.js',
  '..\\some\\manifest.js',
  '..\\some\\docs\\cv.ods' ]
```

More examples at the bottom.

## API

```javascript
const KFLS = require('kx-file-lister-sync');
let fl = new KFLS(opts);
```

### Constructor

File lister exports a class, therefore it must be instantiated with ``new`` keyword. Object params ``opts`` is optional.

#### opts

Object opts is passed to contructor. It accepts these properties:

#### detailed

If set to `true` it will list objects with properties listed in `details` params. `false` for plain string filepaths.
Defaults to `false`

#### details

Either `'all'` or an array of strings. Each string represents which detail will be returned along with full path, path and file name.
These 3 properties are always present. Refer to stat function of 'fs' module for more options. Defaults to `['size']`

#### blackList

Array of strings or `RegExp`s, or both. Each file will be checked by each blackList entry if it matches it will not be listed.
Matching is done by `String.prototype.endsWith` function, while regexps are checked by `RegExp.prototype.test`.
Only works if whiteList is empty or null. Defaults to `[]`

#### whiteList

Does the opposite of what blackList does. If whiteList is specified and has at least one element, all listings ignore blackList
and use whiteList instead. Empty by default.

#### sizeFormatter

Value of this property must be a function and should take one `Number` param (file size in bytes) and output anything.
Decorator for file size.

#### showHidden

Does not output entries that start with period. Defaults to `false`.

#### sortByName

Whether to sort output entries by name. If set to `false` (default) it will sort output entries by 'directories first'.
Defaults to `false`.

### listFiles(dirPath[, recursive, maxDepth])

Lists all files in directories and possibly subdirectories.
  * `dirPath` target directory path
  * `recursive` also lists subdirectories if `true`. Defaults to `false`
  * `maxDepth` do not dive into subdirectories deeper than this number. 0 for just target directory, 1 for target directory
  and their direct subdirectories, `n`

### listOneDir(dirPath)

Lists files AND DIRECTORIES in target directory.

  * `dirPath` target directory path

### listFilesTree(dirPath[, maxDepth])

Lists files into a deep array, mapping fs's tree structure. 

  * `dirPath` target directory path
  * `maxDepth` do not dive into subdirectories deeper than this number
  
## Examples

Code:

```javascript
const KFLS = require('kx-file-lister-sync');
const fl = new KFLS({
    detailed: true,
    sortByName: true,
    whiteList: [/m[ao]/,'.js']
});
const result = fl.listFiles('someDir')
console.log(result);
```

Outputs to:
```
[ { dir: false,
    name: 'backgorund.js',
    path: 'someDir\\4money.js',
    full: 'C:\\Users\\kxgh\\projs\\some\\backgorund.js',
    size: 4096 },
  { dir: false,
    name: 'manifest.js',
    path: 'someDir\\manifest.js',
    full: 'C:\\Users\\kxgh\\projs\\some\\manifest.js',
    size: 546861 } ]
```
---

Code:

```javascript
const KFLS = require('kx-file-lister-sync');
const fl = new KFLS();
const result = fl.listFilesTree('ourTarget')
console.log(result);
```

Outputs to:
```
[ [ [ 'ourTarget\\docs\\photos\\pic.jpg',
      'ourTarget\\docs\\photos\\pic2.jpg' ],
    'ourTarget\\docs\\cv.ods' ],
  'ourTarget\\backgorund.js',
  'ourTarget\\manifest.js' ]
```
---

Code:

```javascript
const KFLS = require('kx-file-lister-sync');
const fl = new KFLS({
    details: ['size', 'birthtime'],
    blackList: [/manifest/i]
});
const result = fl.listOneDir('ourTarget')
console.log(result);
```

Outputs to:

```
[ { dir: true,
    name: 'docs',
    path: 'ourTarget\\docs',
    full: 'C:\\Users\\kxgh\\projs\\ourTarget\\docs',
    size: 0,
    birthtime: 2020-04-03T18:37:02.426Z },
  { dir: false,
    name: 'backgorund.js',
    path: 'ourTarget\\backgorund.js',
    full: 'C:\\Users\\kxgh\\projs\\ourTarget\\backgorund.js',
    size: 2224,
    birthtime: 2020-04-03T18:36:40.349Z } ]
```
